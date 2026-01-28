from django.db import models
from users.models import User 

class Pandit(models.Model):
    VERIFICATION_STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='pandit_profile')
    expertise = models.CharField(max_length=255)
    language = models.CharField(max_length=50)
    experience_years = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    bio = models.TextField(default="")
    is_available = models.BooleanField(default=True)

    verification_status = models.CharField(
        max_length=10,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    certification_file = models.FileField(upload_to='pandit_certifications/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_date = models.DateTimeField(blank=True, null=True)
    verification_notes = models.TextField(blank=True, null=True)
    
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.full_name} ({self.verification_status})"

class PanditWallet(models.Model):
    pandit = models.OneToOneField(Pandit, on_delete=models.CASCADE, related_name="wallet")
    total_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    available_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_withdrawn = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.pandit.user.full_name} Wallet"


# ---------------------------
# PANDIT SERVICES (Dynamic Pricing)
# ---------------------------
from services.models import Puja  # Make sure to import Puja if in another app, or use string reference

class PanditService(models.Model):
    """
    Pivot table allowing a Pandit to offer a specific Puja
    with their own Custom Price and Duration.
    """
    pandit = models.ForeignKey(Pandit, on_delete=models.CASCADE, related_name="services")
    puja = models.ForeignKey("services.Puja", on_delete=models.CASCADE, related_name="pandit_offerings")
    
    custom_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Pandit's price overrides base price")
    duration_minutes = models.IntegerField(help_text="Estimated time in minutes")
    is_active = models.BooleanField(default=True)
    
    # Options for service type
    is_online = models.BooleanField(default=False)
    is_offline = models.BooleanField(default=True)

    class Meta:
        unique_together = ('pandit', 'puja')  # A pandit can have only one entry per puja type

    def __str__(self):
        return f"{self.pandit.user.full_name} - {self.puja.name} (Rs. {self.custom_price})"

class PanditAvailability(models.Model):
    """
    Blocks of time where the Pandit is explicitly unavailable or available.
    For MVP, we assume primarily 'busy' blocks.
    """
    pandit = models.ForeignKey(Pandit, on_delete=models.CASCADE, related_name="availability_blocks")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    title = models.CharField(max_length=100, default="Unavailable", help_text="Reason for unavailability")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pandit.user.full_name} : {self.start_time} - {self.end_time}"
