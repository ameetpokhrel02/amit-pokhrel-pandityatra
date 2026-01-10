import requests

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"

def get_ai_prediction(kundali):
    planets = "\n".join([
        f"{p.planet} in {p.rashi}, House {p.house}"
        for p in kundali.planets.all()
    ])

    prompt = f"""
You are a Vedic astrologer.

Birth chart:
Lagna: {kundali.lagna}
Moon Nakshatra: {kundali.planets.get(planet='Moon').nakshatra}

Planets:
{planets}

Give detailed prediction:
1. Personality
2. Career
3. Marriage
4. Health
5. Spiritual path
"""

    res = requests.post(OLLAMA_URL, json={
        "model": "llama3.2:1b",
        "prompt": prompt,
        "stream": False
    })

    return res.json()["response"]