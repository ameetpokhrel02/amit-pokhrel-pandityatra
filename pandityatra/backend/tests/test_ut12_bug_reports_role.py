from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from bug_reports.models import BugReport

class BugReportRoleTests(TestCase):
    """
    UT12 – Role-Based Submission Check
    Verify bug report submission from different roles (Customer, Pandit, Vendor).
    """
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='r_customer', password='123', email='rc_@test.com', role='user'
        )
        self.pandit = User.objects.create_user(
            username='r_pandit', password='123', email='rp_@test.com', role='pandit'
        )
        self.vendor = User.objects.create_user(
            username='r_vendor', password='123', email='rv_@test.com', role='vendor'
        )
        self.url = '/api/bug-reports/reports/'

    def test_ut12_all_roles_can_submit_bugs(self):
        """Verify all roles can submit bugs (UT12)"""
        test_cases = [
            (self.customer, 'Customer UI issue'),
            (self.pandit, 'Pandit booking glitch'),
            (self.vendor, 'Vendor stock update error')
        ]
        
        for user, title in test_cases:
            self.client.force_authenticate(user=user)
            data = {
                'title': title,
                'description': f'Bug reported by {user.role}',
                'category': 'OTHER',
                'severity': 'LOW'
            }
            response = self.client.post(self.url, data, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Failed for {user.role}")
            
        self.assertEqual(BugReport.objects.count(), 3)

    def test_ut12_role_visibility_privacy(self):
        """Verify users only see their own bugs"""
        BugReport.objects.create(title='C Bug', description='D', reported_by=self.customer)
        BugReport.objects.create(title='P Bug', description='D', reported_by=self.pandit)
        
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.url)
        # Customer should see only 1
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'C Bug')
