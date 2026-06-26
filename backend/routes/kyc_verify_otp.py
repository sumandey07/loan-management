from fastapi import APIRouter, HTTPException, Form, Request
from services.aadhaar_kyc_service import verify_otp
from services.kyc_decision_service import final_kyc_decision

router = APIRouter()


@router.post("/verify-otp")
async def verify_aadhaar_otp(
    request: Request,
    aadhaar: str | None = Form(None),
    otp: int | None = Form(None),
    pan_verified: bool = Form(True),
):
    if request.headers.get("content-type", "").startswith("application/json"):
        payload = await request.json()
        aadhaar = payload.get("aadhaar") or aadhaar
        otp = payload.get("otp") or otp
        pan_verified = payload.get("pan_verified", pan_verified)

    if aadhaar is None or otp is None:
        raise HTTPException(status_code=400, detail="Missing aadhaar or otp")

    aadhaar_result = verify_otp(aadhaar, int(otp))

    if not aadhaar_result.get("verified"):
        raise HTTPException(status_code=400, detail="Aadhaar OTP verification failed")

    pan_result = {"verified": pan_verified} if pan_verified else None

    final_decision = final_kyc_decision(
        pan_result=pan_result, aadhaar_result=aadhaar_result
    )

    return {"aadhaar_kyc": aadhaar_result, "final_kyc": final_decision}
