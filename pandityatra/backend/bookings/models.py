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
    
    # Service Details
    service_name = models.CharField(max_length=100)
    service_location = models.CharField(max_length=255) # E.g., Online, Customer's Home, Temple
    
    # Timing and Status
    booking_date = models.DateField()
    booking_time = models.TimeField()
    status = models.CharField(
        max_length=10,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING
    )
    
    # Financial Details
    fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    payment_status = models.BooleanField(default=False) # True if payment is confirmed
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-booking_date', '-booking_time']
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        # Ensure a user cannot book the same pandit for the exact time slot
        unique_together = ('pandit', 'booking_date', 'booking_time')

    def __str__(self):
        return f"Booking {self.id} for {self.pandit.full_name} by {self.user.full_name}"