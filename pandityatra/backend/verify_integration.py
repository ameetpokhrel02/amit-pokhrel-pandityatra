import os
import django
import json
from datetime import datetime, date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from bookings.models import Booking
from users.models import User
from video.services.room_creator import ensure_video_room_for_booking
from video.models import VideoRoom
from django.test import Client
from django.urls import reverse

def verify_all():
    print("🚀 Starting End-to-End Verification of Daily.co Integration")

    # 1. Setup Test Data
    print("\n[Step 1] Creating test booking...")
    test_user, _ = User.objects.get_or_create(username='tester', email='test@example.com', role='user')
    test_pandit_user, _ = User.objects.get_or_create(username='test_pandit', email='pandit@example.com', role='pandit')
    
    from pandits.models import Pandit
    test_pandit, _ = Pandit.objects.get_or_create(user=test_pandit_user)
    
    booking = Booking.objects.create(
        user=test_user,
        pandit=test_pandit,
        service_name="Test Puja",
        booking_date=date.today(),
        booking_time="10:00",
        service_location="ONLINE",
        status="PENDING"
    )
    print(f"✅ Created Booking ID: {booking.id}")

    # 2. Test Room Creation Flow
    print("\n[Step 2] Testing room creation flow...")
    try:
        room = ensure_video_room_for_booking(booking)
        booking.refresh_from_db()
        
        print(f"✅ VideoRoom Object Created: {room.id}")
        print(f"✅ Room URL: {booking.daily_room_url}")
        print(f"✅ Room Name: {booking.daily_room_name}")
        
        if booking.daily_room_url and booking.daily_room_name:
            print("✨ Room metadata synced successfully!")
        else:
            print("❌ Room metadata missing!")
            
    except Exception as e:
        print(f"❌ Error in room creation flow: {e}")
        return

    # 3. Test Webhook Processing
    print("\n[Step 3] Mocking Daily.co 'recording.ready' webhook...")
    client = Client()
    webhook_payload = {
        "type": "recording.ready",
        "ts": int(datetime.now().timestamp()),
        "payload": {
            "room_name": booking.daily_room_name,
            "access_link": "https://api.daily.co/recordings/test-recording-123"
        }
    }
    
    try:
        response = client.post(
            '/api/video/webhook/',
            data=json.dumps(webhook_payload),
            content_type='application/json'
        )
        
        print(f"Status Code: {response.status_code}")
        
        booking.refresh_from_db()
        print(f"✅ Recording Available: {booking.recording_available}")
        print(f"✅ Recording URL: {booking.recording_url}")
        print(f"✅ Booking Status: {booking.status}")
        
        if booking.recording_available and booking.recording_url:
            print("✨ Webhook processed successfully! Recording is ready.")
        else:
            print("❌ Webhook failed to update booking!")
            
    except Exception as e:
        print(f"❌ Error in webhook processing: {e}")

    print("\n🏁 Verification Complete!")

if __name__ == "__main__":
    verify_all()
