# import os
# from langchain_openai import AzureChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()


def get_llm():
    # llm = AzureChatOpenAI(
    #     azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    #     azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
    #     api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    #     api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    # )

    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite")

    return llm
