from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from users.models import User
from services.models import Puja

class AISamagriTests(TestCase):
    """
    UT05 – AI Samagri System
    Validate automated samagri list generation.
    """
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='ai_user', password='123', email='ai@example.com', role='user'
        )
        self.puja = Puja.objects.create(name='Griha Pravesh', base_price=1000)
        self.client.force_authenticate(user=self.user)
        self.ai_url = '/api/ai/puja-samagri/'

    @patch('ai.views.ToolRouter.execute')
    def test_ut05_generate_samagri_list(self, mock_tool_execute):
        """Generate samagri list successfully (UT05)"""
        # Mocking the AI orchestrator/tool result
        mock_result = MagicMock()
        mock_result.ok = True
        mock_result.message = "Calculated items"
        mock_result.type = "RECOMMENDATION"
        mock_result.data = {
            "products": [{"id": 1, "name": "Deepak", "price": 50}],
            "context": {"puja_name": "Griha Pravesh"}
        }
        mock_tool_execute.return_value = mock_result

        data = {
            'puja_id': self.puja.id,
            'location': 'Remote'
        }
        response = self.client.post(self.ai_url, data, format='json')
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertIn('products', response.data)
        self.assertEqual(response.data['products'][0]['name'], 'Deepak')
