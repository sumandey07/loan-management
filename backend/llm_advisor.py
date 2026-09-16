import json

from llm import get_llm

llm = get_llm()


def llm_final_offer(summary, user_data):
    prompt = f"""
    You are a senior mortgage underwriter.
    Based on the summary and financial data:

    SUMMARY:
    {summary}

    USER DATA:
    {user_data}

        Return only valid JSON with exactly these keys:
        {{
            "risk_level": "Low|Medium|High",
            "max_loan_amount": 0.0,
            "recommended_roi": 0.0,
            "explanation": "short explanation"
        }}
    """

    content = llm.invoke(prompt).content
    if isinstance(content, list):
        content = "".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in content
        )

    text = str(content).strip()
    if text.startswith("```json"):
        text = text[7:].strip()
    if text.startswith("```") and text.endswith("```"):
        text = text[3:-3].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("LLM underwriting response was not valid JSON")
        return json.loads(text[start : end + 1])
