from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from pandits.models import PanditUser
from vendors.models import Vendor

class UnauthorizedAccessRestrictionTests(TestCase):
    """
    UT14 – Unauthorized Access Restriction
    Verify that users cannot access restricted routes belonging to other roles or admin functions.
    """
    def setUp(self):
        self.client = APIClient()
        
        # 1. Regular User
        self.user = User.objects.create_user(
            username='sec_user', email='user@sec.com', password='p', role='user'
        )
        
        # 2. Pandit
        self.pandit_user = PanditUser.objects.create_user(
            username='sec_pandit', email='pandit@sec.com', password='p', role='pandit'
        )
        
        # 3. Vendor
        self.vendor_user = Vendor.objects.create_user(
            username='sec_vendor', email='vendor@sec.com', password='p', role='vendor',
            shop_name='Sec Shop', business_type='Test', address='Test', city='Test'
        )

        # Restricted URLs
        self.admin_dashboard_url = reverse('admin-dashboard')
        self.pandit_stats_url = reverse('pandit-dashboard-stats')
        self.vendor_stats_url = reverse('vendor-profile-stats')

    def test_ut14_guest_access_denied(self):
        """Unauthenticated guests must be blocked from all dashboards"""
        for url in [self.admin_dashboard_url, self.pandit_stats_url, self.vendor_stats_url]:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_ut14_user_cannot_cross_boundaries(self):
        """Regular users cannot reach Admin, Pandit, or Vendor features"""
        self.client.force_authenticate(user=self.user)
        
        # Admin check
        self.assertEqual(self.client.get(self.admin_dashboard_url).status_code, status.HTTP_403_FORBIDDEN)
        # Pandit check
        self.assertEqual(self.client.get(self.pandit_stats_url).status_code, status.HTTP_403_FORBIDDEN)
        # Vendor check (Returns 404 because get_object fails or queryset filter results in none)
        self.assertIn(self.client.get(self.vendor_stats_url).status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_ut14_pandit_cannot_access_vendor(self):
        """Pandits are blocked from Vendor shop management"""
        self.client.force_authenticate(user=self.pandit_user)
        response = self.client.get(self.vendor_stats_url)
        # Should be 404 as 'stats' action on VendorProfileViewSet returns 404 if no vendor found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_ut14_vendor_cannot_access_pandit(self):
        """Vendors are blocked from Pandit dashboard stats"""
        self.client.force_authenticate(user=self.vendor_user)
        response = self.client.get(self.pandit_stats_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
