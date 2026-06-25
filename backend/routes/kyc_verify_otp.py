from fastapi import APIRouter, HTTPException
from services.aadhaar_kyc_service import verify_otp
from services.kyc_decision_service import final_kyc_decision

router = APIRouter()


@router.post("/verify-otp")
def verify_aadhaar_otp(aadhaar: str, otp: int, pan_verified: bool = True):
    aadhaar_result = verify_otp(aadhaar, otp)

    if not aadhaar_result.get("verified"):
        raise HTTPException(status_code=400, detail="Aadhaar OTP verification failed")

    pan_result = {"verified": pan_verified} if pan_verified else None

    final_decision = final_kyc_decision(
        pan_result=pan_result, aadhaar_result=aadhaar_result
    )

    return {"aadhaar_kyc": aadhaar_result, "final_kyc": final_decision}
