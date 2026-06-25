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

    Generate:
    1. Final risk (low, medium, high)
    2. Max loan amount
    3. Recommended ROI
    4. An explanation
    """

    return llm.invoke(prompt).content
