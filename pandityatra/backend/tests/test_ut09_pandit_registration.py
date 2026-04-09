from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from pandits.models import PanditUser

class PanditRegistrationTests(TestCase):
    """
    UT09 – Pandit Registration
    Register new pandit with expertise and verification.
    """
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.admin = User.objects.create_user(
            username='admin_p_reg', password='p', email='ad_p@test.com', role='admin', is_staff=True
        )

    def test_ut09_register_new_pandit_via_api(self):
        """Register new pandit successfully (UT09)"""
        data = {
            'username': 'reg_pandit',
            'email': 'reg_p@test.com',
            'full_name': 'Registered Pandit',
            'password': 'SecurePass123!',
            'role': 'pandit',
            'expertise': 'Astrology',
            'experience_years': 5
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PanditUser.objects.filter(email='reg_p@test.com').exists())
        pandit = PanditUser.objects.get(email='reg_p@test.com')
        self.assertEqual(pandit.expertise, 'Astrology')
        self.assertEqual(pandit.verification_status, 'PENDING')

    def test_ut09_admin_verify_pandit_logic(self):
        """Verify the admin verification endpoint"""
        pandit = PanditUser.objects.create_user(
            username='p_v_log', email='pv_log@test.com', password='p', role='pandit'
        )
        
        self.client.force_authenticate(user=self.admin)
        # 🚨 Use correct admin verification URL
        url = f'/api/pandits/admin/verify/{pandit.id}/'
        data = {'status': 'APPROVED', 'notes': 'Test approval'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pandit.refresh_from_db()
        self.assertTrue(pandit.is_verified)
        self.assertEqual(pandit.verification_status, 'APPROVED')
