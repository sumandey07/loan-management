import os
import uuid
from typing import List
import json
from llm_advisor import llm_final_offer
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Header
from fastapi.responses import FileResponse
from models import (
    EligibilityForm,
    EligibilityResp,
    ChatMessage,
    LoginIn,
    AdminLoginIn,
    RiskRequest,
    ApplicationIn,
    ApplicationUpdate,
    ApplicationOut,
    TokenResp,
    AdminTokenResp,
    RegisterIn,
)
from routes.document_verification import router as document_router
from pydantic import BaseModel
from sqlmodel import select
from llm import get_llm
from models import (
    User,
    LoanApplication,
    CollateralValuation,
    DocumentMeta,
    Admin,
    get_session,
    init_db,
)

from auth import hash_password, authenticate_user, create_access_token, decode_token
from risk_engine import rule_based_risk_check
from llm_utils import assess_risk_with_llm, generate_offers_with_llm
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from routes.kyc_verify_otp import router as kyc_otp_router
from routes.kyc_verify import router as kyc_router

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

DOCUMENT_DISPLAY_NAMES = {
    "salary_slip": "income_proof",
    "bank_statement": "bank_document",
    "property_doc": "property_document",
    "gold_doc": "gold_document",
}


def get_document_display_filename(doc: DocumentMeta) -> str:
    extension = os.path.splitext(doc.filename)[1].lower() or ".pdf"
    name = DOCUMENT_DISPLAY_NAMES.get(doc.doc_type, "uploaded_document")
    return f"{name}{extension}"


EDITABLE_STATUSES = {"draft", "submitted", "verification_pending"}


def get_user_application_number(session, user_id: int, app_id: int) -> int:
    user_apps = session.exec(
        select(LoanApplication)
        .where(LoanApplication.user_id == user_id)
        .order_by(LoanApplication.id.asc())
    ).all()

    for index, app in enumerate(user_apps, start=1):
        if app.id == app_id:
            return index

    return 1


def compute_valuation(
    session,
    collateral_type: str,
    region: str | None,
    size_sqft: float | None = None,
    purity: str | None = None,
    gold_weight_grams: float | None = None,
) -> float | None:
    if collateral_type == "property" and region and size_sqft:
        stmt = select(CollateralValuation).where(
            CollateralValuation.region == region,
            CollateralValuation.asset_type == "residential_flat",
        )
        cv = session.exec(stmt).first()
        if cv:
            return cv.avg_price * size_sqft
    if collateral_type == "gold" and region and purity and gold_weight_grams:
        stmt = select(CollateralValuation).where(
            CollateralValuation.region == region,
            CollateralValuation.asset_type == f"gold_{purity}",
        )
        cv = session.exec(stmt).first()
        if cv:
            return cv.avg_price * gold_weight_grams
    return None


app = FastAPI()


@app.on_event("startup")
def startup():
    init_db()


app.include_router(kyc_otp_router, prefix="/kyc", tags=["KYC"])
app.include_router(kyc_router, prefix="/kyc", tags=["KYC"])
app.include_router(document_router, prefix="/kyc", tags=["KYC"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = get_llm()


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Mortgage Loan API",
        version="1.0.0",
        description="API for loan automation",
        routes=app.routes,
    )

    # Add Bearer Token Scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
    }

    # Optionally apply globally
    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# --------- Auth endpoints ----------
@app.post("/checkEligibility", response_model=EligibilityResp)
def eligibleUser(payload: EligibilityForm):
    eligible = True
    amount_eligible = None

    if eligible:
        if payload.age < 21 or payload.age > 65:
            eligible = False
        elif payload.annual_income < 300000:
            eligible = False
        elif payload.credit_score < 650:
            eligible = False
        else:
            if 650 <= payload.credit_score < 700:
                amount_eligible = 3 * payload.annual_income
            elif 701 <= payload.credit_score < 750:
                amount_eligible = 4 * payload.annual_income
            else:
                amount_eligible = 5 * payload.annual_income

    return {"eligible": eligible, "amount_eligible": amount_eligible}


