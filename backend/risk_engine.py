def rule_based_risk_check(income, loan_amount, credit_score, collateral_value):
    ltv = loan_amount / collateral_value   # loan to value
    dti = loan_amount / (income * 12)      # debt to income

    risk = "low"
    reasons = []

    if credit_score < 600:
        risk = "high"
        reasons.append("Credit score too low")

    if ltv > 0.8:
        risk = "medium" if risk != "high" else "high"
        reasons.append("High LTV ratio")

    if dti > 0.45:
        risk = "medium"
        reasons.append("High DTI")

    return {
        "risk_level": risk,
        "ltv": round(ltv, 2),
        "dti": round(dti, 2),
        "reasons": reasons,
        "eligible": risk != "high"
    }
