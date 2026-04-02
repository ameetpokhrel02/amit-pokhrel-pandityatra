import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from bookings.models import Booking
from pandits.models import PanditUser
from services.models import Puja
from video.models import VideoRoom
from django.utils import timezone

User = get_user_model()

class ProductionReadyE2ETest(TestCase):
    def setUp(self):
        # 1. Setup Users
        self.client = Client()
        self.customer = User.objects.create_user(
            username="anita", email="anita@example.com", password="password123", role="user", full_name="Anita"
        )
        # Create PanditUser (MTI)
        self.pandit_user = PanditUser.objects.create_user(
            username="ramesh", email="ramesh@example.com", password="password123", role="pandit", full_name="Ramesh Pandit",
            is_verified=True
        )
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="password123"
        )
        self.service = Puja.objects.create(name="Ganesh Puja", description="Test", base_price=1000)

    def test_complete_video_booking_journey(self):
        """
        Flow: Customer Book -> Pandit Accept -> Room Generated -> Session History
        """
        # --- PHASE 1: CUSTOMER BOOKING ---
        self.client.login(username="anita", password="password123")
        tomorrow = timezone.now() + timezone.timedelta(days=1)
        booking_data = {
            "pandit": self.pandit_user.id,
            "service": self.service.id,
            "service_name": "Ganesh Puja",
            "booking_date": str(tomorrow.date()),
            "booking_time": "12:00:00",
            "service_location": "ONLINE",
            "service_fee": 1500,
            "samagri_fee": 500,
            "total_fee": 2000,
            "payment_method": "STRIPE"
        }
        response = self.client.post("/api/bookings/", data=json.dumps(booking_data), content_type="application/json")
        self.assertEqual(response.status_code, 201)
        booking_id = response.data["id"]
        
        # --- PHASE 2: PANDIT ACCEPTANCE ---
        self.client.login(username="ramesh", password="password123")
        response = self.client.patch(
            f"/api/bookings/{booking_id}/update_status/", 
            data=json.dumps({"status": "ACCEPTED"}), 
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        
        # --- PHASE 2.5: SIMULATE PAYMENT (Required for Video Room) ---
        booking = Booking.objects.get(id=booking_id)
        booking.payment_status = True
        booking.save()
        
        # --- PHASE 3: VIDEO ROOM GENERATION ---
        # Simulate room generation
        response = self.client.post(f"/api/video/rooms/create/", data={"booking_id": booking_id})
        self.assertEqual(response.status_code, 201)
        room_url = response.data["room_url"]
        self.assertTrue(room_url.startswith("http"))
        
        # --- PHASE 4: VIDEO ACCESS VERIFICATION ---
        # Verify customer can validate access
        self.client.login(username="anita", password="password123")
        room_instance = VideoRoom.objects.get(booking_id=booking_id)
        response = self.client.get(f"/api/video/{room_instance.room_name}/validate/")
        self.assertEqual(response.status_code, 200)
        
        # --- PHASE 5: ADMIN OVERSIGHT ---
        self.client.login(username="admin", password="password123")
        response = self.client.get(f"/api/bookings/") # Assuming list call shows all for admin
        self.assertEqual(response.status_code, 200)
        
    def test_past_booking_logic(self):
        """
        Ensure history view shows past bookings correctly.
        """
        booking = Booking.objects.create(
            user=self.customer,
            pandit=self.pandit_user,
            service_name="Past Puja",
            booking_date=timezone.now().date() - timezone.timedelta(days=1),
            booking_time="10:00:00",
            status="COMPLETED"
        )
        VideoRoom.objects.create(
            booking=booking,
            status="ended",
            ended_at=timezone.now() - timezone.timedelta(hours=1),
            recording_url="http://recording.com/123"
        )
        
        self.client.login(username="anita", password="password123")
        response = self.client.get("/api/video/history/")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["puja_name"], "Past Puja")
        self.assertEqual(response.data[0]["recording_url"], "http://recording.com/123")
