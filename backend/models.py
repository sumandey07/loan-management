from typing import Optional
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, create_engine, Session, select
from datetime import datetime
from pydantic import BaseModel
import os
from zoneinfo import ZoneInfo

DB_FILE = "mortgage.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"

ist = ZoneInfo("Asia/Kolkata")


def now_ist():
    return datetime.now(ist).strftime("%d-%m-%Y, %H:%M")


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password_hash: str
    created_at: str = Field(default_factory=now_ist)
    consent_accepted: bool = Field(default=False)
    consent_ts: Optional[datetime] = None


class CollateralValuation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    region: str
    asset_type: str
    avg_price: float


class LoanApplication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    collateral_type: str  # property|gold|assets
    requested_amount: float
    tenure_years: int
    credit_score: Optional[int] = None
    existing_emi: Optional[float] = 0.0
    status: str = Field(
        default="draft"
    )  # draft|submitted|verification_pending|approved|rejected
    created_at: str = Field(default_factory=now_ist)
    # property-specific
    region: Optional[str] = None
    size_sqft: Optional[float] = None
    valuation_estimate: Optional[float] = None
    # gold-specific
    purity: Optional[str] = None  # e.g., 22k,
    gold_weight_grams: Optional[float] = None
    # store ITR info simply as total_annual_income (extracted from ITRs)
    annual_income: Optional[float] = None
    selected_offer_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    llm_risk_level: Optional[str] = None
    llm_max_loan: Optional[float] = None
    llm_recommended_roi: Optional[float] = None
    llm_explanation: Optional[str] = None

    llm_reviewed_at: Optional[datetime] = None
    llm_reviewed_by: Optional[str] = None


class DocumentMeta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(index=True)
    user_id: int
    doc_type: str  # aadhaar|pan|salary_slip|bank_statement|property_doc
    filename: str
    mime_type: str
    size_bytes: int
    upload_ts: str = Field(default_factory=now_ist)
    sha256: Optional[str] = None
    extracted_name: Optional[str] = None
    extracted_fields_json: Optional[str] = None


class Admin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    created_at: str = Field(default_factory=now_ist)


class RiskRequest(BaseModel):
    income: float
    loan_amount: float
    credit_score: int
    collateral_value: float
    age: Optional[int] = None
    itr_income: Optional[float] = None
    employment_type: Optional[str] = None


class RegisterIn(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None


class EligibilityForm(BaseModel):
    age: int
    annual_income: float
    credit_score: int


class EligibilityResp(BaseModel):
    eligible: bool
    amount_eligible: Optional[float] = None


class LoginIn(BaseModel):
    username: str
    password: str


class EligibilityForm(BaseModel):
    age: int
    annual_income: float
    credit_score: int


class EligibilityResp(BaseModel):
    eligible: bool
    amount_eligible: Optional[float] = None


class TokenResp(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ApplicationIn(BaseModel):
    collateral_type: str
    requested_amount: float
    tenure_years: int
    credit_score: Optional[int] = None
    existing_emi: Optional[float] = 0.0
    region: Optional[str] = None
    size_sqft: Optional[float] = None
    gold_weight_grams: Optional[float] = None
    purity: Optional[str] = None
    annual_income: Optional[float] = None


class ApplicationUpdate(BaseModel):
    collateral_type: Optional[str] = None
    requested_amount: Optional[float] = None
    tenure_years: Optional[int] = None
    credit_score: Optional[int] = None
    existing_emi: Optional[float] = None
    region: Optional[str] = None
    size_sqft: Optional[float] = None
    gold_weight_grams: Optional[float] = None
    purity: Optional[str] = None
    annual_income: Optional[float] = None


class ApplicationOut(BaseModel):
    id: int
    user_id: int
    collateral_type: str
    requested_amount: float
    tenure_years: int
    credit_score: Optional[int] = None
    existing_emi: Optional[float] = 0.0
    status: str
    created_at: str
    region: Optional[str] = None
    size_sqft: Optional[float] = None
    valuation_estimate: Optional[float] = None
    purity: Optional[str] = None
    gold_weight_grams: Optional[float] = None
    annual_income: Optional[float] = None
    selected_offer_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    llm_risk_level: Optional[str] = None
    llm_max_loan: Optional[float] = None
    llm_recommended_roi: Optional[float] = None
    llm_explanation: Optional[str] = None
    llm_reviewed_at: Optional[datetime] = None
    llm_reviewed_by: Optional[str] = None


class ChatMessage(BaseModel):
    message: str


class AdminLoginIn(BaseModel):
    username: str
    password: str


class AdminTokenResp(BaseModel):
    access_token: str
    token_type: str = "bearer"


def init_db():
    SQLModel.metadata.create_all(engine)
    # if not os.path.exists(DB_FILE):
    #     SQLModel.metadata.create_all(engine)


def get_session():
    return Session(engine)
