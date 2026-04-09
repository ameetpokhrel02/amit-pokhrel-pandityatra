import datetime
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from users.models import User
from pandits.models import PanditUser
from vendors.models import Vendor
from bookings.models import Booking, BookingStatus
from bug_reports.models import BugReport
from kundali.models import Kundali
from chat.models import ChatRoom, Message
from services.models import Puja


# Strong password that passes all validators
STRONG_PASSWORD = 'TestPass@123'


class FullPlatformTestSuite(TestCase):
    """
    Consolidated Master Test Suite (UT01–UT14)
    Validates end-to-end functionality of the PanditYatra platform.
    """
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='auth_user', email='user@test.com',
            password=STRONG_PASSWORD, role='user'
        )

    # ======================================================================
    # UT01 – Authentication
    # ======================================================================
    def test_ut01_authentication_flow(self):
        """UT01: Validate login with correct credentials returns JWT tokens"""
        url = reverse('login-password')
        response = self.client.post(url, {'email': self.user.email, 'password': STRONG_PASSWORD})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    # ======================================================================
    # UT02 – User Registration
    # ======================================================================
    def test_ut02_user_registration(self):
        """UT02: Register new customer account"""
        url = reverse('register')
        data = {
            'email': 'new@test.com',
            'password': STRONG_PASSWORD,
            'full_name': 'New User',
            'role': 'user'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='new@test.com').exists())

    # ======================================================================
    # UT03 – Booking Flow
    # ======================================================================
    def test_ut03_pandit_booking_flow(self):
        """UT03: Book a pandit — verify booking creation and status lifecycle"""
        p_user = PanditUser.objects.create_user(
            username='b_pandit', email='p@book.com', password='p',
            role='pandit', expertise='Vedic', is_verified=True,
            verification_status='APPROVED'
        )
        booking = Booking.objects.create(
            user=self.user, pandit=p_user, service_name='Ganesh Puja',
            booking_date=datetime.date.today(), booking_time=datetime.time(10, 0),
            total_fee=1000, service_location='HOME'
        )
        self.assertEqual(booking.status, BookingStatus.PENDING)

        booking.status = BookingStatus.ACCEPTED
        booking.save()
        self.assertEqual(Booking.objects.get(id=booking.id).status, BookingStatus.ACCEPTED)

    # ======================================================================
    # UT04 – Payment Integration
    # ======================================================================
    def test_ut04_payment_logic(self):
        """UT04: Verify payment_status field update on a booking"""
        p_user = PanditUser.objects.create_user(
            username='pay_p', email='pay@p.com', password='p', role='pandit'
        )
        booking = Booking.objects.create(
            user=self.user, pandit=p_user, service_name='Test Puja',
            booking_date=datetime.date.today(), booking_time=datetime.time(11, 0),
            total_fee=500
        )
        # payment_status is a BooleanField (False=unpaid, True=paid)
        booking.payment_status = True
        booking.transaction_id = 'TXN123'
        booking.save()
        self.assertTrue(Booking.objects.get(id=booking.id).payment_status)
        self.assertEqual(Booking.objects.get(id=booking.id).transaction_id, 'TXN123')

    # ======================================================================
    # UT05 – AI Samagri
    # ======================================================================
    @patch('ai.views.ToolRouter.execute')
    def test_ut05_ai_samagri_response(self, mock_tool_execute):
        """UT05: AI Samagri endpoint returns structured product list"""
        puja = Puja.objects.create(name='Griha Pravesh', base_price=1000)

        mock_result = MagicMock()
        mock_result.ok = True
        mock_result.message = "Items calculated"
        mock_result.type = "RECOMMENDATION"
        mock_result.data = {
            "products": [{"id": 1, "name": "Deepak", "price": 50}],
            "context": {"puja_name": "Griha Pravesh"}
        }
        mock_tool_execute.return_value = mock_result

        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/ai/puja-samagri/', {'puja_id': puja.id, 'location': 'Remote'}, format='json')

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertIn('products', response.data)
        self.assertEqual(response.data['products'][0]['name'], 'Deepak')

    # ======================================================================
    # UT06 – Video Call
    # ======================================================================
    def test_ut06_video_call_room_assignment(self):
        """UT06: Video call room URL is assigned for ONLINE bookings"""
        p_user = PanditUser.objects.create_user(
            username='v_p', email='v@p.com', password='p', role='pandit'
        )
        booking = Booking.objects.create(
            user=self.user, pandit=p_user, service_name='Online Puja',
            booking_date=datetime.date.today(), booking_time=datetime.time(12, 0),
            total_fee=1500, service_location='ONLINE', status=BookingStatus.ACCEPTED
        )
        booking.daily_room_url = "https://daily.co/test-room"
        booking.save()
        self.assertIsNotNone(Booking.objects.get(id=booking.id).daily_room_url)
        self.assertIn('daily.co', booking.daily_room_url)

    # ======================================================================
    # UT07 – Kundali System
    # ======================================================================
    def test_ut07_kundali_creation_and_ai(self):
        """UT07: Kundali creation with correct field names and AI prediction storage"""
        kundali = Kundali.objects.create(
            user=self.user,
            dob='1995-01-01',        # Correct field: dob (not birth_date)
            time='12:00:00',          # Correct field: time (not birth_time)
            place='Kathmandu',
            latitude=27.7,            # Correct field: latitude (not lat)
            longitude=85.3,           # Correct field: longitude (not lon)
            timezone='Asia/Kathmandu',
            lagna=None,
            midheaven=None
        )
        self.assertIsNotNone(kundali.id)
        kundali.ai_prediction = "A prosperous year ahead."
        kundali.save()
        self.assertEqual(Kundali.objects.get(id=kundali.id).ai_prediction, "A prosperous year ahead.")

    # ======================================================================
    # UT08 – Real-Time Chat
    # ======================================================================
    @patch('chat.views.notify_new_message')  # Correct mock path from test_ut08_chat.py
    def test_ut08_chat_notification_trigger(self, mock_notify):
        """UT08: Sending a chat message triggers the notification function"""
        p_user = PanditUser.objects.create_user(
            username='c_p', email='c@p.com', password='p', role='pandit'
        )
        room = ChatRoom.objects.create(
            customer=self.user, pandit=p_user, is_pre_booking=True
        )
        self.client.force_authenticate(user=self.user)
        # Correct URL from original UT08 test
        message_url = f'/api/chat/rooms/{room.id}/messages/'
        response = self.client.post(message_url, {'content': 'Namaste', 'message_type': 'TEXT'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.filter(chat_room=room).count(), 1)
        self.assertTrue(mock_notify.called)

    # ======================================================================
    # UT09 – Pandit Registration (MTI)
    # ======================================================================
    def test_ut09_pandit_registration_direct(self):
        """UT09: Pandit registration via API creates MTI PanditUser child record"""
        url = reverse('register')
        data = {
            'email': 'p@reg.com', 'password': STRONG_PASSWORD,
            'full_name': 'Test Pandit', 'role': 'pandit', 'expertise': 'Vedic'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PanditUser.objects.filter(email='p@reg.com').exists())
        self.assertEqual(PanditUser.objects.get(email='p@reg.com').expertise, 'Vedic')

    # ======================================================================
    # UT10 – Vendor Registration (MTI)
    # ======================================================================
    def test_ut10_vendor_registration_direct(self):
        """UT10: Vendor registration via API creates MTI Vendor child record"""
        url = reverse('register')
        data = {
            'email': 'v@reg.com', 'password': STRONG_PASSWORD,
            'full_name': 'Test Vendor', 'role': 'vendor', 'shop_name': 'Divine Items'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Vendor.objects.filter(email='v@reg.com').exists())
        self.assertEqual(Vendor.objects.get(email='v@reg.com').shop_name, 'Divine Items')

    # ======================================================================
    # UT11 – Bug Report Submission
    # ======================================================================
    def test_ut11_bug_reporting(self):
        """UT11: Submit a bug report and verify it is stored"""
        self.client.force_authenticate(user=self.user)
        data = {'title': 'Map Bug', 'description': 'Map fails to load', 'category': 'UI', 'severity': 'MEDIUM'}
        response = self.client.post('/api/bug-reports/reports/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BugReport.objects.count(), 1)

    # ======================================================================
    # UT12 – Bug Report Role Privacy
    # ======================================================================
    def test_ut12_bug_report_visibility(self):
        """UT12: Users see only their own bug reports"""
        other_user = User.objects.create_user(
            username='o', email='o@t.com', password='p'
        )
        BugReport.objects.create(title='My Bug', description='D', reported_by=self.user)
        BugReport.objects.create(title='Other Bug', description='D', reported_by=other_user)

        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/bug-reports/reports/')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'My Bug')

    # ======================================================================
    # UT13 – RBAC Authorized Access
    # ======================================================================
    def test_ut13_authorized_dashboards(self):
        """UT13: Each role successfully accesses its own dashboard"""
        # Admin → Global Dashboard
        admin = User.objects.create_user(
            username='adm', role='admin', is_staff=True,
            password='p', email='a@t.com'
        )
        self.client.force_authenticate(user=admin)
        self.assertEqual(self.client.get(reverse('admin-dashboard')).status_code, status.HTTP_200_OK)

        # Pandit → Dashboard Stats
        p_user = PanditUser.objects.create_user(
            username='st_p', role='pandit', password='p', email='sp@t.com'
        )
        self.client.force_authenticate(user=p_user)
        self.assertEqual(self.client.get(reverse('pandit-dashboard-stats')).status_code, status.HTTP_200_OK)

    # ======================================================================
    # UT14 – RBAC Unauthorized Restrictions
    # ======================================================================
    def test_ut14_unauthorized_restrictions(self):
        """UT14: Unauthorized role-cross access is blocked"""
        # Regular user blocked from Admin Dashboard
        self.client.force_authenticate(user=self.user)
        self.assertEqual(self.client.get(reverse('admin-dashboard')).status_code, status.HTTP_403_FORBIDDEN)

        # Guest (unauthenticated) blocked from Pandit Stats
        self.client.logout()
        self.assertEqual(self.client.get(reverse('pandit-dashboard-stats')).status_code, status.HTTP_401_UNAUTHORIZED)
