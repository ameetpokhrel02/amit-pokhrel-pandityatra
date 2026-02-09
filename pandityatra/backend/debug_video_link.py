import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from bookings.models import Booking
from video.models import VideoRoom
from users.models import User

def check_bookings():
    # Find bookings for tomorrow or recently created
    print("Checking recent bookings...")
    bookings = Booking.objects.order_by('-id')[:5]
    
    for b in bookings:
        print(f"Booking ID: {b.id}")
        print(f"  User: {b.user.email} ({b.user.full_name})")
        print(f"  Pandit: {b.pandit.user.full_name}")
        print(f"  Date: {b.booking_date}")
        print(f"  Status: {b.status}")
        print(f"  Location: {b.service_location}")
        print(f"  Video URL (Booking model): {b.video_room_url}")
        
        # Check VideoRoom
        try:
            vr = VideoRoom.objects.get(booking=b)
            print(f"  VideoRoom Found: ID {vr.id}")
            print(f"    Room URL: {vr.room_url}")
            print(f"    Status: {vr.status}")
        except VideoRoom.DoesNotExist:
            print("  VideoRoom: NOT FOUND")

        print("-" * 30)

if __name__ == "__main__":
    check_bookings()
