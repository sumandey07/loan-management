def final_kyc_decision(pan_result: dict | None, aadhaar_result: dict | None) -> dict:
    """
    Final KYC decision logic (bank-style)
    """

    if pan_result and not pan_result.get("verified"):
        return {"kyc_status": "REJECTED", "reason": "PAN_VERIFICATION_FAILED"}

    if aadhaar_result and not aadhaar_result.get("verified"):
        return {"kyc_status": "PENDING", "reason": "AADHAAR_OTP_FAILED"}

    if pan_result and aadhaar_result:
        return {"kyc_status": "APPROVED", "level": "FULL_KYC"}

    if pan_result:
        return {"kyc_status": "APPROVED", "level": "MIN_KYC"}

    return {"kyc_status": "PENDING", "reason": "INSUFFICIENT_DATA"}
