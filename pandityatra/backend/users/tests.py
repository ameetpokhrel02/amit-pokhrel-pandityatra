from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomerFlowTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = 'customerpass123'
        self.user = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            full_name='Test Customer',
            password=self.password,
            role='user'
        )

    def test_customer_profile_update(self):
        """Test that a customer can update their own profile"""
        self.client.force_authenticate(user=self.user)
        url = reverse('profile')
        data = {
            'full_name': 'Updated Customer Name',
            'phone_number': '9811223344'
        }
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, 'Updated Customer Name')

    def test_role_security_isolation(self):
        """Ensure a customer cannot access vendor-only stats"""
        self.client.force_authenticate(user=self.user)
        # Note: 'vendor-profile-stats' is a vendor-only endpoint
        url = reverse('vendor-profile-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_access(self):
        """Ensure unauthenticated users cannot access profile"""
        url = reverse('profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
