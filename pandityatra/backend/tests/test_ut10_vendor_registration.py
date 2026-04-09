from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from vendors.models import Vendor

class VendorRegistrationTests(TestCase):
    """
    UT10 – Vendor Registration
    Register vendor account and shop management.
    """
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.admin = User.objects.create_user(
            username='admin_v_reg', password='p', email='ad_v@test.com', role='admin', is_staff=True
        )

    def test_ut10_register_new_vendor_via_api(self):
        """Register new vendor successfully (UT10)"""
        data = {
            'username': 'reg_vendor',
            'email': 'reg_v@test.com',
            'full_name': 'Registered Vendor',
            'password': 'SecurePass123!',
            'role': 'vendor',
            'shop_name': 'Vedic Shop',
            'business_type': 'Retail'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Vendor.objects.filter(email='reg_v@test.com').exists())
        vendor = Vendor.objects.get(email='reg_v@test.com')
        self.assertEqual(vendor.shop_name, 'Vedic Shop')
        self.assertEqual(vendor.verification_status, 'PENDING')

    def test_ut10_admin_verify_vendor_logic(self):
        """Verify the admin vendor verification endpoint"""
        vendor = Vendor.objects.create_user(
            username='v_v_log', email='vv_log@test.com', password='p', role='vendor', shop_name='Test'
        )
        
        self.client.force_authenticate(user=self.admin)
        url = f'/api/vendors/verify/{vendor.id}/'
        data = {'status': 'APPROVED'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        vendor.refresh_from_db()
        self.assertTrue(vendor.is_verified)
        self.assertEqual(vendor.verification_status, 'APPROVED')
