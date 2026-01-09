import os
import requests
from datetime import timedelta
from django.utils import timezone

DAILY_API_URL = "https://api.daily.co/v1/rooms"
DAILY_API_KEY = os.getenv("DAILY_API_KEY")


def create_daily_room_for_booking(booking_id):
    room_name = f"pandityatra-puja-{booking_id}"

    expires_at = timezone.now() + timedelta(minutes=120)

    payload = {
        "name": room_name,
        "privacy": "private",
        "properties": {
            "exp": int(expires_at.timestamp()),
            "enable_chat": True,
            "enable_recording": "cloud",
        },
    }

    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(DAILY_API_URL, json=payload, headers=headers)
    response.raise_for_status()

    data = response.json()
    return data["name"], data["url"]