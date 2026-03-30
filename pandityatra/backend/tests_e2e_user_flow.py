import datetime
from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone

from users.models import User
from pandits.models import Pandit, PanditService
from services.models import Puja
from samagri.models import SamagriCategory, SamagriItem

class UserE2EFlowTests(APITestCase):
    def setUp(self):
        # Setup Core DB Items
        self.user = User.objects.create_user(
            username='e2e_user',
            email='e2e@test.com',
            password='testpassword123',
            full_name='Test User',
            role='user'
        )

        self.pandit_user = User.objects.create_user(
            username='testpandit',
            email='pandit@test.com',
            password='testpassword123',
            full_name='Test Pandit',
            role='pandit'
        )
        self.pandit_profile = Pandit.objects.create(
            user=self.pandit_user,
            bio='Test Bio',
            experience_years=5,
            is_verified=True,
            verification_status='APPROVED'
        )

        self.puja = Puja.objects.create(
            name='Test Puja',
            description='Test Description',
            base_price=500.0,
            base_duration_minutes=60,
            is_available=True
        )
        self.pandit_service = PanditService.objects.create(
            pandit=self.pandit_profile,
            puja=self.puja,
            custom_price=500.0,
            duration_minutes=60,
            is_active=True,
            is_online=True,
            is_offline=True
        )
        
        self.category = SamagriCategory.objects.create(name='Test Category')
        self.samagri = SamagriItem.objects.create(
            name='Test Samagri',
            category=self.category,
            price=100.0,
            stock_quantity=10,
            is_approved=True,
            is_active=True
        )

    @patch('video.views.ensure_video_room_for_booking')
    @patch('payments.utils.initiate_khalti_payment')
    def test_complete_user_flow(self, mock_khalti, mock_room_creator):
        """End-to-End Test for typical User actions"""
        
        class DummyRoom:
            room_name = "mock-room"
            room_url = "http://mock-video.com"
            status = "scheduled"

        # Mock external APIs
        mock_khalti.return_value = (True, "mock_pidx", "http://mock-khalti.com")
        mock_room_creator.return_value = DummyRoom()

        # 1. Login user
        login_url = '/api/users/login-password/'
        response = self.client.post(login_url, {
            'email': 'e2e@test.com',
            'password': 'testpassword123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        # 2. Book a Pandit
        booking_url = '/api/bookings/'
        future_date = (timezone.now() + datetime.timedelta(days=2)).date()
        book_response = self.client.post(booking_url, {
            'service': self.pandit_service.id,
            'service_name': self.puja.name,
            'pandit': self.pandit_profile.id,
            'booking_date': future_date.isoformat(),
            'booking_time': '10:00:00',
            'service_location': 'ONLINE',
            'customer_location': 'Test Address',
            'samagri_required': True
        })
        self.assertEqual(book_response.status_code, status.HTTP_201_CREATED)
        booking_id = book_response.data.get('id')

        # 3. Shop Checkout Flow
        checkout_url = '/api/samagri/checkout/initiate/'
        checkout_response = self.client.post(checkout_url, {
            'full_name': 'Test User',
            'phone_number': '9812345678',
            'shipping_address': 'Kathmandu',
            'city': 'Kathmandu',
            'payment_method': 'KHALTI',
            'items': [{'id': self.samagri.id, 'quantity': 2}]
        }, format='json')
        self.assertEqual(checkout_response.status_code, status.HTTP_200_OK)
        self.assertIn('payment_url', checkout_response.data)
        
        # Verify Samagri stock reduced
        self.samagri.refresh_from_db()
        self.assertEqual(self.samagri.stock_quantity, 8)

        # 4. Generate Video Room (Simulating Pandit action usually, but testing endpoint)
        # Force booking status to accepted to pass validation
        from bookings.models import Booking
        b = Booking.objects.get(id=booking_id)
        b.status = 'ACCEPTED'
        b.payment_status = True
        b.save()

        video_room_url = '/api/video/rooms/create/'
        video_response = self.client.post(video_room_url, {
            'booking_id': booking_id,
        })
        self.assertEqual(video_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(video_response.data['room_url'], "http://mock-video.com")

        # 5. Connect and Chat (Testing REST fallback or models if WebSocket is used)
        # Since Channels is async, we simulate standard model creation for a Message
        from chat.models import Message, ChatRoom
        room = ChatRoom.objects.create(
            booking_id=booking_id,
            customer=self.user,
            pandit=self.pandit_profile
        )
        msg = Message.objects.create(
            chat_room=room,
            sender=self.user,
            content="Hello Panditji, ready for the Puja!"
        )
        self.assertEqual(room.messages.count(), 1)
        self.assertEqual(msg.content, "Hello Panditji, ready for the Puja!")
