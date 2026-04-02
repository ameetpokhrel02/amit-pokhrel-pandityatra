from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from bug_reports.models import BugReport


class BugReportTests(TestCase):
    """
    UT13 – Bug Report Module
    Tests bug report submission, listing, admin viewing, and status updates.
    """

    def setUp(self):
        self.client = APIClient()

        # Regular customer user
        self.customer = User.objects.create_user(
            username='bug_customer', password='TestPass@123',
            email='bug_customer@example.com', role='user',
            full_name='Bug Customer'
        )

        # Pandit user
        self.pandit = User.objects.create_user(
            username='bug_pandit', password='TestPass@123',
            email='bug_pandit@example.com', role='pandit',
            full_name='Bug Pandit'
        )

        # Vendor user
        self.vendor = User.objects.create_user(
            username='bug_vendor', password='TestPass@123',
            email='bug_vendor@example.com', role='vendor',
            full_name='Bug Vendor'
        )

        # Admin user
        self.admin = User.objects.create_user(
            username='bug_admin', password='TestPass@123',
            email='bug_admin@example.com', role='admin',
            full_name='Bug Admin',
            is_staff=True
        )

    # ─────────────── UT13.1 – Customer can submit a bug report ───────────────
    def test_ut13_customer_submit_bug_report(self):
        """Customer should be able to submit a bug report (UT13.1)"""
        self.client.force_authenticate(user=self.customer)

        data = {
            'title': 'Dashboard loading slow',
            'description': 'The dashboard takes more than 10 seconds to load after login.',
            'category': 'PERFORMANCE',
            'severity': 'HIGH',
        }
        response = self.client.post('/api/bug-reports/reports/', data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Response: {response.data}")
        self.assertEqual(response.data['title'], 'Dashboard loading slow')
        self.assertEqual(response.data['category'], 'PERFORMANCE')
        self.assertEqual(response.data['severity'], 'HIGH')

    # ─────────────── UT13.2 – Pandit can submit a bug report ───────────────
    def test_ut13_pandit_submit_bug_report(self):
        """Pandit should be able to submit a bug report (UT13.2)"""
        self.client.force_authenticate(user=self.pandit)

        data = {
            'title': 'Calendar not syncing',
            'description': 'My blocked dates are not reflecting on the public profile.',
            'category': 'FUNCTIONAL',
            'severity': 'MEDIUM',
        }
        response = self.client.post('/api/bug-reports/reports/', data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Response: {response.data}")
        self.assertEqual(response.data['title'], 'Calendar not syncing')

    # ─────────────── UT13.3 – Vendor can submit a bug report ───────────────
    def test_ut13_vendor_submit_bug_report(self):
        """Vendor should be able to submit a bug report (UT13.3)"""
        self.client.force_authenticate(user=self.vendor)

        data = {
            'title': 'Product image upload broken',
            'description': 'Uploading PNG images for products returns a 500 error.',
            'category': 'UI',
            'severity': 'CRITICAL',
        }
        response = self.client.post('/api/bug-reports/reports/', data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Response: {response.data}")
        self.assertEqual(response.data['severity'], 'CRITICAL')

    # ─────────────── UT13.4 – Unauthenticated user cannot submit ───────────────
    def test_ut13_unauthenticated_cannot_submit(self):
        """Unauthenticated users should NOT be able to submit a bug report (UT13.4)"""
        data = {
            'title': 'Anon Bug',
            'description': 'This should fail.',
            'category': 'OTHER',
            'severity': 'LOW',
        }
        response = self.client.post('/api/bug-reports/reports/', data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ─────────────── UT13.5 – User can list their own bug reports ───────────────
    def test_ut13_user_lists_own_bugs(self):
        """Authenticated user should see only their own bug reports (UT13.5)"""
        # Create bugs for both customer and pandit
        BugReport.objects.create(
            title='Customer Bug', description='desc', category='OTHER',
            severity='LOW', reported_by=self.customer
        )
        BugReport.objects.create(
            title='Pandit Bug', description='desc', category='OTHER',
            severity='LOW', reported_by=self.pandit
        )

        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/bug-reports/reports/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Customer should only see their own bug
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Customer Bug')

    # ─────────────── UT13.6 – Admin can list ALL bug reports ───────────────
    def test_ut13_admin_lists_all_bugs(self):
        """Admin should see ALL bug reports from all users (UT13.6)"""
        BugReport.objects.create(
            title='Customer Bug', description='desc', category='OTHER',
            severity='LOW', reported_by=self.customer
        )
        BugReport.objects.create(
            title='Pandit Bug', description='desc', category='OTHER',
            severity='MEDIUM', reported_by=self.pandit
        )
        BugReport.objects.create(
            title='Vendor Bug', description='desc', category='UI',
            severity='HIGH', reported_by=self.vendor
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/bug-reports/admin/reports/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    # ─────────────── UT13.7 – Admin can filter bugs by status ───────────────
    def test_ut13_admin_filter_by_status(self):
        """Admin should be able to filter bug reports by status (UT13.7)"""
        BugReport.objects.create(
            title='New Bug', description='desc', category='OTHER',
            severity='LOW', reported_by=self.customer, status='NEW'
        )
        BugReport.objects.create(
            title='Resolved Bug', description='desc', category='OTHER',
            severity='LOW', reported_by=self.customer, status='RESOLVED'
        )

        self.client.force_authenticate(user=self.admin)

        response = self.client.get('/api/bug-reports/admin/reports/?status=NEW')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'New Bug')

    # ─────────────── UT13.8 – Admin can update bug status ───────────────
    def test_ut13_admin_update_bug_status(self):
        """Admin should be able to update bug status and add a comment (UT13.8)"""
        bug = BugReport.objects.create(
            title='Bug to update', description='desc', category='FUNCTIONAL',
            severity='HIGH', reported_by=self.customer, status='NEW'
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f'/api/bug-reports/reports/{bug.id}/update_status/',
            {'status': 'IN_PROGRESS', 'admin_comment': 'Looking into this now.'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Response: {response.data}")
        bug.refresh_from_db()
        self.assertEqual(bug.status, 'IN_PROGRESS')
        self.assertEqual(bug.admin_comment, 'Looking into this now.')

    # ─────────────── UT13.9 – Non-admin cannot access admin endpoints ───────────────
    def test_ut13_non_admin_cannot_access_admin_list(self):
        """Regular user should NOT access admin bug report listing (UT13.9)"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/bug-reports/admin/reports/')

        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN],
            f"Expected 403, got {response.status_code}"
        )

    # ─────────────── UT13.10 – Bug report default values ───────────────
    def test_ut13_bug_default_status_is_new(self):
        """Bug reports should default to status 'NEW' (UT13.10)"""
        self.client.force_authenticate(user=self.customer)

        data = {
            'title': 'Test defaults',
            'description': 'Checking default values.',
            'category': 'OTHER',
            'severity': 'LOW',
        }
        response = self.client.post('/api/bug-reports/reports/', data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Status not sent by user but should default to NEW
        bug = BugReport.objects.get(id=response.data['id'])
        self.assertEqual(bug.status, 'NEW')