@app.post("/register", response_model=TokenResp)
def register(payload: RegisterIn):
    session = get_session()
    existing = session.exec(
        select(User).where(User.username == payload.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="username already exists")

    user = User(
        username=payload.username,
        full_name=payload.full_name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        consent_accepted=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    session.close()

    access_token = create_access_token({"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/login", response_model=TokenResp)
def login(payload: LoginIn):
    user = authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


# --------- Dependency to get current user ----------
def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    uid = int(payload.get("sub"))
    session = get_session()
    user = session.get(User, uid)
    session.close()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


@app.get("/dashboard")
def dashboard_snapshot(user=Depends(get_current_user)):
    session = get_session()
    stmt = (
        select(LoanApplication)
        .where(LoanApplication.user_id == user.id)
        .order_by(LoanApplication.created_at.desc())
    )
    app_obj = session.exec(stmt).first()
    session.close()
    snapshot = {
        "full_name": user.full_name,
        "latest_application": {
            "id": app_obj.id if app_obj else None,
            "status": app_obj.status if app_obj else None,
            "requested_amount": app_obj.requested_amount if app_obj else None,
            "credit_score": app_obj.credit_score if app_obj else None,
        },
    }
    return snapshot


def apply_llm_review(app_obj, reviewed_by="llm"):
    llm_result = llm_final_offer(
        summary={
            "requested_amount": app_obj.requested_amount,
            "tenure_years": app_obj.tenure_years,
            "valuation_estimate": app_obj.valuation_estimate,
            "existing_emi": app_obj.existing_emi,
        },
        user_data={
            "credit_score": app_obj.credit_score,
            "annual_income": app_obj.annual_income,
            "collateral_type": app_obj.collateral_type,
            "region": app_obj.region,
        },
    )

    app_obj.llm_risk_level = llm_result.get("risk_level") or llm_result.get("risk")
    app_obj.llm_max_loan = llm_result.get("max_loan_amount")
    app_obj.llm_recommended_roi = llm_result.get("recommended_roi")
    app_obj.llm_explanation = llm_result.get("explanation")
    app_obj.llm_reviewed_at = datetime.now(IST)
    app_obj.reviewed_by = reviewed_by
    return llm_result


@app.post("/applications")
def create_application(payload: ApplicationIn, user=Depends(get_current_user)):
    session = get_session()
    valuation = compute_valuation(
        session,
        payload.collateral_type,
        payload.region,
        size_sqft=payload.size_sqft,
        purity=payload.purity,
        gold_weight_grams=payload.gold_weight_grams,
    )
    if payload.collateral_type == "property":
        app_obj = LoanApplication(
            user_id=user.id,
            collateral_type=payload.collateral_type,
            requested_amount=payload.requested_amount,
            tenure_years=payload.tenure_years,
            credit_score=payload.credit_score,
            existing_emi=payload.existing_emi,
            region=payload.region,
            size_sqft=payload.size_sqft,
            valuation_estimate=valuation,
            annual_income=payload.annual_income,
        )
    elif payload.collateral_type == "gold":
        app_obj = LoanApplication(
            user_id=user.id,
            collateral_type=payload.collateral_type,
            requested_amount=payload.requested_amount,
            tenure_years=payload.tenure_years,
            credit_score=payload.credit_score,
            existing_emi=payload.existing_emi,
            region=payload.region,
            gold_weight_grams=payload.gold_weight_grams,
            purity=payload.purity,
            valuation_estimate=valuation,
            annual_income=payload.annual_income,
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid collateral_type")

    apply_llm_review(app_obj)
    session.add(app_obj)
    session.commit()
    session.refresh(app_obj)
    application_number = get_user_application_number(session, user.id, app_obj.id)
    session.close()
    return {
        "application_id": app_obj.id,
        "application_number": application_number,
        "valuation_estimate": valuation,
        "status": app_obj.status,
        "reviewed_by": app_obj.reviewed_by,
        "llm_reviewed_at": app_obj.llm_reviewed_at,
        "llm_risk_level": app_obj.llm_risk_level,
        "llm_max_loan": app_obj.llm_max_loan,
        "llm_recommended_roi": app_obj.llm_recommended_roi,
        "llm_explanation": app_obj.llm_explanation,
    }


@app.post("/applications/{app_id}/submit")
def submit_application(app_id: int, user=Depends(get_current_user)):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)
    if not app_obj or app_obj.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    if app_obj.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft applications can be submitted",
        )
    apply_llm_review(app_obj)
    app_obj.status = "submitted"
    session.add(app_obj)
    session.commit()
    session.refresh(app_obj)
    session.close()
    return {
        "application_id": app_id,
        "status": app_obj.status,
        "reviewed_by": app_obj.reviewed_by,
        "llm_reviewed_at": app_obj.llm_reviewed_at,
        "llm_risk_level": app_obj.llm_risk_level,
        "llm_max_loan": app_obj.llm_max_loan,
        "llm_recommended_roi": app_obj.llm_recommended_roi,
        "llm_explanation": app_obj.llm_explanation,
    }


# --------- Upload document ----------
@app.post("/applications/{app_id}/upload")
async def upload_document(
    app_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    document_id: int | None = Form(None),
    user=Depends(get_current_user),
):
    if file.content_type not in ("application/pdf", "image/png", "image/jpeg"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    session = get_session()
    app_obj = session.get(LoanApplication, app_id)
    if not app_obj or app_obj.user_id != user.id:
        session.close()
        raise HTTPException(status_code=404, detail="Application not found")

    existing_doc = None
    if document_id is not None:
        existing_doc = session.get(DocumentMeta, document_id)
        if (
            not existing_doc
            or existing_doc.application_id != app_id
            or existing_doc.user_id != user.id
        ):
            session.close()
            raise HTTPException(status_code=404, detail="Document not found")

    filename = f"{uuid.uuid4().hex}_{file.filename}"
    dest_path = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(dest_path, "wb") as buffer:
        buffer.write(content)

    doc = existing_doc or DocumentMeta(application_id=app_id, user_id=user.id)
    old_filename = doc.filename if existing_doc else None
    doc.doc_type = doc_type
    doc.filename = filename
    doc.mime_type = file.content_type
    doc.size_bytes = len(content)
    session.add(doc)
    session.commit()
    session.refresh(doc)
    session.close()
    if old_filename and old_filename != filename:
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)
    return {
        "doc_id": doc.id,
        "filename": filename,
        "display_filename": get_document_display_filename(doc),
        "doc_type": doc_type,
        "size_bytes": doc.size_bytes,
    }


@app.post("/admin/login", response_model=AdminTokenResp)
def admin_login(payload: AdminLoginIn):
    session = get_session()
    stmt = select(Admin).where(Admin.username == payload.username)
    admin = session.exec(stmt).first()
    session.close()

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    from auth import verify_password

    if not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    access_token = create_access_token({"admin_id": admin.id, "role": "admin"})
    return {"access_token": access_token, "username": admin.username}


def get_current_admin(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.split(" ")[1]
    payload = decode_token(token)

    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")

    admin_id = int(payload.get("admin_id"))

    session = get_session()
    admin = session.get(Admin, admin_id)
    session.close()

    if not admin:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return admin


@app.get("/admin/me")
def get_admin_identity(admin=Depends(get_current_admin)):
    return {"username": admin.username}


@app.get("/admin/customers")
def list_customers(admin=Depends(get_current_admin)):
    session = get_session()
    users = session.exec(select(User)).all()
    session.close()
    return {"customers": [u.dict() for u in users]}


@app.get("/admin/applications")
def list_all_applications(admin=Depends(get_current_admin)):
    session = get_session()
    apps = session.exec(select(LoanApplication)).all()
    session.close()
    return {"applications": [a.dict() for a in apps]}


@app.post("/admin/applications/{app_id}/update-status")
def admin_update_application_status(
    app_id: int,
    new_status: str = Form(...),  # approved or rejected
    rejection_reason: str = Form(None),
    admin=Depends(get_current_admin),
):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)

    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    if new_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    app_obj.status = new_status
    app_obj.reviewed_by = "system"
    app_obj.llm_reviewed_at = datetime.now(IST)
    if new_status == "rejected" and rejection_reason:
        app_obj.rejection_reason = rejection_reason
    session.add(app_obj)
    session.commit()
    session.refresh(app_obj)
    session.close()

    return {
        "message": "Status updated",
        "application_id": app_id,
        "new_status": new_status,
        "rejection_reason": (
            app_obj.rejection_reason if new_status == "rejected" else None
        ),
    }


@app.post("/applications/{app_id}/assess")
def assess_application(app_id: int, user=Depends(get_current_user)):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)
    if not app_obj or app_obj.user_id != user.id:
        raise HTTPException(status_code=404, detail="application not found")

    payload = {
        "user_id": user.id,
        "requested_amount": app_obj.requested_amount,
        "tenure_years": app_obj.tenure_years,
        "credit_score": app_obj.credit_score,
        "existing_emi": app_obj.existing_emi,
        "annual_income": app_obj.annual_income,
        "valuation_estimate": app_obj.valuation_estimate,
        "collateral_type": app_obj.collateral_type,
        "region": app_obj.region,
        "size_sqft": app_obj.size_sqft,
        "purity": app_obj.purity,
        "gold_weight_grams": app_obj.gold_weight_grams,
    }
    result = assess_risk_with_llm(payload)
    session.close()
    return {"assessment": result}


@app.post("/applications/{app_id}/offers")
def generate_offers(app_id: int, user=Depends(get_current_user)):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)
    if not app_obj or app_obj.user_id != user.id:
        raise HTTPException(status_code=404, detail="application not found")

    payload = {
        "requested_amount": app_obj.requested_amount,
        "tenure_years": app_obj.tenure_years,
        "credit_score": app_obj.credit_score,
        "annual_income": app_obj.annual_income,
        "valuation_estimate": app_obj.valuation_estimate,
        "existing_emi": app_obj.existing_emi,
    }
    offers = generate_offers_with_llm(payload)
    session.close()
    return offers


