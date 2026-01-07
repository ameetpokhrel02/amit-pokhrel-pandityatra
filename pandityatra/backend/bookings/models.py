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
        max_length=20,
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
    payment_status = models.BooleanField(default=False) # True if payment is confirmed
    payment_method = models.CharField(max_length=50, blank=True, null=True) # Khalti, Stripe, etc.
    video_room_url = models.URLField(max_length=500, blank=True, null=True, help_text="Video call link for online puja")
    
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
        return f"Booking {self.id} for {self.pandit.full_name} by {self.user.full_name}"