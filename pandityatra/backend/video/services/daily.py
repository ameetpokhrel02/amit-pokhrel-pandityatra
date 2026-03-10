import os
import requests
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

DAILY_API_URL = "https://api.daily.co/v1/rooms"
DAILY_API_URL = "https://api.daily.co/v1/rooms"

def create_daily_room_for_booking(booking_id, puja_type="Puja", pandit_id=None):
    api_key = getattr(settings, 'DAILY_API_KEY', None)
    if not api_key:
        raise ValueError("DAILY_API_KEY configuration is missing. Please add it to your .env file.")

    room_name = f"pandityatra-puja-{booking_id}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # Attempt to delete existing room to clear any previous premium settings (like recording)
    try:
        requests.delete(f"{DAILY_API_URL}/{room_name}", headers=headers, timeout=5)
    except Exception:
        pass

    # Room expires 2 hours after creation
    expires_at = timezone.now() + timedelta(minutes=120)

    # Use minimal, public settings to ensure it works on free tier without token complexity for now
    payload = {
        "name": room_name,
        "privacy": "public",
        "properties": {
            "exp": int(expires_at.timestamp()),
        },
    }

    response = requests.post(DAILY_API_URL, json=payload, headers=headers)
    
    if not response.ok:
          raise Exception(f"Daily API Error: {response.status_code} - {response.text}")

    data = response.json()
    return data["name"], data["url"]