from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from bug_reports.models import BugReport

class BugReportSubmissionTests(TestCase):
    """
    UT11 – Bug Report Submission
    Submit bug report directly to admin via multi-role accounts.
    """
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='bug_submitter', password='123', email='bs@test.com', role='user'
        )
        self.admin = User.objects.create_user(
            username='admin_bug_viewer', password='123', email='abv@test.com', role='admin', is_staff=True
        )
        self.client.force_authenticate(user=self.user)
        self.url = '/api/bug-reports/reports/'

    def test_ut11_submit_bug_report_successfully(self):
        """Submit bug report successfully (UT11)"""
        data = {
            'title': 'Checkout Freeze',
            'description': 'The app crashes when clicking Pay Now.',
            'category': 'FUNCTIONAL',
            'severity': 'CRITICAL'
        }
        # BugReportViewSet uses MultiPartParser
        response = self.client.post(self.url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BugReport.objects.count(), 1)
        bug = BugReport.objects.first()
        self.assertEqual(bug.title, 'Checkout Freeze')
        self.assertEqual(bug.reported_by, self.user)

    def test_ut11_admin_can_access_reports(self):
        """Admin can see all reports"""
        BugReport.objects.create(title='Bug 1', description='D', reported_by=self.user)
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
