import json
from llm import get_llm

llm = get_llm()


RISK_PROMPT = """
You are a mortgage risk assessor assistant. Given the applicant details and collateral, return a JSON object only with the following schema:

{{
  "risk_level": "Low|Medium|High",
  "pd_score": 0.0,
  "key_reasons": ["short reason 1", "short reason 2", "short reason 3"]
}}

Use the inputs strictly. Inputs:
{input_json}

Return valid JSON only — no explanation outside JSON.
"""


OFFER_PROMPT = """
You are a mortgage offer generator. Given the applicant financials and collateral, generate upto 5 candidate loan offers. Return only valid JSON with this schema:

{{
  "offers": [
    {{
      "offer_id": "int",
      "interest_rate_annual": float,
      "tenure_years": int,
      "monthly_emi": float,
      "processing_fee": float,
      "ltv_percent": float,
      "note": "short reason"
    }}
  ]
}}

Inputs:
{input_json}

Rules:
- Use reasonable rounding for EMIs.
- Make offers conservative if risk is Medium/High (e.g., lower LTV, higher rate).
- Use requested_amount and tenure_years if provided; otherwise propose reasonable tenure (15-20 yrs).
- note should be always exactly 12 characters long and it should stay same for an offer in a single response.
Return JSON only.
"""


def _parse_llm_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1).strip()
    if cleaned.startswith("```") and cleaned.endswith("```"):
        cleaned = cleaned.strip("`")
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to extract JSON object from the response body.
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = cleaned[start : end + 1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass
        # Last resort: attempt single-quote normalization for simple malformed JSON.
        try:
            return json.loads(cleaned.replace("'", '"'))
        except Exception:
            raise


def assess_risk_with_llm(payload: dict) -> dict:
    prompt = RISK_PROMPT.format(input_json=json.dumps(payload))
    resp = llm.invoke([{"role": "user", "content": prompt}])
    text = resp.content
    try:
        return _parse_llm_json(text)
    except Exception as exc:
        print("LLM risk parse failed:", exc)
        print("LLM raw output:", text)
        return {
            "risk_level": "Medium",
            "pd_score": 0.2,
            "key_reasons": ["llm_parse_error"],
        }


def generate_offers_with_llm(payload: dict) -> dict:
    prompt = OFFER_PROMPT.format(input_json=json.dumps(payload))
    resp = llm.invoke([{"role": "user", "content": prompt}])
    text = resp.content
    try:
        return _parse_llm_json(text)
    except Exception:
        # Fallback to a best-effort normalization for malformed JSON.
        cleaned = text.strip().replace("```json", "").replace("```", "")
        try:
            return json.loads(cleaned)
        except Exception:
            return {"offers": []}
