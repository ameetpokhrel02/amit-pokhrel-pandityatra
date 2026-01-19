from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from users.models import User
from pandits.models import Pandit, PanditService
from services.models import Puja
from reviews.models import Review
from bookings.models import Booking

from datetime import date, time

class PanditProfileAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create Pandit User
        self.user = User.objects.create_user(username='pandit1', email='p1@test.com', password='password', role='pandit', full_name='Pandit Ji')
        self.pandit = Pandit.objects.create(
            user=self.user, 
            expertise="Vedic", 
            language="Hindi", 
            verification_status='APPROVED', 
            is_verified=True, 
            is_available=True,
            rating=4.5
        )
        
        # Create Service
        self.puja = Puja.objects.create(name="Satyanarayan Puja", base_price=500)
        self.service = PanditService.objects.create(pandit=self.pandit, puja=self.puja, custom_price=1100, duration_minutes=120)
        
        # Create Customer and Review
        self.customer = User.objects.create_user(username='cust1', email='c1@test.com', password='password')
        # Booking needed for review
        self.booking = Booking.objects.create(
            user=self.customer, 
            pandit=self.pandit, 
            service_name="Puja", 
            total_fee=500,
            booking_date=date(2025, 1, 1),
            booking_time=time(10, 0)
        )
        self.review = Review.objects.create(
            pandit=self.pandit, 
            customer=self.customer, 
            booking=self.booking, 
            rating=5, 
            comment="Excellent!"
        )

    def test_get_pandit_detail(self):
        url = f'/api/pandits/{self.pandit.id}/'
        response = self.client.get(url)
        
        print("\n\nResponse Status:", response.status_code)
        print("Response Data:", response.json())
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify Profile Fields
        self.assertEqual(data['user_details']['full_name'], 'Pandit Ji')
        self.assertEqual(data['expertise'], 'Vedic')
        
        # Verify Services
        self.assertTrue('services' in data)
        self.assertEqual(len(data['services']), 1)
        self.assertEqual(data['services'][0]['puja_details']['name'], 'Satyanarayan Puja')
        self.assertEqual(float(data['services'][0]['custom_price']), 1100.00)
        
        # Verify Reviews
        self.assertTrue('reviews' in data)
        self.assertEqual(len(data['reviews']), 1)
        self.assertEqual(data['reviews'][0]['comment'], 'Excellent!')
        self.assertEqual(data['reviews'][0]['customer_name'], self.customer.full_name)
        
        # Verify Review Count
        self.assertEqual(data['review_count'], 1)
