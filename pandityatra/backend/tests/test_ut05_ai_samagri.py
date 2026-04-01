from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from users.models import User
from services.models import Puja

class AISamagriTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='ai_user', password='123', email='ai@example.com', role='user'
        )
        self.puja = Puja.objects.create(name='Diwali Puja', base_price=500.00)
        self.client.force_authenticate(user=self.user)
        self.ai_samagri_url = '/api/ai/puja-samagri/'

    @patch('ai.views.ToolRouter.execute')
    def test_ut05_generate_samagri_list(self, mock_tool_execute):
        """Generate samagri list using AI (UT05)"""
        # Mocking the ToolRouter executor response
        mock_result = MagicMock()
        mock_result.ok = True
        mock_result.message = "Here is the samagri list"
        mock_result.type = "RECOMMENDATION"
        mock_result.data = {
            "products": [{"id": 1, "name": "Roli", "price": 10}],
            "context": {"puja_name": "Diwali Puja"}
        }
        mock_tool_execute.return_value = mock_result

        data = {
            'puja_id': self.puja.id,
            'location': 'Home'
        }
        response = self.client.post(self.ai_samagri_url, data, format='json')
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
