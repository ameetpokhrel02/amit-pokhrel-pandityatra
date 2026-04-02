from django.db import models
from users.models import User 

class PanditUser(User):
    """
    Inherited User model for Pandits.
    Provides professional fields while sharing the same identity as User.
    """
    expertise = models.CharField(max_length=255)
    language = models.CharField(max_length=50)
    experience_years = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    bio = models.TextField(default="")
    is_available = models.BooleanField(default=True)
 
    @property
    def user(self):
        """Backward compatibility for when PanditUser had a OneToOne 'user' field."""
        return self
 
    @property
    def user_id(self):
        """Backward compatibility for code expecting a user_id on a profile model."""
        return self.id

    VERIFICATION_STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    verification_status = models.CharField(
        max_length=10,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    certification_file = models.FileField(upload_to='pandit_certifications/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_date = models.DateTimeField(blank=True, null=True)
    verification_notes = models.TextField(blank=True, null=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pandit Account"
        verbose_name_plural = "Pandit Accounts"

    def __str__(self):
        return f"{self.full_name} ({self.verification_status})"

# Legacy Model Removed

class PanditWallet(models.Model):
    pandit = models.OneToOneField(PanditUser, on_delete=models.CASCADE, related_name="wallet")
    total_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    available_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_withdrawn = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.pandit.full_name} Wallet"

class PanditService(models.Model):
    pandit = models.ForeignKey(PanditUser, on_delete=models.CASCADE, related_name="services")
    puja = models.ForeignKey("services.Puja", on_delete=models.CASCADE, related_name="pandit_offerings")
    custom_price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_minutes = models.IntegerField()
    is_active = models.BooleanField(default=True)
    is_online = models.BooleanField(default=False)
    is_offline = models.BooleanField(default=True)

    class Meta:
        unique_together = ('pandit', 'puja')

class PanditAvailability(models.Model):
    pandit = models.ForeignKey(PanditUser, on_delete=models.CASCADE, related_name="availability_blocks")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    title = models.CharField(max_length=100, default="Unavailable")
    created_at = models.DateTimeField(auto_now_add=True)
