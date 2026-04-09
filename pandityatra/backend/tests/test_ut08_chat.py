import datetime
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from users.models import User
from pandits.models import PanditUser
from bookings.models import Booking
from services.models import Puja
from chat.models import ChatRoom, Message

class RealTimeChatTests(TestCase):
    """
    UT08 – Real-Time Chat System
    Verify message sending and receiving in real-time.
    """
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='chat_customer', password='123', email='cc@test.com', role='user'
        )
        self.pandit = PanditUser.objects.create_user(
            username='chat_pandit', password='123', email='cp@test.com', role='pandit'
        )
        # Create a pre-booking chat room
        self.room = ChatRoom.objects.create(
            customer=self.customer,
            pandit=self.pandit,
            is_pre_booking=True
        )
        self.client.force_authenticate(user=self.customer)
        self.message_url = f'/api/chat/rooms/{self.room.id}/messages/'

    @patch('chat.views.notify_new_message')
    def test_ut08_send_message_successfully(self, mock_notify):
        """Send message successfully (UT08)"""
        data = {'content': 'Hello Pandit Ji', 'message_type': 'TEXT'}
        response = self.client.post(self.message_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.filter(chat_room=self.room).count(), 1)
        self.assertEqual(Message.objects.first().content, 'Hello Pandit Ji')
        # Check if notification was triggered
        self.assertTrue(mock_notify.called)

    def test_ut08_receive_messages_as_pandit(self):
        """Pandit can receive/list messages"""
        Message.objects.create(
            chat_room=self.room,
            sender=self.customer,
            content='Hi',
            message_type='TEXT'
        )
        
        self.client.force_authenticate(user=self.pandit)
        response = self.client.get(self.message_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['content'], 'Hi')
