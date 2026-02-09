import os
import requests
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

DAILY_API_URL = "https://api.daily.co/v1/rooms"
DAILY_API_URL = "https://api.daily.co/v1/rooms"

def create_daily_room_for_booking(booking_id, puja_type="Puja", pandit_id=None):
    api_key = os.getenv("DAILY_API_KEY")
    if not api_key:
        raise ValueError("DAILY_API_KEY configuration is missing. Please add it to your .env file.")

    room_name = f"pandityatra-puja-{booking_id}"

    # Room expires 2 hours after creation (can be adjusted)
    expires_at = timezone.now() + timedelta(minutes=120)

    payload = {
        "name": room_name,
        "privacy": "private",
        "properties": {
            "exp": int(expires_at.timestamp()),
            "enable_chat": True,
        },
    }

    if getattr(settings, 'DAILY_ENABLE_RECORDING', False):
        payload["properties"]["enable_recording"] = "cloud"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    response = requests.post(DAILY_API_URL, json=payload, headers=headers)
    
    # Handle existing room case
    if response.status_code == 400 and "already exists" in response.text:
         # Fetch the existing room to return its data
         get_resp = requests.get(f"{DAILY_API_URL}/{room_name}", headers=headers)
         get_resp.raise_for_status()
         data = get_resp.json()
         return data["name"], data["url"]

    if not response.ok:
          raise Exception(f"Daily API Error: {response.status_code} - {response.text}")

    data = response.json()
    return data["name"], data["url"]