
import os
import google.genai as genai


def ask_pandityatra_ai(question):
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return "Gemini API key not set. Please contact admin."
    genai.configure(api_key=api_key)
    prompt = f"""
You are PanditYatra AI, a calm Vedic spiritual guide.
Give short, clear, helpful answers.

User question:
{question}
"""
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    return response.text.strip() if hasattr(response, 'text') else str(response)
