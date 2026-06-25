import re


def verify_pan(pan: str) -> dict:
    if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", pan):
        return {"verified": False, "reason": "Invalid PAN format"}

    # Sandbox-style response
    return {"verified": True, "provider": "SANDBOX_PAN", "pan": pan, "name_match": True}
