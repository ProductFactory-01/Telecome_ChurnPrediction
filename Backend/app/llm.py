import os
import json
from openai import OpenAI
from fastapi import HTTPException
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

groq_client = (
    OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )
    if GROQ_API_KEY
    else None
)

def call_groq_json(system_content: str, user_payload: dict):
    if not GROQ_API_KEY or groq_client is None:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": json.dumps(user_payload)},
            ],
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Invalid JSON returned by Groq: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def try_groq_json(system_content: str, user_payload: dict):
    try:
        return call_groq_json(system_content, user_payload)
    except HTTPException:
        return None
