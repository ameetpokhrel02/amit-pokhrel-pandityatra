from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from pandits.models import PanditUser
from vendors.models import Vendor

class RoleBasedAccessAuthorizedTests(TestCase):
    """
    UT13 – Role-Based Access Control (Authorized)
    Verify that each role is correctly authorized to access its own respective dashboard and management features.
    """
    def setUp(self):
        self.client = APIClient()
        
        # 1. Setup Admin
        self.admin = User.objects.create_user(
            username='auth_admin', email='admin@auth.com', password='p', role='admin', is_staff=True
        )
        
        # 2. Setup Pandit
        self.pandit_user = PanditUser.objects.create_user(
            username='auth_pandit', email='pandit@auth.com', password='p', role='pandit'
        )
        
        # 3. Setup Vendor
        self.vendor_user = Vendor.objects.create_user(
            username='auth_vendor', email='vendor@auth.com', password='p', role='vendor',
            shop_name='RBAC Valid Shop', business_type='Retail', address='Kathmandu', city='KTM'
        )

    def test_ut13_admin_access_dashboard_success(self):
        """Verify Admin can access the global overview dashboard"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', response.data)
        self.assertEqual(response.data.get('system_status'), 'OK')

    def test_ut13_pandit_access_stats_success(self):
        """Verify Pandit can access their dashboard stats"""
        self.client.force_authenticate(user=self.pandit_user)
        url = reverse('pandit-dashboard-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertIn('total_earned', response.data['stats'])

    def test_ut13_vendor_access_stats_success(self):
        """Verify Vendor can access their shop stats"""
        self.client.force_authenticate(user=self.vendor_user)
        url = reverse('vendor-profile-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_revenue', response.data)
        self.assertIn('current_balance', response.data)

    def test_ut13_basic_user_profile_success(self):
        """Verify basic user can access their own profile (generic for all roles)"""
        self.client.force_authenticate(user=self.pandit_user) # Logic should hold for any authenticated user
        url = reverse('profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('email'), 'pandit@auth.com')
