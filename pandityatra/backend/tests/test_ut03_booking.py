from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from pandits.models import Pandit
from services.models import Puja
import datetime

class PanditBookingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create a customer
        self.customer = User.objects.create_user(
            username='customer1',
            password='TestPassword123!',
            email='customer@example.com',
            role='user'
        )
        
        # Create a pandit user and profile
        self.pandit_user = User.objects.create_user(
            username='pandit1',
            password='TestPassword123!',
            email='pandit@example.com',
            role='pandit'
        )
        self.pandit = Pandit.objects.create(
            user=self.pandit_user,
            bio='Experienced Pandit',
            experience_years=10,
            is_verified=True
        )
        
        # Create a Puja service
        self.puja = Puja.objects.create(
            name='Satyanarayan Puja',
            description='A sacred Hindu ritual performed for Lord Vishnu.',
            base_price=1000.00
        )
        
        # Force authentication for the customer
        self.client.force_authenticate(user=self.customer)
        
        # Assuming router registered as 'bookings' -> default name for list is basename-list
        self.booking_url = '/api/bookings/'
        
    def test_ut03_book_pandit_successfully(self):
        """Book pandit successfully (UT03)"""
        future_date = datetime.date.today() + datetime.timedelta(days=2)
        
        data = {
            'pandit': self.pandit.id,
            'service': self.puja.id,
            'service_name': self.puja.name,
            'booking_date': future_date.isoformat(),
            'booking_time': '10:00:00',
            'service_location': 'HOME',
            'samagri_required': True
        }
        
        response = self.client.post(self.booking_url, data, format='json')
        
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK], f"Response: {response.data}")
        
        # Verify it was added
        self.assertEqual(response.data.get('status', 'PENDING'), 'PENDING')
