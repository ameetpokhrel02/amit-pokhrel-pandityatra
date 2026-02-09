import os
import django
from django.conf import settings
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from bookings.models import Booking
from video.services.room_creator import ensure_video_room_for_booking

def debug_daily():
    print("--- Debugging Daily.co Integration ---")
    
    api_key = os.getenv("DAILY_API_KEY")
    print(f"DAILY_API_KEY present: {bool(api_key)}")
    if api_key:
        print(f"DAILY_API_KEY length: {len(api_key)}")
        print(f"DAILY_API_KEY prefix: {api_key[:5]}...")
    else:
        print("CRITICAL: DAILY_API_KEY is missing!")

    # Get the latest booking
    try:
        booking = Booking.objects.order_by('-id').first()
        if not booking:
            print("No bookings found.")
            return

        print(f"\nProcessing Booking ID: {booking.id}")
        print(f"Current Video URL: {booking.video_room_url}")

        if booking.service_location != 'ONLINE':
             print(f"Booking is {booking.service_location}, not ONLINE. Forcing test...")

        # Try to create room
        print("\nAttempting to create room...")
        try:
            # We call the service directly
            from video.services.daily import create_daily_room_for_booking
            name, url = create_daily_room_for_booking(booking.id)
            print("SUCCESS! (Service Call)")
            print(f"Room Name: {name}")
            print(f"Room URL: {url}")
            
        except Exception as e:
            print(f"ERROR creating room: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    debug_daily()
