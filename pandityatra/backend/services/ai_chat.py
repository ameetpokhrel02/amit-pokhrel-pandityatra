import requests
from django.conf import settings

OLLAMA_URL = settings.OLLAMA_URL

def ask_pandityatra_ai(question):
    prompt = f"""
You are PanditYatra AI, a calm Vedic spiritual guide.
Give short, clear, helpful answers.

User question:
{question}
"""

    res = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        },
        timeout=60
    )

    return res.json()["response"]
