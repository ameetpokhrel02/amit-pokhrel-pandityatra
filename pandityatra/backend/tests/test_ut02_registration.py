from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User

class UserRegistrationTests(TestCase):
    """
    UT02 – User Registration
    Register new user account with details.
    """
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        
    def test_ut02_register_new_user(self):
        """Register new user successfully (UT02)"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'full_name': 'New User',
            'password': 'SecurePass123!',
            'role': 'user'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newuser@test.com').exists())

    def test_ut02_register_duplicate_email(self):
        """Register fails with duplicate email"""
        User.objects.create_user(username='existing', email='duplicate@test.com', password='p')
        data = {
            'username': 'another',
            'email': 'duplicate@test.com',
            'password': 'p2',
            'role': 'user'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
