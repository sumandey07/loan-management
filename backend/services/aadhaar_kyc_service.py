import random

_otp_store = {}


def send_otp(aadhaar: str) -> dict:
    otp = random.randint(100000, 999999)
    _otp_store[aadhaar] = otp

    print(f"[DEV] Aadhaar OTP: {otp}")

    return {"status": "OTP_SENT"}


def verify_otp(aadhaar: str, otp: int) -> dict:
    if _otp_store.get(aadhaar) == otp:
        return {"verified": True, "provider": "SANDBOX_UIDAI"}

    return {"verified": False, "reason": "Invalid OTP"}
