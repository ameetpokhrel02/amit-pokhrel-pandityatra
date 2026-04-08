from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import PanditUser, PanditWallet

User = get_user_model()

class PanditEndpointTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.pandit = PanditUser.objects.create_user(
            username='testpandit', email='t@t.com', password='p', role='pandit',
            expertise="Ganesh Puja",
            verification_status="APPROVED",
            is_verified=True
        )
        self.wallet, _ = PanditWallet.objects.get_or_create(pandit=self.pandit)
        self.wallet.available_balance = 1000
        self.wallet.save()
        self.client.force_authenticate(user=self.pandit)

    def test_dashboard_stats(self):
        url = "/api/pandits/dashboard/stats/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertEqual(float(response.data['stats']['available_balance']), 1000.0)

    def test_wallet_endpoint(self):
        url = "/api/pandits/wallet/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('available_balance', response.data)

    def test_calendar_endpoint(self):
        url = "/api/pandits/me/calendar/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