@app.get("/admin/collateral-vals")
def list_collateral_vals():
    session = get_session()
    rows = session.exec(select(CollateralValuation)).all()
    session.close()
    return {"regions": [r.model_dump() for r in rows]}


@app.post("/risk/final")
async def risk_final(payload: RiskRequest):
    summary = rule_based_risk_check(
        income=payload.income,
        loan_amount=payload.loan_amount,
        credit_score=payload.credit_score,
        collateral_value=payload.collateral_value,
    )
    final = assess_risk_with_llm(payload.dict())
    return {"precheck": summary, "llm_decision": final}


@app.get("/applications/mine")
def list_my_applications(user=Depends(get_current_user)):
    session = get_session()
    stmt = (
        select(LoanApplication)
        .where(LoanApplication.user_id == user.id)
        .order_by(LoanApplication.id.asc())
    )
    rows = session.exec(stmt).all()

    apps = []
    for index, r in enumerate(rows, start=1):
        apps.append(
            {
                "id": r.id,
                "application_number": index,
                "created_at": r.created_at if r.created_at else None,
                "status": r.status,
                "requested_amount": r.requested_amount,
                "tenure_years": r.tenure_years,
                "credit_score": r.credit_score,
                "collateral_type": r.collateral_type,
                "region": r.region,
                "size_sqft": r.size_sqft,
                "valuation_estimate": r.valuation_estimate,
                "existing_emi": r.existing_emi,
                "annual_income": r.annual_income,
                "gold_weight_grams": r.gold_weight_grams,
                "purity": r.purity,
                "rejection_reason": r.rejection_reason,
            }
        )

    session.close()
    return {"applications": apps}


