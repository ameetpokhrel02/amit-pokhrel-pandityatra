import os
import django
import sys
import traceback

# Setup Django env
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from bookings.models import Booking
from video.services.room_creator import ensure_video_room_for_booking

def run_debug():
    try:
        print("Starting debug...", file=sys.stderr)
        
        # Check API Key
        key = os.getenv('DAILY_API_KEY')
        if not key:
            print("ERROR: DAILY_API_KEY is not set in environment!", file=sys.stderr)
        else:
            print(f"DAILY_API_KEY found (starts with {key[:4]}...)", file=sys.stderr)

        # Get Booking 10
        try:
            booking = Booking.objects.get(id=10)
            print(f"Found Booking 10: {booking}", file=sys.stderr)
        except Booking.DoesNotExist:
            print("Booking 10 not found. Using last booking.", file=sys.stderr)
            booking = Booking.objects.last()
            print(f"Found Booking {booking.id}: {booking}", file=sys.stderr)

        # Force Room Creation
        print("Calling ensure_video_room_for_booking...", file=sys.stderr)
        room = ensure_video_room_for_booking(booking)
        print("Success!", file=sys.stderr)
        print(f"Room URL: {room.room_url}", file=sys.stderr)

    except Exception:
        print("EXCEPTION CAUGHT:", file=sys.stderr)
        traceback.print_exc()

if __name__ == "__main__":
    run_debug()
