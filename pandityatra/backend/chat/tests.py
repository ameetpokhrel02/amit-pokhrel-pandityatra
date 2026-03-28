from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from pandits.models import Pandit
from vendors.models import VendorProfile
from .models import ChatRoom, Message

User = get_user_model()

class ChatSystemTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # 1. Create Users
        self.customer = User.objects.create_user(username='cust', email='cust@t.com', role='user')
        self.hacker = User.objects.create_user(username='hacker', email='hacker@t.com', role='user')
        
        self.vendor_user = User.objects.create_user(username='vend', email='vend@t.com', role='vendor')
        self.vendor = VendorProfile.objects.create(
            user=self.vendor_user, shop_name='V-Shop', business_type='Shop',
            address='KTM', city='KTM', bank_name='B', bank_account_number='1',
            account_holder_name='V', verification_status='APPROVED', is_verified=True
        )
        
        self.pandit_user = User.objects.create_user(username='pand', email='pand@t.com', role='pandit')
        self.pandit = Pandit.objects.create(
            user=self.pandit_user,
            expertise="Ganesh Puja",
            verification_status="APPROVED",
            is_verified=True
        )

    def test_vendor_chat_initiation_and_messaging(self):
        """Test that a customer can start a chat with a vendor and exchange messages"""
        self.client.force_authenticate(user=self.customer)
        
        # 1. Initiate Room
        url_init = reverse('chat:vendor-chatroom-initiate')
        response = self.client.post(url_init, {'vendor_id': self.vendor.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        room_id = response.data['id']
        
        # 2. Send Message
        url_msg = reverse('chat:message-list', kwargs={'room_id': room_id})
        self.client.post(url_msg, {'content': 'How much is the Ghee?'})
        
        # 3. Vendor checks room
        self.client.force_authenticate(user=self.vendor_user)
        url_room_detail = reverse('chat:chatroom-detail', kwargs={'pk': room_id})
        response = self.client.get(url_room_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Vendor replies
        self.client.post(url_msg, {'content': 'Cost is 500 NPR.'})
        
        # Verify 2 messages exist
        self.assertEqual(Message.objects.filter(chat_room_id=room_id).count(), 2)

    def test_unauthorized_room_access(self):
        """Security check: Ensure a hacker cannot see someone else's chat room"""
        # Create a room for the legitimate customer
        room = ChatRoom.objects.create(customer=self.customer, vendor=self.vendor)
        
        # Hacker tries to access
        self.client.force_authenticate(user=self.hacker)
        url = reverse('chat:chatroom-detail', kwargs={'pk': room.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # DetailView uses queryset as filter

    def test_room_listing_isolation(self):
        """Verify that room list only returns relevant rooms for the user"""
        room_vendor = ChatRoom.objects.create(customer=self.customer, vendor=self.vendor)
        ChatRoom.objects.create(customer=self.hacker, vendor=self.vendor) # Someone else's room
        
        self.client.force_authenticate(user=self.customer)
        url = reverse('chat:chatroom-list')
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], room_vendor.id)