@app.get("/applications/{app_id}", response_model=ApplicationOut)
def get_application(app_id: int, user=Depends(get_current_user)):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)
    session.close()
    if not app_obj or app_obj.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj


@app.put("/applications/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: int,
    payload: ApplicationUpdate,
    user=Depends(get_current_user),
):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)

    if not app_obj or app_obj.user_id != user.id:
        session.close()
        raise HTTPException(status_code=404, detail="Application not found")

    if app_obj.status not in EDITABLE_STATUSES:
        session.close()
        raise HTTPException(
            status_code=403,
            detail="Application cannot be edited after approval or rejection",
        )

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "region" and value == "":
            setattr(app_obj, field, None)
        else:
            setattr(app_obj, field, value)

    effective_collateral_type = app_obj.collateral_type

    if effective_collateral_type == "property":
        app_obj.gold_weight_grams = None
        app_obj.purity = None
    elif effective_collateral_type == "gold":
        app_obj.size_sqft = None

    app_obj.valuation_estimate = compute_valuation(
        session,
        effective_collateral_type,
        app_obj.region,
        size_sqft=app_obj.size_sqft,
        purity=app_obj.purity,
        gold_weight_grams=app_obj.gold_weight_grams,
    )

    session.add(app_obj)
    session.commit()
    session.refresh(app_obj)
    session.close()

    return app_obj


