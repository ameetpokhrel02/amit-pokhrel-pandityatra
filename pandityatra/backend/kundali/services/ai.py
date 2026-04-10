import requests
from django.conf import settings

def get_ai_prediction(kundali):
    """Legacy helper for model-based predictions."""
    # Map the model instance to a dict for the expert service
    data = {
        'dob': kundali.dob,
        'time': kundali.time,
        'place': kundali.place,
        'lagna': kundali.lagna,
        'planets': [
            {'planet': p.planet, 'rashi': p.rashi, 'house': p.house, 'longitude': p.longitude}
            for p in kundali.planets.all()
        ]
    }
    return get_expert_ai_prediction(data)

def get_expert_ai_prediction(data, history=None):
    """
    Highly detailed AI prediction using an expert Vedic Jyotishi persona.
    Supports multi-turn chat if history is provided.
    """
    try:
        planets_list = data.get('planets', [])
        planets_str = "\n".join([
            f"- {p.get('planet')} in {p.get('rashi')}, House {p.get('house')} ({float(p.get('longitude', 0)):.2f}°)"
            for p in planets_list
        ])

        system_prompt = """You are 'Jyotish AI', a highly experienced Nepali Vedic Jyotishi (astrologer) with 25+ years of practice.
Your goal is to provide a deep, soulful, and accurate interpretation of the user's Kundali (birth chart).

LANGUAGE INSTRUCTIONS:
1. If the user provides details or context in Nepali (Devnagari or Roman Nepali), your response MUST be in polite and respectful Nepali.
2. If the user uses English, respond in professional and warm English.
3. Maintain a spiritual, respectful, and authoritative yet kind "Pandit-ji" persona in both languages.

CONVERSATION CONTEXT:
- You are analyzing the user's specific birth chart provided in the first message.
- For the initial reading, provide a comprehensive 6-point analysis.
- For follow-up questions, be specific and use the birth data to answer directly.
"""
        
        initial_user_prompt = f"""
User's Birth Chart Data:
- Date of Birth: {data.get('dob')}
- Time of Birth: {data.get('time')}
- Place of Birth: {data.get('place')}
- Ascendant (Lagna): {data.get('lagna')}

Planetary Positions:
{planets_str}

Please generate my personalized Kundali interpretation in the language I am using (Nepali or English).
"""

        # Construct messages for Ollama Chat API
        messages = [{"role": "system", "content": system_prompt}]
        
        if not history or len(history) == 0:
            # First time prediction
            messages.append({"role": "user", "content": initial_user_prompt})
        else:
            # We have a history. We need to prepend the birth chart context to the very first user message 
            # if it's not already there, but usually, we can just pass the history array directly
            # assuming the base history starts with the chart data.
            messages.extend(history)

        # Ensure we use the OLLAMA_URL from settings
        url = getattr(settings, 'OLLAMA_URL', 'http://ollama:7070')
        if not url.endswith('/api/chat'):
            url = f"{url.rstrip('/')}/api/chat"
        
        res = requests.post(url, json={
            "model": "llama3.2:1b",
            "messages": messages,
            "stream": False
        }, timeout=60)

        if res.status_code == 200:
            return res.json().get("message", {}).get("content", "The cosmic alignment is unclear at this moment.")
        
        return "The cosmic oracle is currently at rest, please try later."
        
    except requests.exceptions.RequestException as e:
        print(f"Ollama Connection Error (RequestException): {str(e)}")
        return "The cosmic oracle is currently at rest, please try later."
    except Exception as e:
        print(f"Ollama Connection Error (General): {str(e)}")
        return f"Divine Insight Error: {str(e)}"
