import requests
from django.conf import settings

def get_ai_prediction(kundali):
    try:
        planets = "\n".join([
            f"{p.planet} in {p.rashi}, House {p.house}"
            for p in kundali.planets.all()
        ])

        moon_planet = kundali.planets.filter(planet='Moon').first()
        moon_nakshatra = moon_planet.nakshatra if moon_planet else "Unknown"

        prompt = f"""
You are a Vedic astrologer.

Birth chart:
Lagna: {kundali.lagna}
Moon Nakshatra: {moon_nakshatra}

Planets:
{planets}

Give detailed prediction:
1. Personality
2. Career
3. Marriage
4. Health
5. Spiritual path
"""
        url = f"{settings.OLLAMA_URL}/api/generate" if hasattr(settings, 'OLLAMA_URL') else "http://ollama:11434/api/generate"
        
        res = requests.post(url, json={
            "model": "llama3.2:1b",
            "prompt": prompt,
            "stream": False
        }, timeout=10) # Added timeout

        if res.status_code == 200:
            return res.json().get("response", "No response from AI.")
        return f"AI Service error: {res.status_code}"
    except Exception as e:
        return f"AI Prediction unavailable: {str(e)}"