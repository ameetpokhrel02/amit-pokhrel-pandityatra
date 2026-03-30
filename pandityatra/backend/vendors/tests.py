from django.test import TestCase
from django.urls import reverse
import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import VendorProfile, VendorPayout
from samagri.models import SamagriItem, ShopOrder, ShopOrderItem, SamagriCategory
from chat.models import ChatRoom, Message

User = get_user_model()

class VendorFlowTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create a category required for products
        self.category = SamagriCategory.objects.create(name="Pooja Samagri")
        
        # Create a test user
        self.user_password = 'securepassword123'
        self.user = User.objects.create_user(
            username='testvendor',
            email='vendor@test.com',
            full_name='Test Vendor',
            password=self.user_password,
            role='vendor'
        )
        
        # Create a vendor profile
        self.vendor_profile = VendorProfile.objects.create(
            user=self.user,
            shop_name='Test Shop',
            business_type='Samagri Store',
            address='123 Test St',
            city='Kathmandu',
            bank_name='Test Bank',
            bank_account_number='1122334455',
            account_holder_name='Test Vendor',
            verification_status='PENDING'
        )

    def _generate_test_image(self):
        file = io.BytesIO()
        image = Image.new('RGB', (100, 100), 'white')
        image.save(file, 'jpeg')
        file.seek(0)
        return SimpleUploadedFile('test.jpg', file.read(), content_type='image/jpeg')

    # ---------------------------
    # FEATURE: Registration & Profile
    # ---------------------------

    def test_vendor_registration_new_user(self):
        """Test registration endpoint with a brand new email"""
        url = reverse('vendor-register')
        data = {
            'email': 'newvendor@test.com',
            'password': 'newpassword123',
            'full_name': 'New Vendor',
            'phone_number': '9801234567',
            'shop_name': 'New Shop',
            'business_type': 'Handicrafts',
            'address': '456 New St',
            'city': 'Pokhara',
            'bank_name': 'NIBL',
            'bank_account_number': '00112233',
            'account_holder_name': 'New Vendor',
            'profile_pic': self._generate_test_image()
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(User.objects.filter(email='newvendor@test.com').exists())

    def test_vendor_registration_existing_user(self):
        """Test registration for an existing user (e.g. Google Login upgrade)"""
        existing_user = User.objects.create_user(
            username='googleuser',
            email='google_user@test.com',
            full_name='Google User',
            role='user'
        )
        self.client.force_authenticate(user=existing_user)
        url = reverse('vendor-register')
        data = {
            'shop_name': 'Upgrade Shop',
            'business_type': 'Books',
            'address': '789 Upgrade St',
            'city': 'Lalitpur',
            'bank_name': 'Global IME',
            'bank_account_number': '99887766',
            'account_holder_name': 'Google User',
            'profile_pic': self._generate_test_image()
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        existing_user.refresh_from_db()
        self.assertEqual(existing_user.role, 'vendor')

    def test_vendor_profile_update(self):
        """Test updating profile fields including the new verification fields"""
        self.client.force_authenticate(user=self.user)
        url = reverse('vendor-profile-detail', kwargs={'pk': self.vendor_profile.id})
        data = {'shop_name': 'Updated Shop Name'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vendor_profile.refresh_from_db()
        self.assertEqual(self.vendor_profile.shop_name, 'Updated Shop Name')

    def test_vendor_registration_and_login(self):
        """Test full flow: Registration -> Login to get Token"""
        # 1. Register
        reg_url = reverse('vendor-register')
        reg_data = {
            'email': 'flowvendor@test.com',
            'password': 'flowpassword123',
            'full_name': 'Flow Vendor',
            'phone_number': '9812345678',
            'shop_name': 'Flow Shop',
            'business_type': 'Clothing',
            'address': 'KTM',
            'city': 'KTM',
            'bank_name': 'ADBL',
            'bank_account_number': '55443322',
            'account_holder_name': 'Flow Vendor',
            'profile_pic': self._generate_test_image()
        }
        reg_response = self.client.post(reg_url, reg_data, format='multipart')
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        
        # 2. Login
        login_url = reverse('login-password')
        login_data = {
            'email': 'flowvendor@test.com',
            'password': 'flowpassword123'
        }
        login_response = self.client.post(login_url, login_data)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)
        self.assertEqual(login_response.data['role'], 'vendor')

    # ---------------------------
    # FEATURE: Product Management (Add, Edit, Delete, Stock)
    # ---------------------------

    def test_vendor_product_management(self):
        """Test adding, editing, and deleting products"""
        self.client.force_authenticate(user=self.user)
        
        # 1. ADD NEW PRODUCT
        url = reverse('vendor-products-list')
        data = {
            'category': self.category.id,
            'name': 'Incense Sticks',
            'price': 45.00,
            'stock_quantity': 100,
            'unit': 'pack'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product_id = response.data['id']
        
        # 2. EDIT/UPDATE PRODUCT & STOCK
        url_detail = reverse('vendor-products-detail', kwargs={'pk': product_id})
        update_data = {
            'price': 50.00,
            'stock_quantity': 80  # Managed stock
        }
        response = self.client.patch(url_detail, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product = SamagriItem.objects.get(id=product_id)
        self.assertEqual(float(product.price), 50.00)
        self.assertEqual(product.stock_quantity, 80)
        
        # 3. DELETE PRODUCT
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SamagriItem.objects.filter(id=product_id).exists())

    # ---------------------------
    # FEATURE: Order Management (View, Start Status)
    # ---------------------------

    def test_vendor_order_management(self):
        """Test viewing own orders and updating status"""
        self.client.force_authenticate(user=self.user)
        
        # Setup: Create a product and an order with it
        product = SamagriItem.objects.create(
            category=self.category, vendor=self.vendor_profile, name='Pooja Kit', price=500.00
        )
        order = ShopOrder.objects.create(
            user=self.user, total_amount=500.00, status='PAID',
            full_name='Buyer', phone_number='9800000000', shipping_address='KTM', city='KTM'
        )
        ShopOrderItem.objects.create(
            order=order, samagri_item=product, vendor=self.vendor_profile,
            quantity=1, price_at_purchase=500.00
        )
        
        # 1. VIEW OWN ORDERS
        url_list = reverse('vendor-orders-list')
        response = self.client.get(url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], order.id)
        
        # 2. MANAGE ORDER STATUS
        url_status = reverse('vendor-orders-update-status', kwargs={'pk': order.id})
        response = self.client.post(url_status, {'status': 'SHIPPED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'SHIPPED')

    # ---------------------------
    # FEATURE: Sales & Payouts (Request Withdrawal)
    # ---------------------------

    def test_vendor_payout_and_stats(self):
        """Test performance stats and requesting withdrawal"""
        self.client.force_authenticate(user=self.user)
        
        # 1. VIEW SHOP PERFORMANCE (Stats)
        url_stats = reverse('vendor-profile-stats')
        response = self.client.get(url_stats)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_revenue', response.data)
        
        # 2. REQUEST WITHDRAWAL
        url_payout = reverse('vendor-payouts-list')
        payout_data = {'amount': 1000.00}
        response = self.client.post(url_payout, payout_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(VendorPayout.objects.filter(vendor=self.vendor_profile, amount=1000.00).exists())

    def test_unauthorized_access(self):
        """Ensure users without vendor role cannot access vendor endpoints"""
        normal_user = User.objects.create_user(
            username='normaluser', email='normal@test.com', full_name='Normal User', role='user'
        )
        self.client.force_authenticate(user=normal_user)
        url = reverse('vendor-profile-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_vendor_settings_update(self):
        """Test updating the new vendor shop settings"""
        self.client.force_authenticate(user=self.user)
        url = reverse('vendor-profile-detail', kwargs={'pk': self.vendor_profile.id})
        data = {
            'is_accepting_orders': False,
            'auto_approve_orders': True,
            'notification_email': 'notify@test.com',
            'is_low_stock_alert_enabled': False
        }
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.vendor_profile.refresh_from_db()
        self.assertFalse(self.vendor_profile.is_accepting_orders)
        self.assertTrue(self.vendor_profile.auto_approve_orders)
        self.assertEqual(self.vendor_profile.notification_email, 'notify@test.com')
        self.assertFalse(self.vendor_profile.is_low_stock_alert_enabled)

    def test_vendor_messaging(self):
        """Test vendor customer interactions via chat"""
        # Create a customer
        customer = User.objects.create_user(
            username='customer1', email='customer@test.com', password='pass', role='user'
        )
        
        # Create a chat room between customer and vendor
        room = ChatRoom.objects.create(
            customer=customer,
            vendor=self.vendor_profile,
            is_active=True
        )
        
        # 1. Customer sends message
        self.client.force_authenticate(user=customer)
        url = reverse('chat:message-list', kwargs={'room_id': room.id})
        self.client.post(url, {'content': 'Hello Vendor'})
        
        # 2. Vendor lists rooms and sees the message
        self.client.force_authenticate(user=self.user)
        url_rooms = reverse('chat:chatroom-list')
        response = self.client.get(url_rooms)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['last_message'], 'Hello Vendor')
        
        # 3. Vendor replies
        url_msg = reverse('chat:message-list', kwargs={'room_id': room.id})
        response = self.client.post(url_msg, {'content': 'Hello Customer'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Message.objects.filter(chat_room=room, content='Hello Customer', sender=self.user).exists())
