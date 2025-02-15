from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User
from .models import EncryptedFile, FileShare, ShareableLink
import tempfile
import os
from datetime import datetime, timedelta

class FileShareTests(APITestCase):
    def setUp(self):
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='TestPass123!'
        )
        
        # Authentication
        self.client.force_authenticate(user=self.user)
        
        # Create test file
        self.test_file = tempfile.NamedTemporaryFile(suffix='.txt')
        self.test_file.write(b'Test content')
        self.test_file.seek(0)

    def test_file_upload(self):
        """Test file upload with encryption"""
        url = reverse('file-upload')
        file = SimpleUploadedFile(
            "test.txt",
            b"Test content",
            content_type="text/plain"
        )
        
        response = self.client.post(url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(EncryptedFile.objects.filter(owner=self.user).exists())

    def test_file_sharing(self):
        """Test sharing file with another user"""
        # First upload a file
        file = EncryptedFile.objects.create(
            owner=self.user,
            file_name='test.txt',
            encrypted_file=b'encrypted_content',
            encryption_key=b'key',
            file_type='text/plain',
            file_size=100
        )
        
        url = reverse('file-share', kwargs={'pk': file.id})
        share_data = {
            'shared_with': self.other_user.id,
            'permission': 'VIEW'
        }
        
        response = self.client.post(url, share_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(FileShare.objects.filter(
            file=file,
            shared_with=self.other_user
        ).exists())

    def test_shareable_link(self):
        """Test generating and using shareable link"""
        # Create a file
        file = EncryptedFile.objects.create(
            owner=self.user,
            file_name='test.txt',
            encrypted_file=b'encrypted_content',
            encryption_key=b'key',
            file_type='text/plain',
            file_size=100
        )
        
        url = reverse('generate-link', kwargs={'pk': file.id})
        link_data = {
            'expires_at': (datetime.now() + timedelta(days=1)).isoformat(),
            'max_access': 5
        }
        
        response = self.client.post(url, link_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ShareableLink.objects.filter(file=file).exists())

    def test_file_access_permissions(self):
        """Test file access with different user roles"""
        file = EncryptedFile.objects.create(
            owner=self.user,
            file_name='test.txt',
            encrypted_file=b'encrypted_content',
            encryption_key=b'key',
            file_type='text/plain',
            file_size=100
        )
        
        # Test access without permission
        self.client.force_authenticate(user=self.other_user)
        url = reverse('file-detail', kwargs={'pk': file.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def tearDown(self):
        # Clean up temporary files
        self.test_file.close() 