from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User
import pyotp

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.enable_mfa_url = reverse('enable-mfa')
        self.verify_mfa_url = reverse('verify-mfa')
        
        # Create test user data
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'role': 'USER'
        }

    def test_user_registration(self):
        """Test user registration with valid data"""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())
        self.assertIn('tokens', response.data)

    def test_user_registration_invalid_password(self):
        """Test user registration with invalid password"""
        self.user_data['password'] = 'weak'
        self.user_data['password2'] = 'weak'
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        """Test user login without MFA"""
        # Create user first
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        
        login_data = {
            'username': 'testuser',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

    def test_mfa_flow(self):
        """Test complete MFA flow"""
        # 1. Create and login user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=user)

        # 2. Enable MFA
        response = self.client.post(self.enable_mfa_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('secret', response.data)
        self.assertIn('qr_uri', response.data)

        # 3. Verify MFA code
        user.refresh_from_db()
        totp = pyotp.TOTP(user.mfa_secret)
        valid_code = totp.now()
        
        response = self.client.post(self.verify_mfa_url, {
            'user_id': user.id,
            'code': valid_code
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

    def test_invalid_mfa_code(self):
        """Test MFA verification with invalid code"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!',
            mfa_enabled=True,
            mfa_secret=pyotp.random_base32()
        )

        response = self.client.post(self.verify_mfa_url, {
            'user_id': user.id,
            'code': '000000'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 