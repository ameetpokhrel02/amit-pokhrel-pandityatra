from django.conf import settings
from groq import Groq


class GroqClient:
    def __init__(self):
        self.model = getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant")
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def chat(self, messages, tools=None, tool_choice="auto", max_tokens=500):
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
        }
        if tools is not None:
            payload["tools"] = tools
            payload["tool_choice"] = tool_choice
        return self.client.chat.completions.create(**payload)
