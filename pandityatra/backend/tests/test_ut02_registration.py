from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User

class UserRegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        
    def test_ut02_register_new_user(self):
        """Register new user successfully (UT02)"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'full_name': 'New User',
            'role': 'user'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        # Depending on how the API is set up, it could return 201 Created or 200 OK
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        # Verify user was created in the database
        user_exists = User.objects.filter(email='newuser@example.com').exists()
        self.assertTrue(user_exists)

    def test_ut02_register_duplicate_email(self):
        """Attempt to register a user with an already existing email"""
        # Create an existing user first
        User.objects.create_user(
            username='existinguser',
            password='TestPassword123!',
            email='existing@example.com',
            full_name='Existing User'
        )
        
        data = {
            'username': 'anotheruser',
            'email': 'existing@example.com',  # Duplicate email
            'password': 'SecurePassword123!',
            'full_name': 'Another User'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        # Should fail due to duplicate email
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
