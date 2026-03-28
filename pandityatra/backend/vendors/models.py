from django.db import models
from django.conf import settings

class VendorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vendor_profile")
    shop_name = models.CharField(max_length=255)
    business_type = models.CharField(max_length=100, help_text="e.g., Samagri Store, Book Store")
    address = models.TextField()
    city = models.CharField(max_length=100)
    
    # Financials
    bank_account_number = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=100)
    account_holder_name = models.CharField(max_length=150)
    
    # Verification
    VERIFICATION_STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    id_proof = models.FileField(upload_to="vendor_ids/", blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(
        max_length=10,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    
    # Stats
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00, help_text="Percentage taken by platform")
    
    bio = models.TextField(blank=True, null=True)
    
    # Shop Settings
    is_accepting_orders = models.BooleanField(default=True)
    auto_approve_orders = models.BooleanField(default=False)
    notification_email = models.EmailField(blank=True, null=True)
    is_low_stock_alert_enabled = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.shop_name} ({self.user.email})"

class VendorPayout(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name="payouts")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=(
        ("PENDING", "Pending"),
        ("PAID", "Paid"),
        ("REJECTED", "Rejected"),
    ), default="PENDING")
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Payout {self.amount} to {self.vendor.shop_name} ({self.status})"
