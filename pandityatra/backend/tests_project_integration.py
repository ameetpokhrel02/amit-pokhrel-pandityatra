import json
from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User, ContactMessage
from pandits.models import PanditUser
from bookings.models import Booking, LocationChoices, BookingStatus
from chat.models import ChatRoom, Message
from samagri.models import SamagriCategory, SamagriItem
from services.models import Puja, PujaCategory
from notifications.models import Notification

class ProjectIntegrationTests(APITestCase):
    def setUp(self):
        # 1. Setup Base Data
        self.user_password = "testpassword123"
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password=self.user_password,
            role="user",
            full_name="Test User",
            phone_number="9841234567"
        )
        
        self.pandit = PanditUser.objects.create_user(
            username="testpandit",
            email="pandit@example.com",
            password=self.user_password,
            role="pandit",
            full_name="Test Pandit",
            is_verified=True
        )
        self.pandit_user = self.pandit
        
        self.puja_category = PujaCategory.objects.create(name="Festivals")
        self.puja = Puja.objects.create(
            category=self.puja_category,
            name="Ganesh Puja",
            description="Deep devotion puja",
            base_price=1001.00
        )
        
        self.samagri_category = SamagriCategory.objects.create(name="Flowers")
        self.samagri_item = SamagriItem.objects.create(
            category=self.samagri_category,
            name="Red Rose",
            price=10.00,
            stock_quantity=100
        )

    def test_01_authentication(self):
        """Test login with password and JWT token generation."""
        url = reverse('login-password')
        data = {
            "email": "testuser@example.com",
            "password": self.user_password
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])

    def test_02_contact_inquiry(self):
        """Test submission of contact/support message."""
        url = reverse('contact')
        data = {
            "name": "Guest User",
            "email": "guest@example.com",
            "subject": "Inquiry about puja",
            "message": "I want to know more about Ganesh Puja."
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_03_booking_creation(self):
        """Test creation of a puja booking."""
        self.client.force_authenticate(user=self.user)
        url = reverse('booking-list')
        data = {
            "pandit": self.pandit.id,
            "service": self.puja.id,
            "service_name": self.puja.name,
            "booking_date": str(date.today()),
            "booking_time": "14:00",
            "service_location": LocationChoices.HOME,
            "full_address": "Test Address",
            "total_price": 1001.00
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"DEBUG: Booking Fail Data: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Booking.objects.count(), 1)

    def test_04_chat_initiation(self):
        """Test initiation of a chat room and sending a message."""
        self.client.force_authenticate(user=self.user)
        url = reverse('chat:chatroom-initiate')
        data = {"pandit_id": self.pandit.id}
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        room_id = response.data.get('id')
        self.assertIsNotNone(room_id)
        
        msg_url = reverse('chat:message-list', kwargs={'room_id': room_id})
        msg_data = {"content": "Hello Panditji"}
        response = self.client.post(msg_url, msg_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_05_shopping_flow(self):
        """Test browsing samagri and adding to cart/checkout."""
        self.client.force_authenticate(user=self.user)
        url = reverse('samagri-item-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Checkout
        try:
            checkout_url = reverse('shop-checkout-initiate')
        except:
            checkout_url = '/api/samagri/checkout/initiate/'
            
        data = {
            "full_name": "Test User",
            "phone_number": "9841234567",
            "shipping_address": "Kathmandu",
            "city": "Kathmandu",
            "payment_method": "KHALTI",
            "items": [{"id": self.samagri_item.id, "quantity": 2}]
        }
        response = self.client.post(checkout_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_06_video_integration_and_webhook(self):
        """Test room creation and mock Daily.co webhook."""
        booking = Booking.objects.create(
            user=self.user,
            pandit=self.pandit,
            service_name="Online Puja",
            booking_date=date.today(),
            booking_time="10:00",
            service_location="ONLINE"
        )
        
        from video.services.room_creator import ensure_video_room_for_booking
        room = ensure_video_room_for_booking(booking)
        self.assertIsNotNone(room.room_url)
        
        url = '/api/video/webhook/'
        payload = {
            "type": "recording.ready",
            "payload": {
                "room_name": booking.daily_room_name,
                "access_link": "https://api.daily.co/recordings/test-rec"
            }
        }
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        booking.refresh_from_db()
        self.assertTrue(booking.recording_available)

    def test_07_notification_flow(self):
        """Test notification generation on booking creation and mark as read."""
        self.client.force_authenticate(user=self.user)
        # Manually trigger notification (as would happen in a real request)
        from notifications.services import notify_booking_created
        booking = Booking.objects.create(
            user=self.user,
            pandit=self.pandit,
            service_name="Test Puja",
            booking_date=date.today(),
            booking_time="12:00"
        )
        notify_booking_created(booking)
        
        # Authenticate as pandit to check notifications
        self.client.force_authenticate(user=self.pandit)
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        
        # Mark all as read
        read_url = reverse('notification-mark-all-read')
        response = self.client.post(read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_08_payment_initiation(self):
        """Test payment initiation for a booking."""
        self.client.force_authenticate(user=self.user)
        booking = Booking.objects.create(
            user=self.user,
            pandit=self.pandit,
            service_name="Payment Test Puja",
            booking_date=date.today(),
            booking_time="15:00",
            total_fee=500.00
        )
        
        url = reverse('payment-initiate')
        data = {
            "booking_id": booking.id,
            "gateway": "KHALTI" # 🚨 FIX: View expects 'gateway'
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        # 🚨 FIX: Different gateways use different keys
        has_url = 'payment_url' in response.data or 'checkout_url' in response.data
        if not has_url:
            print(f"DEBUG: Payment Initiate Response: {response.data}")
        self.assertTrue(has_url)
        
        # Check status
        status_url = reverse('check-status', kwargs={'booking_id': booking.id})
        response = self.client.get(status_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_09_standalone_shopping(self):
        """Dedicated standalone shopping flow test."""
        self.client.force_authenticate(user=self.user)
        
        # 1. Get Categories
        cat_url = reverse('samagri-category-list')
        response = self.client.get(cat_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Get Items in category
        item_url = reverse('samagri-item-list')
        response = self.client.get(f"{item_url}?category={self.samagri_category.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Checkout
        try:
            checkout_url = reverse('shop-checkout-initiate')
        except:
            checkout_url = '/api/samagri/checkout/initiate/'
            
        data = {
            "full_name": "Shopper Name",
            "phone_number": "9800000000",
            "shipping_address": "Shop Street",
            "city": "Bhaktapur",
            "payment_method": "ESEWA",
            "items": [{"id": self.samagri_item.id, "quantity": 1}]
        }
        response = self.client.post(checkout_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('payment_url', response.data)
