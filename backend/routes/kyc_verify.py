from fastapi import APIRouter, UploadFile, File, Form, Request
import tempfile, os, shutil

from services.ocr_service import (
    extract_text_from_image,
    extract_pan_from_text,
    extract_aadhaar_from_text,
)
from services.pan_kyc_service import verify_pan
from services.aadhaar_kyc_service import send_otp

router = APIRouter()


@router.post("/verify")
async def verify_kyc(
    request: Request,
    aadhaar: str | None = Form(None),
    pan: str | None = Form(None),
    bank_account: str | None = Form(None),
    file: UploadFile | None = File(None),
):
    if request.headers.get("content-type", "").startswith("application/json"):
        payload = await request.json()
        aadhaar = payload.get("aadhaar") or aadhaar
        pan = payload.get("pan") or pan
        bank_account = payload.get("bank_account") or bank_account

    pan_value = pan
    aadhaar_value = aadhaar

    if file is not None:
        suffix = os.path.splitext(file.filename)[-1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_path = tmp.name

        text = extract_text_from_image(temp_path)
        if os.path.exists(temp_path):
            os.remove(temp_path)

        if not pan_value:
            pan_value = extract_pan_from_text(text)
        if not aadhaar_value:
            aadhaar_value = extract_aadhaar_from_text(text)

    response = {
        "ocr_success": bool(file is not None),
        "pan": pan_value,
        "aadhaar": aadhaar_value,
        "message": "KYC verification step completed",
    }

    if pan_value:
        response["pan_kyc"] = verify_pan(pan_value)

    if aadhaar_value:
        response["aadhaar_otp"] = send_otp(aadhaar_value)
    else:
        response["aadhaar_otp"] = None

    return response
