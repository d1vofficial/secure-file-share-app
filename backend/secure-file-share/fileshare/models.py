from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class EncryptedFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_files')
    file_name = models.CharField(max_length=255)
    encrypted_file = models.BinaryField()
    encryption_key = models.BinaryField()  # Encrypted with user's public key
    file_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size = models.BigIntegerField()

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} (owned by {self.owner.username})"

class FileShare(models.Model):
    PERMISSION_CHOICES = [
        ('VIEW', 'View Only'),
        ('DOWNLOAD', 'View and Download'),
        ('EDIT', 'Edit and Download')
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(EncryptedFile, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES, default='VIEW')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    one_time_use = models.BooleanField(default=False)
    access_count = models.IntegerField(default=0)
    share_link = models.UUIDField(default=uuid.uuid4, unique=True)
    is_link_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('file', 'shared_with')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file.file_name} shared with {self.shared_with.username}"

    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    def save(self, *args, **kwargs):
        # If share already exists, update it instead
        try:
            existing_share = FileShare.objects.get(file=self.file, shared_with=self.shared_with)
            existing_share.permission = self.permission
            existing_share.expires_at = self.expires_at
            return existing_share.save()
        except FileShare.DoesNotExist:
            return super().save(*args, **kwargs)

class ShareableLink(models.Model):
    PERMISSION_CHOICES = [
        ('VIEW', 'View Only'),
        ('DOWNLOAD', 'Download')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(EncryptedFile, on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    one_time_use = models.BooleanField(default=False)
    permission = models.CharField(
        max_length=10,
        choices=PERMISSION_CHOICES,
        default='VIEW'
    )
    access_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Link for {self.file.file_name}"

    def is_expired(self):
        return timezone.now() > self.expires_at 