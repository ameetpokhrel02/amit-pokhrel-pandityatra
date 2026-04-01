from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from vendors.models import Vendor

@override_settings(STORAGES={'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'}})
class VendorAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('vendor-register')
        self.login_url = reverse('login-password')

    def test_vendor_registration_success(self):
        """Test successful vendor registration with new inheritance model"""
        data = {
            'email': 'testvendor@example.com',
            'password': 'SecurePassword123!',
            'full_name': 'Test Vendor',
            'phone_number': '9812345678',
            'shop_name': 'Test Puja Shop',
            'business_type': 'RETAIL',
            'address': 'Koteshwor, Kathmandu',
            'city': 'Kathmandu',
            'bank_name': 'Global IME',
            'bank_account_number': '1234567890',
            'account_holder_name': 'Test Vendor',
            'bio': 'We sell authentic puja samagri.'
        }
        response = self.client.post(self.register_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Vendor model
        vendor = Vendor.objects.get(email='testvendor@example.com')
        self.assertEqual(vendor.shop_name, 'Test Puja Shop')
        self.assertEqual(vendor.role, 'vendor')
        self.assertEqual(vendor.full_name, 'Test Vendor')
        
        # Verify User inheritance
        self.assertTrue(User.objects.filter(email='testvendor@example.com').exists())

    def test_vendor_login_success(self):
        """Test vendor can login using standard password login"""
        # Creater vendor first
        vendor = Vendor.objects.create_user(
            username='authvendor',
            email='authvendor@example.com',
            password='Password123!',
            full_name='Auth Vendor',
            role='vendor',
            shop_name='Auth Shop'
        )
        
        data = {
            'email': 'authvendor@example.com',
            'password': 'Password123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['role'], 'vendor')

    def test_vendor_registration_duplicate_email(self):
        """Test that vendor registration fails with duplicate email"""
        # Create existing user
        User.objects.create_user(
            username='busyuser',
            email='busy@example.com',
            password='Password123!'
        )
        
        data = {
            'email': 'busy@example.com',
            'password': 'NewPassword123!',
            'full_name': 'Conflict User',
            'phone_number': '9800000000',
            'shop_name': 'Conflict Shop',
            'business_type': 'RETAIL',
            'address': 'Test Address',
            'city': 'Test City',
            'bank_name': 'Test Bank',
            'bank_account_number': '0000000000',
            'account_holder_name': 'Test User'
        }
        response = self.client.post(self.register_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
