from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        USER = 'USER', 'Regular User'
        GUEST = 'GUEST', 'Guest'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER
    )
    
    # MFA fields
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True, null=True)
    
    def is_admin(self):
        return self.role == self.Role.ADMIN

    def is_regular_user(self):
        return self.role == self.Role.USER

    def is_guest(self):
        return self.role == self.Role.GUEST 