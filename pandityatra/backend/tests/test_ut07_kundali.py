from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from users.models import User

class KundaliGenerationTests(TestCase):
    """
    UT07 – Offline Kundali Generation
    Generate birth chart and AI predictions.
    """
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='kundali_user', password='123', email='ku@test.com', role='user'
        )
        self.client.force_authenticate(user=self.user)
        self.url = '/api/kundali/generate/'

    @patch('kundali.views.get_ai_prediction', return_value='Success is coming.')
    def test_ut07_generate_birth_chart_offline(self, mock_ai):
        """Generate birth chart offline (UT07)"""
        data = {
            'dob': '1995-05-15',
            'time': '10:30',
            'latitude': 27.7172,
            'longitude': 85.3240,
            'timezone': 'Asia/Kathmandu',
            'place': 'Kathmandu'
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('kundali_id', response.data)
        self.assertIn('planets', response.data)
        self.assertIn('ai_prediction', response.data)
