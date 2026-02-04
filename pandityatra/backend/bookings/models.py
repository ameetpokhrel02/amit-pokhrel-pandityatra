from django.db import models
from django.conf import settings
from decimal import Decimal

# STATUS CHOICES for the Booking
class BookingStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Confirmation'
    ACCEPTED = 'ACCEPTED', 'Accepted by Pandit'
    COMPLETED = 'COMPLETED', 'Service Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    FAILED = 'FAILED', 'Payment Failed'


class LocationChoices(models.TextChoices):
    ONLINE = 'ONLINE', 'Online (Video Call)'
    HOME = 'HOME', 'Customer Home'
    TEMPLE = 'TEMPLE', 'Temple'
    PANDIT_LOCATION = 'PANDIT_LOCATION', "Pandit's Location"


class Booking(models.Model):
    """
    Represents a booking request made by a user for a specific Pandit and service.
    """
    # Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='customer_bookings',
        verbose_name='Customer'
    )
    pandit = models.ForeignKey(
        'pandits.Pandit', # Referencing the Pandit model in the pandits app
        on_delete=models.CASCADE, 
        related_name='pandit_appointments'
    )
    service = models.ForeignKey(
        'services.Puja',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )
    
    # Service Details
    service_name = models.CharField(max_length=100)
    service_location = models.CharField(
        max_length=50,
        choices=LocationChoices.choices,
        default=LocationChoices.ONLINE
    ) # E.g., Online, Customer's Home, Temple
    
    # Timing and Status
    booking_date = models.DateField()
    booking_time = models.TimeField()
    status = models.CharField(
        max_length=10,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING
    )
    
    # Additional Details
    notes = models.TextField(blank=True, null=True, help_text="Customer special requests or notes")
    samagri_required = models.BooleanField(default=True, help_text="Include samagri in booking")
    
    # Financial Details
    service_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    samagri_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    total_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    total_fee_usd = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'), null=True, blank=True)
    
    # Location and Timezone Tracking
    customer_timezone = models.CharField(max_length=50, default='UTC', help_text="Customer's local timezone")
    customer_location = models.CharField(max_length=100, blank=True, null=True, help_text="Lat/Long of customer")
    
    payment_status = models.BooleanField(default=False) # True if payment is confirmed
    payment_method = models.CharField(max_length=50, blank=True, null=True) # Khalti, Stripe, etc.
    transaction_id = models.CharField(max_length=100, blank=True, null=True, help_text="Payment Gateway Transaction ID")
    video_room_url = models.URLField(max_length=500, blank=True, null=True, help_text="Video call link for online puja")
    recording_url = models.URLField(max_length=500, blank=True, null=True, help_text="Recorded session URL (post-puja)")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-booking_date', '-booking_time']
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        # Ensure a user cannot book the same pandit for the exact time slot
        unique_together = ('pandit', 'booking_date', 'booking_time')

    def __str__(self):
        return f"Booking {self.id} for {self.pandit.user.full_name} by {self.user.full_name}"
    
    def calculate_total_fee(self):
        """Calculate total fee from service fee and samagri fee"""
        self.total_fee = self.service_fee + self.samagri_fee
        self.save()
        return self.total_fee
    
    def get_samagri_items(self):
        """Get all samagri items for this booking"""
        return self.samagri_items.all()


class BookingSamagriItem(models.Model):
    """
    Links samagri items to bookings with quantities and selections.
    Tracks AI recommendations and user choices.
    """
    STATUS_CHOICES = [
        ('RECOMMENDED', 'AI Recommended'),
        ('SELECTED', 'User Selected'),
        ('AUTO_ADDED', 'Auto Added'),
        ('REMOVED', 'User Removed'),
    ]
    
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='samagri_items'
    )
    samagri_item = models.ForeignKey(
        'samagri.SamagriItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='in_bookings'
    )
    
    # Recommendation & Selection Tracking
    recommendation = models.ForeignKey(
        'recommender.SamagriRecommendation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='booking_items'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='RECOMMENDED'
    )
    
    # Quantity & Pricing
    quantity = models.IntegerField(default=1)
    unit = models.CharField(max_length=50, default='pcs')
    unit_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00')
    )
    total_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Flags
    is_essential = models.BooleanField(
        default=False,
        help_text="Cannot be removed from booking"
    )
    is_optional = models.BooleanField(
        default=True,
        help_text="User can choose to include or exclude"
    )
    is_included = models.BooleanField(
        default=True,
        help_text="User chose to include this item"
    )
    
    # Reason/Notes
    reason = models.TextField(
        blank=True,
        help_text="Why this item is recommended"
    )
    user_notes = models.TextField(
        blank=True,
        help_text="User's notes about this item"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('booking', 'samagri_item')
        ordering = ['-is_essential', 'created_at']
        indexes = [
            models.Index(fields=['booking', 'is_included']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.booking.id} - {self.samagri_item.name} ({self.quantity})"
    
    def calculate_total_price(self):
        """Calculate total price from unit price and quantity"""
        self.total_price = self.unit_price * self.quantity
        self.save()
        return self.total_price
    
    def save(self, *args, **kwargs):
        """Auto-calculate total price on save"""
        if self.unit_price and self.quantity:
            self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)