from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import User
from pandits.models import PanditUser
import io

@override_settings(STORAGES={'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'}})
class PanditAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('pandit-register')
        self.login_url = reverse('login-password')

    def test_pandit_registration_success(self):
        """Test successful pandit registration with new inheritance model"""
        mock_file = SimpleUploadedFile(
            "cert.pdf",
            b"file_content",
            content_type="application/pdf"
        )
        data = {
            'email': 'testpandit@example.com',
            'password': 'SecurePassword123!',
            'full_name': 'Test Pandit',
            'phone_number': '9841234567',
            'expertise': 'Vedic Rituals',
            'language': 'Nepali, Hindi, Sanskrit',
            'experience_years': 10,
            'bio': 'Experienced Vedic scholar and ritual specialist.',
            'certification_file': mock_file
        }
        
        response = self.client.post(self.register_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify PanditUser model
        pandit = PanditUser.objects.get(email='testpandit@example.com')
        self.assertEqual(pandit.expertise, 'Vedic Rituals')
        self.assertEqual(pandit.role, 'pandit')
        self.assertEqual(pandit.full_name, 'Test Pandit')
        
        # Verify User inheritance
        self.assertTrue(User.objects.filter(email='testpandit@example.com').exists())

    def test_pandit_login_success(self):
        """Test pandit can login using standard password login"""
        # Create pandit first
        pandit = PanditUser.objects.create_user(
            username='authpandit',
            email='authpandit@example.com',
            password='Password123!',
            full_name='Auth Pandit',
            role='pandit',
            expertise='Astrology'
        )
        
        data = {
            'email': 'authpandit@example.com',
            'password': 'Password123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['role'], 'pandit')

    def test_pandit_registration_duplicate_email(self):
        """Test that pandit registration fails with duplicate email"""
        mock_file = SimpleUploadedFile(
            "cert.pdf",
            b"file_content",
            content_type="application/pdf"
        )
        
        # Create existing user
        User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='Password123!'
        )
        
        data = {
            'email': 'regular@example.com',
            'password': 'NewPassword123!',
            'full_name': 'New Pandit',
            'phone_number': '9800000000',
            'expertise': 'Rituals',
            'language': 'Nepali',
            'experience_years': 5,
            'certification_file': mock_file
        }
        
        response = self.client.post(self.register_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