@app.post("/chat")
async def chat_endpoint(payload: ChatMessage):
    try:
        user_text = payload.message

        prompt = f"""
            You are an AI Mortgage & Loan Compliance Assistant for customers in India.
            You answer politely, clearly, and in short, simple explanations.
            Your answers must follow RBI guidelines, Indian banking practices, and (when applicable) state-specific rules for stamp duty, registration, mortgage, and property norms.
            Always prioritize RBI rules first.
            You may explain guidelines for home loans, mortgage loans, loan against property, personal loans, education loans, MSME loans, interest rates, LTV ratio norms, foreclosure rules, EMI, documentation, valuation, eligibility, and loan status.
            If a state is not specified, assume India in general.
            If a question is unclear, ask for more details.
            Do not fabricate rules — only use widely known RBI and state guidelines.
            Provide answers in a friendly, professional, and easy-to-understand way.
        User asked: {user_text}
        """.strip()

        llm = get_llm()

        # WORKING CALL — your model only accepts a single string
        completion = llm.invoke(prompt)

        # Some models return an AIMessage object, others return a plain string
        reply = (
            completion.content if hasattr(completion, "content") else str(completion)
        )

        return {"response": reply}

    except Exception as e:
        print("Chatbot error:", e)
        return {"response": "The chatbot encountered an error."}


from datetime import datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


@app.post("/admin/applications/{app_id}/llm-review")
def admin_llm_review(
    app_id: int,
    admin=Depends(get_current_admin),
):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)

    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    # 🔐 Only allow LLM review for submitted apps
    if app_obj.status != "submitted":
        raise HTTPException(
            status_code=400,
            detail="LLM review allowed only for submitted applications",
        )

    llm_result = apply_llm_review(app_obj)

    # ---- Persist results ----
    app_obj.llm_risk_level = llm_result.get("risk")
    app_obj.llm_max_loan = llm_result.get("max_loan_amount")
    app_obj.llm_recommended_roi = llm_result.get("recommended_roi")
    app_obj.llm_explanation = llm_result.get("explanation")

    session.commit()
    session.refresh(app_obj)
    session.close()

    return {
        "message": "LLM underwriting review completed",
        "llm_review": llm_result,
    }


