from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class User(AbstractUser):
    # Validator for Nepali Phone Numbers
    nepali_phone_validator = RegexValidator(
        regex=r'^(?:\+977)?9[78]\d{8}$',
        message="Enter a valid Nepali mobile number (e.g., 98XXXXXXXX)."
    )

    # 1. CRITICAL FIX: Re-adding the full_name field
    full_name = models.CharField(max_length=150, blank=True, null=True)
    
    # 2. Phone Number field
    phone_number = models.CharField(
        max_length=15, 
        unique=True, 
        validators=[nepali_phone_validator],
        blank=True, 
        null=True 
    ) 
    profile_pic_url = models.URLField(blank=True, null=True)
    
    # 3. Roles
    ROLE_CHOICES = (
        ('user', 'User'),
        ('pandit', 'Pandit'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    # 4. Configuration: Ensure fields are included
    # Note: email is optional, so we only require phone_number and full_name
    REQUIRED_FIELDS = ['phone_number', 'full_name'] 
    
    def __str__(self):
        return f"{self.username} ({self.role})"