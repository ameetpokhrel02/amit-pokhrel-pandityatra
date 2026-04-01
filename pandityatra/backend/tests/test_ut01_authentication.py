from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from decimal import Decimal

class UserAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.login_password_url = reverse('login-password')
        self.request_otp_url = reverse('request-otp')
        self.login_otp_url = reverse('login-otp')
        
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPassword123!',
            email='testuser@example.com',
            full_name='Test User',
            role='user'
        )
        
    def test_ut01_login_with_correct_credentials(self):
        """Validate login with correct credentials (UT01)"""
        data = {
            'email': 'testuser@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(self.login_password_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_ut01_login_with_incorrect_password(self):
        """Validate login fails with incorrect password"""
        data = {
            'email': 'testuser@example.com',
            'password': 'WrongPassword!'
        }
        response = self.client.post(self.login_password_url, data, format='json')
        
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        self.assertNotIn('access', response.data)

    def test_ut01_login_with_nonexistent_user(self):
        """Validate login fails with non-existent email"""
        data = {
            'email': 'notfound@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(self.login_password_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
