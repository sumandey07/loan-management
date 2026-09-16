from llm import get_llm

llm = get_llm()

llm_response = llm.invoke("Hello, how are you?")

print(llm_response.content)
