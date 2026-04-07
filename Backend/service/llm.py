import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate


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
        model="openai/gpt-oss-120b",
        temperature=0.2,
    )
    return llm


def try_groq_json(system_prompt: str, user_data: dict):
    """
    Attempts to get a JSON response from Groq.
    """
    try:
        llm = get_groq_llm()
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", json.dumps(user_data))
        ])
        
        chain = prompt | llm
        response = chain.invoke({})
        content = response.content.strip()
        
        # Extract JSON from markdown if necessary
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Error in Groq JSON generation: {e}")
        return None


