from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from users.models import User
from pandits.models import Pandit


class RealTimeChatTests(TestCase):
    """
    UT08 – Real-Time Chat Module
    Tests the chat room creation, message listing,
    and initiating chat with a pandit.
    """

    def setUp(self):
        self.client = APIClient()

        # Customer user
        self.customer = User.objects.create_user(
            username='chat_customer', password='pass123',
            email='chat_customer@example.com', role='user'
        )

        # Pandit user + profile
        self.pandit_user = User.objects.create_user(
            username='chat_pandit', password='pass123',
            email='chat_pandit@example.com', role='pandit'
        )
        self.pandit = Pandit.objects.create(user=self.pandit_user, is_verified=True)

        self.client.force_authenticate(user=self.customer)

    def test_ut08_initiate_chat_room_with_pandit(self):
        """Initiate real-time chat room with pandit (UT08)"""
        url = '/api/chat/rooms/initiate/'
        data = {'pandit_id': self.pandit.id}
        response = self.client.post(url, data, format='json')

        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_201_CREATED],
            f"Response: {response.data}"
        )
        # Chat room should be returned with an id
        self.assertIn('id', response.data)

    def test_ut08_list_chat_rooms(self):
        """List all chat rooms for a user (UT08)"""
        url = '/api/chat/rooms/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_ut08_send_and_list_messages(self):
        """Send and retrieve messages in a chat room (UT08)"""
        # First initiate a room
        initiate_url = '/api/chat/rooms/initiate/'
        room_response = self.client.post(initiate_url, {'pandit_id': self.pandit.id}, format='json')
        self.assertIn(room_response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        room_id = room_response.data['id']

        # Now list messages (should be empty but return 200)
        messages_url = f'/api/chat/rooms/{room_id}/messages/'
        msg_response = self.client.get(messages_url)
        self.assertEqual(msg_response.status_code, status.HTTP_200_OK)


class AIChatTests(TestCase):
    """
    UT09 – AI Chat Module
    Tests the AI-powered quick chat / guide chat endpoint.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='ai_chat_user', password='pass123',
            email='ai_chat@example.com', role='user'
        )
        self.client.force_authenticate(user=self.user)
        self.ai_chat_url = '/api/ai/chat/'

    @patch('ai.views.AIOrchestrator.run')
    def test_ut09_ai_chat_response(self, mock_run):
        """Get AI chat response for a user message (UT09)"""
        mock_run.return_value = {
            'reply': 'You should perform Satyanarayan Puja for prosperity.',
            'type': 'TEXT',
            'actions': []
        }

        data = {'message': 'Which puja should I do for prosperity?'}
        response = self.client.post(self.ai_chat_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('reply', response.data)

    def test_ut09_ai_chat_empty_message_rejected(self):
        """AI chat should reject empty messages (UT09)"""
        data = {'message': ''}
        response = self.client.post(self.ai_chat_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
