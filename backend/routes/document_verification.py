from fastapi import APIRouter, UploadFile, File
import tempfile, os, shutil

from services.ocr_service import (
    extract_text_from_image,
    extract_pan_from_text,
    extract_aadhaar_from_text,
)

router = APIRouter()


@router.post("/verify-document")
async def verify_document(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[-1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        temp_path = tmp.name

    text = extract_text_from_image(temp_path)

    if os.path.exists(temp_path):
        os.remove(temp_path)

    pan = extract_pan_from_text(text)
    aadhaar = extract_aadhaar_from_text(text)

    return {
        "ocr_success": True,
        "pan_detected": pan,
        "aadhaar_detected": aadhaar,
        "message": "OCR completed successfully",
    }
