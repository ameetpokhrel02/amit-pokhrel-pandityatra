import random
import string
import base64
from rest_framework import status
from django.utils import timezone
from decimal import Decimal
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import User
from pandits.models import PanditUser, PanditWallet
from vendors.models import Vendor
from bookings.models import Booking
from samagri.models import SamagriCategory
from rest_framework.test import APITestCase, APIClient

def get_random_id(k=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=k))

# A valid 1x1 transparent PNG to satisfy Cloudinary/Image validation
VALID_PNG_DATA = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
)

class TestJourneyAnita(APITestCase):
    """
    Anita (Customer) – Full Journey Verification
    """
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(username='anita', email='anita@t.com', role='user')
        self.pandit = PanditUser.objects.create_user(username='ramesh', email='ramesh@t.com', role='pandit', is_verified=True)
        from services.models import Puja, PujaCategory
        cat = PujaCategory.objects.create(name='P')
        self.puja = Puja.objects.create(name='Pasni', category=cat, base_price=1000)

    def test_anita_full_flow(self):
        # 1. Login
        self.client.force_authenticate(user=self.customer)
        
        # 2. Search Pandits
        url = reverse('pandits-list') 
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # 3. Book Puja
        booking_url = reverse('booking-list')
        data = {
            "pandit": self.pandit.id,
            "service": self.puja.id,
            "service_name": self.puja.name, 
            "booking_date": "2026-05-15",
            "booking_time": "14:00:00",
            "service_location": "ONLINE"
        }
        response = self.client.post(booking_url, data, format='json')
        self.assertEqual(response.status_code, 201)
        booking_id = response.data['id']
        
        # 4. Get Samagri Recommendations
        rec_url = reverse('ai-samagri-recommend')
        response = self.client.post(rec_url, {"puja_id": self.puja.id}, format='json')
        self.assertEqual(response.status_code, 200)
        
        # 5. Payment Mock
        booking = Booking.objects.get(id=booking_id)
        booking.payment_status = True
        booking.payment_method = 'KHALTI'
        booking.transaction_id = 'tx_anita_123'
        booking.status = 'ACCEPTED'
        booking.save()
        
        # 6. Check My Bookings
        my_bookings_url = f'/api/bookings/my_bookings/'
        response = self.client.get(my_bookings_url)
        self.assertEqual(response.status_code, 200)

class TestJourneyRamesh(APITestCase):
    """
    Ramesh (Pandit) – Full Journey Verification
    """
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin', email='a@t.com', password='p')
        self.customer = User.objects.create_user(username='cust', email='c@t.com')
        from services.models import Puja, PujaCategory
        cat = PujaCategory.objects.create(name='P')
        self.puja = Puja.objects.create(name='P', category=cat, base_price=5000)

    def test_ramesh_flow(self):
        # 1. Registration
        reg_url = reverse('pandit-register')
        img_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
        cert_file = SimpleUploadedFile("cert.png", img_data, content_type="image/png")
        
        data = {
            "username": "ramesh_new",
            "email": "ramesh_new@test.com",
            "password": "SecurePass123!",
            "full_name": "Ramesh Pandit",
            "experience_years": 10,
            "expertise": "Vedic Scholar",
            "language": "Hindi, Sanskrit",
            "bio": "Expert Vedic Pandit from Varanasi.",
            "certification_file": cert_file
        }
        response = self.client.post(reg_url, data, format='multipart')
        self.assertEqual(response.status_code, 201)
        
        p_user = User.objects.get(email=data['email'])
        pandit = PanditUser.objects.get(id=p_user.id)
        
        # 2. Admin Approval
        self.client.force_authenticate(user=self.admin)
        approve_url = f'/api/pandits/admin/verify/{pandit.id}/' 
        response = self.client.post(approve_url, {})
        self.assertEqual(response.status_code, 200)
        
        # 3. Acceptance & Completion Logic 
        pandit.refresh_from_db()
        self.assertTrue(pandit.is_verified)
        
        booking = Booking.objects.create(
            user=self.customer,
            pandit=pandit,
            service=self.puja,
            service_name=self.puja.name,
            booking_date="2026-06-02",
            booking_time="10:00:00",
            status="PENDING",
            total_fee=5000.00
        )
        
        # Pandit Accept
        self.client.force_authenticate(user=p_user)
        status_url = f'/api/bookings/{booking.id}/update_status/'
        response = self.client.patch(status_url, {"status": "ACCEPTED"}, format='json')
        self.assertEqual(response.status_code, 200)
        
        # Pandit Complete
        response = self.client.patch(status_url, {"status": "COMPLETED"}, format='json')
        self.assertEqual(response.status_code, 200)
        
        wallet, _ = PanditWallet.objects.get_or_create(pandit=pandit)
        self.assertGreater(wallet.total_earned, 0)

class TestJourneyRiya(APITestCase):
    def test_riya_flow(self):
        admin = User.objects.create_superuser(username='admin_riya', email='ar@t.com', password='p')
        self.client.force_authenticate(user=admin)
        v_cat = SamagriCategory.objects.create(name="Cat", slug="cat")
        
        reg_url = reverse('vendor-register')
        img_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
        id_proof = SimpleUploadedFile("id.png", img_data, content_type="image/png")
        
        data = {
            "email": "riya_new@test.com",
            "password": "SecurePass123!",
            "shop_name": "Riya Store",
            "business_type": "samagri",
            "address": "Baneswor",
            "city": "Kathmandu",
            "bank_account_number": "1234567890",
            "bank_name": "Nabil Bank",
            "account_holder_name": "Riya Shrestha",
            "id_proof": id_proof
        }
        response = self.client.post(reg_url, data, format='multipart')
        self.assertEqual(response.status_code, 201) 
        
        v_user = User.objects.get(email=data['email'])
        vendor = Vendor.objects.get(id=v_user.id)
        
        # Admin Approval (Fixed URL)
        verify_url = f'/api/vendors/verify/{vendor.id}/'
        response = self.client.post(verify_url, {'status': 'APPROVED'})
        self.assertEqual(response.status_code, 200)
        
        # Add Product
        self.client.force_authenticate(user=v_user)
        product_url = reverse('vendor-products-list')
        product_data = {
            "category": v_cat.id,
            "name": "Kusha",
            "price": 200.00,
            "stock_quantity": 100
        }
        response = self.client.post(product_url, product_data, format='json')
        self.assertEqual(response.status_code, 201)

class TestJourneyNikesh(APITestCase):
    """
    Nikesh (Admin) – Oversight Verification
    """
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='nikesh', email='nikesh@t.com', password='p')
        self.client.force_authenticate(user=self.admin)

    def test_nikesh_oversight(self):
        # 1. Dashboard Stats
        url = reverse('admin-dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # 2. Activity Logs
        url = reverse('admin-activity-logs')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # 3. Error Logs
        url = reverse('admin-error-logs')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
