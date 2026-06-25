from fastapi import APIRouter, UploadFile, File
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
async def verify_kyc(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[-1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        temp_path = tmp.name

    text = extract_text_from_image(temp_path)

    if os.path.exists(temp_path):
        os.remove(temp_path)

    pan = extract_pan_from_text(text)
    aadhaar = extract_aadhaar_from_text(text)

    response = {
        "ocr_success": True,
        "pan": pan,
        "aadhaar": aadhaar,
        "message": "KYC OCR step completed",
    }

    if pan:
        response["pan_kyc"] = verify_pan(pan)

    if aadhaar:
        response["aadhaar_otp"] = send_otp(aadhaar)
    else:
        response["aadhaar_otp"] = None

    return response
