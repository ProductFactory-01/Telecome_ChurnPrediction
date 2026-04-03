import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq


# -------------------------------------------------
#  Load environment variables
# -------------------------------------------------
load_dotenv()  # Load all environment variables from .env


# =================================================
#  Groq (Low-latency model)
# =================================================
def get_groq_llm():
    """Configure Groq LLM using API key from environment."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not set in environment.")
    
    llm = ChatGroq(
        groq_api_key=groq_api_key,
        model="llama-3.3-70b-versatile",
        temperature=0.2,
    )
    return llm


