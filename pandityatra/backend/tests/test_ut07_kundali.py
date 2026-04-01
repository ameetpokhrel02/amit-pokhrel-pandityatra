from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from users.models import User

class KundaliGenerationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='kundali_user', password='123', email='ku@example.com', role='user'
        )
        self.client.force_authenticate(user=self.user)
        self.generate_url = '/api/kundali/generate/'

    @patch('kundali.views.get_ai_prediction', return_value='You have a bright future.')
    def test_ut07_generate_birth_chart_offline(self, mock_ai):
        """Generate birth chart offline (UT07)"""
        data = {
            'dob': '2000-01-01',
            'time': '12:00',
            'latitude': 27.7172,
            'longitude': 85.3240,
            'timezone': 'Asia/Kathmandu',
            'place': 'Kathmandu'
        }
        response = self.client.post(self.generate_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Response: {response.data}")
        self.assertIn('kundali_id', response.data)
        self.assertIn('planets', response.data)
        self.assertIn('houses', response.data)