# final loan generation
@app.post("/applications/{app_id}/finalize")
async def finalize_application(
    app_id: int,
    offer_id: str = Form(...),
    aadhaar_number: str = Form(...),
    pan_number: str = Form(...),
    property_doc: UploadFile | None = File(None),
    selected_doc_id: int | None = Form(None),
    user=Depends(get_current_user),
):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)

    if not app_obj or app_obj.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    if property_doc is None and selected_doc_id is None:
        raise HTTPException(
            status_code=400, detail="Provide a document or select an existing one"
        )

    if selected_doc_id is not None:
        existing_doc = session.get(DocumentMeta, selected_doc_id)
        if not existing_doc or existing_doc.application_id != app_id:
            raise HTTPException(status_code=404, detail="Selected document not found")
        if existing_doc.mime_type not in ("application/pdf", "image/png", "image/jpeg"):
            raise HTTPException(
                status_code=400, detail="Invalid existing document type"
            )
        # Use existing document metadata without re-uploading
        property_doc_filename = existing_doc.filename
        property_doc_mime = existing_doc.mime_type
        property_doc_content = None
    else:
        if property_doc.content_type not in (
            "application/pdf",
            "image/png",
            "image/jpeg",
        ):
            raise HTTPException(status_code=400, detail="Invalid file type")

        filename = f"{uuid.uuid4().hex}_{property_doc.filename}"
        dest_path = os.path.join(UPLOAD_DIR, filename)
        with open(dest_path, "wb") as buffer:
            content = await property_doc.read()
            buffer.write(content)

        doc = DocumentMeta(
            application_id=app_id,
            user_id=user.id,
            doc_type="property_document",
            filename=filename,
            mime_type=property_doc.content_type,
            size_bytes=len(content),
        )
        session.add(doc)
        session.commit()
        session.refresh(doc)
        property_doc_filename = filename
        property_doc_mime = property_doc.content_type
        property_doc_content = None

    # --- Get offers again to pull full offer details ---
    offers_data = generate_offers_with_llm(
        {
            "requested_amount": app_obj.requested_amount,
            "tenure_years": app_obj.tenure_years,
            "credit_score": app_obj.credit_score,
            "annual_income": app_obj.annual_income,
            "valuation_estimate": app_obj.valuation_estimate,
            "existing_emi": app_obj.existing_emi,
        }
    )

    offers_list = offers_data.get("offers", [])
    selected_offer = next(
        (o for o in offers_list if str(o["offer_id"]) == str(offer_id)), None
    )

    if not selected_offer:
        raise HTTPException(status_code=400, detail="Invalid offer_id selected")

    # --- Mask Aadhaar & PAN ---
    masked_aadhaar = (
        aadhaar_number[:-4].replace(aadhaar_number[:-4], "XXXXXXXX")
        + aadhaar_number[-4:]
    )
    masked_pan = pan_number[0] + "XXXX" + pan_number[-1]

    # --- Update Loan Application ---
    app_obj.status = "submitted"
    app_obj.selected_offer_id = offer_id
    app_obj.aadhaar_number = masked_aadhaar
    app_obj.pan_number = masked_pan
    session.add(app_obj)
    session.commit()

    # --- Generate final sanction summary ---
    app_number = get_user_application_number(session, user.id, app_obj.id)
    final_summary = {
        "loan_id": f"LN-{app_number:06}",
        "application_number": app_number,
        "applicant_name": user.full_name,
        "selected_offer": selected_offer,
        "collateral_type": app_obj.collateral_type,
        "property_region": app_obj.region,
        "property_size_sqft": app_obj.size_sqft,
        "valuation_estimate": app_obj.valuation_estimate,
        "aadhaar_number": masked_aadhaar,
        "pan_number": masked_pan,
        "status": "Submitted for admin review",
        "note": "Your application has been submitted and is awaiting approval.",
    }

    session.close()
    return final_summary


@app.get("/documents/{doc_id}/download")
def download_document(doc_id: int, user=Depends(get_current_user)):
    session = get_session()
    doc = session.get(DocumentMeta, doc_id)
    if not doc or doc.user_id != user.id:
        session.close()
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = os.path.join(UPLOAD_DIR, doc.filename)
    if not os.path.exists(file_path):
        session.close()
        raise HTTPException(status_code=404, detail="File not found")

    session.close()
    return FileResponse(
        path=file_path,
        media_type=doc.mime_type,
        filename=doc.filename,
        headers={"x-filename": doc.filename},
    )


@app.get("/applications/{app_id}/documents")
def list_application_documents(app_id: int, user=Depends(get_current_user)):
    session = get_session()
    app_obj = session.get(LoanApplication, app_id)
    if not app_obj or app_obj.user_id != user.id:
        session.close()
        raise HTTPException(status_code=404, detail="Application not found")

    docs = session.exec(
        select(DocumentMeta).where(DocumentMeta.application_id == app_id)
    ).all()
    session.close()
    return {
        "documents": [
            {
                **d.dict(),
                "display_filename": get_document_display_filename(d),
            }
            for d in docs
        ]
    }
