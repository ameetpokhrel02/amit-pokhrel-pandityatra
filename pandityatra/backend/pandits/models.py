from django.db import models
from users.models import User 

class Pandit(models.Model):
    # Verification status choices
    VERIFICATION_STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    
    # Link to the User account (The most important field)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='pandit_profile')
    
    # Core fields
    expertise = models.CharField(max_length=255, help_text="Areas of expertise, e.g., 'Vedic', 'Astrology'")
    language = models.CharField(max_length=50)   # e.g., 'Hindi', 'Marathi', 'Tamil'
    experience_years = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    bio = models.TextField(default="")
    is_available = models.BooleanField(default=True)
    
    # Verification fields
    verification_status = models.CharField(
        max_length=10,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    certification_file = models.FileField(upload_to='pandit_certifications/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_date = models.DateTimeField(blank=True, null=True)
    verification_notes = models.TextField(blank=True, null=True)  # Admin notes
    
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['verification_status']),
            models.Index(fields=['is_verified']),
        ]

    def __str__(self):
        return f"{self.user.full_name} ({self.get_verification_status_display()})"