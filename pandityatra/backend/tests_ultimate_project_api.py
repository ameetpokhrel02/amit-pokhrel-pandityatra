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
from reviews.models import Review

class UltimateProjectAPITests(APITestCase):
    def setUp(self):
        # 1. Setup Base Data
        self.user_password = "testpassword123"
        self.user = User.objects.create_user(
            username="ultimate_user",
            email="ultimate@example.com",
            password=self.user_password,
            role="user",
            full_name="Ultimate Test User",
            phone_number="9841234567"
        )
        
        self.pandit = PanditUser.objects.create_user(
            username="ultimate_pandit",
            email="ultimate_pandit@example.com",
            password=self.user_password,
            role="pandit",
            full_name="Ultimate Pandit",
            phone_number="9800000000",
            is_verified=True, 
            expertise="Vedic",
            language="Sanskrit",
            experience_years=10
        )
        self.pandit_user = self.pandit
        
        self.puja_category = PujaCategory.objects.create(name="Ultimate Category")
        self.puja = Puja.objects.create(
            category=self.puja_category,
            name="Ultimate Puja",
            description="The final test puja",
            base_price=5000.00
        )
        
        self.samagri_category = SamagriCategory.objects.create(name="Ultimate Samagri")
        self.samagri_item = SamagriItem.objects.create(
            category=self.samagri_category,
            name="Ultimate Incense",
            price=50.00,
            stock_quantity=1000
        )

    def test_01_user_profile_flow(self):
        """Test authentication, profile retrieval, and update."""
        url = reverse('login-password')
        data = {"email": "ultimate@example.com", "password": self.user_password}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        
        profile_url = reverse('profile')
        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 🚨 FIX: UserSerializer uses 'email' instead of 'username'
        self.assertEqual(response.data['email'], "ultimate@example.com")
        
        response = self.client.patch(profile_url, { "full_name": "Updated Ultimate User" }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['full_name'], "Updated Ultimate User")

    def test_02_pandit_search_and_filter(self):
        """Test searching and filtering pandits."""
        # 🚨 FIX: Basename is 'pandits', so list URL is 'pandits-list'
        url = reverse('pandits-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        
        # Filter by service_id
        response = self.client.get(f"{url}?service_id={self.puja.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_03_booking_and_notification_flow(self):
        """Test booking creation and pandit notification."""
        self.client.force_authenticate(user=self.user)
        booking_url = reverse('booking-list')
        data = {
            "pandit": self.pandit.id,
            "service": self.puja.id,
            "service_name": self.puja.name,
            "booking_date": str(date.today()),
            "booking_time": "09:00",
            "service_location": LocationChoices.HOME,
            "full_address": "Ultimate Temple",
            "total_price": 5000.00
        }
        response = self.client.post(booking_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check Pandit notification
        self.client.force_authenticate(user=self.pandit_user)
        notify_url = reverse('notification-list')
        response = self.client.get(notify_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_04_payment_and_chat_flow(self):
        """Test payment initiation and chat room creation."""
        booking = Booking.objects.create(
            user=self.user,
            pandit=self.pandit,
            service_name="Interactive Puja",
            booking_date=date.today(),
            booking_time="11:00",
            total_fee=2000.00
        )
        
        self.client.force_authenticate(user=self.user)
        pay_url = reverse('payment-initiate')
        pay_data = {"booking_id": booking.id, "gateway": "KHALTI"}
        response = self.client.post(pay_url, pay_data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        chat_url = reverse('chat:chatroom-initiate')
        chat_data = {"pandit_id": self.pandit.id}
        response = self.client.post(chat_url, chat_data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        room_id = response.data['id']
        
        msg_url = reverse('chat:message-list', kwargs={'room_id': room_id})
        msg_data = {"content": "Can we start?"}
        response = self.client.post(msg_url, msg_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_05_kundali_and_panchang(self):
        """Test Kundali generation."""
        self.client.force_authenticate(user=self.user)
        kundali_url = '/api/kundali/generate/'
        kundali_data = {
            "dob": "1995-05-10",
            "time": "14:30",
            "latitude": 27.7172,
            "longitude": 85.3240,
            "place": "Kathmandu",
            "timezone": "Asia/Kathmandu"
        }
        response = self.client.post(kundali_url, kundali_data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_202_ACCEPTED])
        
        # Use hardcoded path if reverse fails for panchang
        panchang_url = '/api/panchang/data/'
        response = self.client.get(panchang_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_06_shopping_and_review_flow(self):
        """Test shopping checkout and leaving a review."""
        self.client.force_authenticate(user=self.user)
        checkout_url = '/api/samagri/checkout/initiate/'
        shop_data = {
            "full_name": "Ultimate Shopper",
            "phone_number": "9841234567",
            "shipping_address": "Dev Street",
            "city": "Kathmandu",
            "payment_method": "KHALTI",
            "items": [{"id": self.samagri_item.id, "quantity": 10}]
        }
        response = self.client.post(checkout_url, shop_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        booking = Booking.objects.create(
            user=self.user,
            pandit=self.pandit,
            service_name="Reviewable Puja",
            booking_date=date.today(),
            booking_time="10:00",
            status="COMPLETED",
            payment_status=True
        )
        
        review_url = reverse('create-review')
        review_data = {
            "booking": booking.id,
            "pandit": self.pandit.id,
            "rating": 5,
            "comment": "Exceptional service!"
        }
        response = self.client.post(review_url, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_07_admin_and_content(self):
        """Test admin level stats and site content."""
        self.user.role = "admin"
        self.user.is_staff = True
        self.user.save()
        self.client.force_authenticate(user=self.user)
        
        stats_url = reverse('admin-stats')
        response = self.client.get(stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        content_url = reverse('site-content-public')
        response = self.client.get(content_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
