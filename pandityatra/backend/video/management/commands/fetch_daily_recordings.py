import os
import requests
from django.core.management.base import BaseCommand
from video.models import VideoRoom

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_RECORDINGS_URL = "https://api.daily.co/v1/recordings"

class Command(BaseCommand):
    help = "Fetch and persist completed Daily.co video recordings for ended rooms."

    def handle(self, *args, **options):
        headers = {"Authorization": f"Bearer {DAILY_API_KEY}"}
        response = requests.get(DAILY_RECORDINGS_URL, headers=headers)
        response.raise_for_status()
        data = response.json()
        count = 0
        for rec in data.get("data", []):
            room_name = rec.get("room_name")
            url = rec.get("download_url")
            status = rec.get("status")
            if not room_name or not url or status != "completed":
                continue
            try:
                room = VideoRoom.objects.get(room_name=room_name)
                if not room.recording_url:
                    room.recording_url = url
                    room.save()
                    count += 1
            except VideoRoom.DoesNotExist:
                continue
        self.stdout.write(self.style.SUCCESS(f"Fetched and saved {count} new recordings."))