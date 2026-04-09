import datetime
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from pandits.models import PanditUser
from services.models import Puja
from bookings.models import Booking

class PanditBookingTests(TestCase):
    """
    UT03 – Pandit Booking Module
    Validate booking creation and lifecycle.
    """
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='booking_cust', password='p', email='bc@test.com', role='user'
        )
        self.pandit = PanditUser.objects.create_user(
            username='booking_pandit', password='p', email='bp@test.com', role='pandit',
            is_verified=True # 🚨 Must be verified to receive bookings
        )
        self.puja = Puja.objects.create(name='Vastu Puja', base_price=5000)
        self.client.force_authenticate(user=self.customer)
        self.booking_url = '/api/bookings/'

    def test_ut03_book_pandit_successfully(self):
        """Book pandit successfully (UT03)"""
        data = {
            'pandit': self.pandit.id,
            'service': self.puja.id,
            'booking_date': (datetime.date.today() + datetime.timedelta(days=7)).isoformat(),
            'booking_time': '10:00',
            'service_location': 'HOME',
            'samagri_required': False
        }
        response = self.client.post(self.booking_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Booking.objects.count(), 1)
        booking = Booking.objects.first()
        self.assertEqual(booking.status, 'PENDING')

    def test_ut03_pandit_can_accept_booking(self):
        """Pandit can accept a pending booking"""
        booking = Booking.objects.create(
            user=self.customer,
            pandit=self.pandit,
            service=self.puja,
            booking_date=datetime.date.today(),
            booking_time='10:00:00',
            status='PENDING',
            total_fee=5000
        )
        
        self.client.force_authenticate(user=self.pandit)
        # Use update_status action instead of hypothetical accept_booking
        url = f'{self.booking_url}{booking.id}/update_status/'
        response = self.client.patch(url, {'status': 'ACCEPTED'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'ACCEPTED')
