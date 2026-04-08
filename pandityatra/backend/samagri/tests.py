from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from vendors.models import Vendor
from .models import SamagriItem, SamagriCategory, ShopOrder, ShopOrderItem

User = get_user_model()

class ShopFlowTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # 1. Create a Vendor
        self.vendor = Vendor.objects.create_user(
            username='shopowner', email='shop@test.com', password='pass', role='vendor',
            shop_name='Divine Samagri', business_type='Shop',
            address='KTM', city='Kathmandu', bank_name='Test', bank_account_number='1',
            account_holder_name='Test', verification_status='APPROVED', is_verified=True
        )
        self.vendor_user = self.vendor
        
        # 2. Create a Category and Product
        self.category = SamagriCategory.objects.create(name='Pooja', slug='pooja')
        self.product = SamagriItem.objects.create(
            name='Ghee', category=self.category, vendor=self.vendor,
            price=200.00, stock_quantity=10, is_active=True, is_approved=True
        )
        
        # 3. Create a Customer
        self.customer = User.objects.create_user(
            username='buyer', email='buyer@test.com', password='pass', role='user'
        )

    def test_customer_view_products(self):
        """Test that a customer can see the shop products"""
        self.client.force_authenticate(user=self.customer)
        url = reverse('samagri-item-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle both paginated and non-paginated responses
        items = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['name'], 'Ghee')

    def test_vendor_order_visibility(self):
        """Test that when a customer places an order, the vendor sees it"""
        # Simulate an order placement (direct model creation as checkout is usually complex/Stripe)
        order = ShopOrder.objects.create(
            user=self.customer, total_amount=200.00, status='PAID',
            full_name='Buyer', phone_number='98000', shipping_address='KTM', city='KTM'
        )
        ShopOrderItem.objects.create(
            order=order, samagri_item=self.product, vendor=self.vendor,
            quantity=1, price_at_purchase=200.00
        )
        
        # Vendor logs in and checks orders
        self.client.force_authenticate(user=self.vendor_user)
        url = reverse('vendor-orders-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['customer_name'], 'Buyer')
        self.assertEqual(response.data[0]['items'][0]['item_name'], 'Ghee')

    def test_order_status_update_sync(self):
        """Test that vendor shipping an order updates the order status"""
        order = ShopOrder.objects.create(
            user=self.customer, total_amount=200.00, status='PAID',
            full_name='Buyer', phone_number='98000', shipping_address='KTM', city='KTM'
        )
        ShopOrderItem.objects.create(
            order=order, samagri_item=self.product, vendor=self.vendor,
            quantity=1, price_at_purchase=200.00
        )
        
        # Vendor updates status to SHIPPED
        self.client.force_authenticate(user=self.vendor_user)
        url = reverse('vendor-orders-update-status', kwargs={'pk': order.id})
        self.client.post(url, {'status': 'SHIPPED'})
        
        # Check original order
        order.refresh_from_db()
        self.assertEqual(order.status, 'SHIPPED')
