from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from users.models import User
from bookings.models import Booking
from pandits.models import Pandit
from services.models import Puja
import datetime

class PaymentIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        self.customer = User.objects.create_user(
            username='pay_customer', password='123', email='pay@example.com', role='user'
        )
        self.pandit_user = User.objects.create_user(
            username='pay_pandit', password='123', email='p@example.com', role='pandit'
        )
        self.pandit = Pandit.objects.create(user=self.pandit_user)
        self.puja = Puja.objects.create(name='Test Puja', base_price=100)
        
        self.booking = Booking.objects.create(
            user=self.customer,
            pandit=self.pandit,
            service=self.puja,
            service_name='Test Puja',
            booking_date=datetime.date.today(),
            booking_time='10:00:00',
            total_fee=100.00
        )
        
        self.client.force_authenticate(user=self.customer)
        self.initiate_url = reverse('payment-initiate')

    @patch('payments.views.initiate_esewa_payment')
    def test_ut04_process_payment_via_esewa(self, mock_esewa):
        """Process payment via eSewa (UT04)"""
        mock_esewa.return_value = (
            True,
            'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
            {'amount': '100', 'product_code': 'EPAYTEST'},
            'test-uuid-123'
        )
        
        data = {
            'booking_id': self.booking.id,
            'gateway': 'ESEWA'
        }
        response = self.client.post(self.initiate_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(response.data.get('gateway'), 'ESEWA')

    @patch('payments.views.initiate_khalti_payment')
    def test_ut04_process_payment_via_khalti(self, mock_khalti):
        """Process payment via Khalti (UT04)"""
        mock_khalti.return_value = (
            True,
            'mock-pidx-456',
            'https://khalti.com/pay/mock-pidx-456'
        )
        
        data = {
            'booking_id': self.booking.id,
            'gateway': 'KHALTI'
        }
        response = self.client.post(self.initiate_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking2 = Booking.objects.create(
            user=self.customer,
            pandit=self.pandit,
            service=self.puja,
            service_name='Test Puja 2',
            booking_date=datetime.date.today() + datetime.timedelta(days=1),
            booking_time='14:00:00',
            total_fee=200.00
        )
        
        mock_session = MagicMock()
        mock_session.id = 'cs_test_mock_session_789'
        mock_session.url = 'https://checkout.stripe.com/pay/cs_test_mock_session_789'
        mock_session.to_dict.return_value = {'id': 'cs_test_mock_session_789'}
        mock_stripe_session.return_value = mock_session
        
        data = {
            'booking_id': booking2.id,
            'gateway': 'STRIPE',
            'currency': 'USD'
        }
        response = self.client.post(self.initiate_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(response.data.get('gateway'), 'STRIPE')
