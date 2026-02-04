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
    
    # 2. Phone Number field (Optional now)
    phone_number = models.CharField(
        max_length=15, 
        unique=True, 
        validators=[nepali_phone_validator],
        blank=True, 
        null=True 
    ) 
    
    # 3. Email field (Mandatory for Login/OTP)
    email = models.EmailField(unique=True, blank=False, null=False)
    
    profile_pic_url = models.URLField(blank=True, null=True)
    
    # 3. Roles
    ROLE_CHOICES = (
        ('user', 'User'),
        ('pandit', 'Pandit'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    # 4. Configuration: Ensure fields are included
    # Note: email is now mandatory, phone is optional
    REQUIRED_FIELDS = ['email', 'full_name'] 
    
    def __str__(self):
        return f"{self.username} ({self.role})"
class PlatformSetting(models.Model):
    """
    Singleton model to store global platform settings.
    We only ever want ONE row in this table.
    """
    commission_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=10.00,
        help_text="Percentage of booking amount taken as platform commission (e.g., 10.00 for 10%)"
    )
    video_call_rate_per_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=15.00,
        help_text="Default rate per minute for video calls (if not overridden by Pandit)"
    )

    def save(self, *args, **kwargs):
        # Override save to ensure only one instance exists
        if not self.pk and PlatformSetting.objects.exists():
            # If you try to create a new one, update the existing one instead
            return PlatformSetting.objects.first().save(*args, **kwargs)
        return super(PlatformSetting, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        # Helper to get the singleton object
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Platform Settings"

class ContactMessage(models.Model):
    """
    Stores contact form submissions from the frontend.
    """
    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)
    admin_note = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message from {self.name} - {self.subject}"
