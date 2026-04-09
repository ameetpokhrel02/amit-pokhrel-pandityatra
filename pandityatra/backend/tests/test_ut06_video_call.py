import datetime
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from pandits.models import PanditUser
from bookings.models import Booking
from services.models import Puja

class VideoCallTests(TestCase):
    """
    UT06 – Video Call (WebRTC)
    Establish real-time video sessions for bookings.
    """
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='vid_customer', password='123', email='vc@test.com', role='user'
        )
        self.pandit = PanditUser.objects.create_user(
            username='vid_pandit', password='123', email='vp@test.com', role='pandit'
        )
        self.puja = Puja.objects.create(name='Live Puja', base_price=2000)
        
        self.booking = Booking.objects.create(
            user=self.customer,
            pandit=self.pandit,
            service=self.puja,
            booking_date=datetime.date.today(),
            booking_time='10:00:00',
            status='ACCEPTED',
            service_location='ONLINE', # 🚨 Required for video room creation
            payment_status=True
        )
        self.client.force_authenticate(user=self.customer)

    def test_ut06_establish_realtime_video_session(self):
        """Establish real-time video session (UT06)"""
        url = '/api/video/rooms/create/'
        data = {'booking_id': self.booking.id, 'room_type': 'video'}
        response = self.client.post(url, data, format='json')
        
        # Valid response could be 200/201 depending on Daily.co integration logic
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        if response.status_code in [200, 201]:
            self.assertIn('room_url', response.data)

    def test_ut06_get_ice_servers(self):
        """Get ICE servers for WebRTC connection"""
        url = '/api/video/ice-servers/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('ice_servers', response.data)
