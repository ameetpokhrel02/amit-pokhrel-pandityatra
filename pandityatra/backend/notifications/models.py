from django.db import models
from django.conf import settings
import pytz
from datetime import datetime


class Notification(models.Model):
    """
    Real-time notifications for users
    """
    NOTIFICATION_TYPES = [
        ('BOOKING_CREATED', 'Booking Created'),
        ('BOOKING_ACCEPTED', 'Booking Accepted'),
        ('BOOKING_COMPLETED', 'Booking Completed'),
        ('BOOKING_CANCELLED', 'Booking Cancelled'),
        ('PAYMENT_SUCCESS', 'Payment Successful'),
        ('PAYMENT_FAILED', 'Payment Failed'),
        ('NEW_MESSAGE', 'New Message'),
        ('REVIEW_RECEIVED', 'Review Received'),
        ('PANDIT_VERIFIED', 'Pandit Verified'),
        ('PANDIT_REJECTED', 'Pandit Rejected'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    title_ne = models.CharField(max_length=200, blank=True, null=True, verbose_name='Title (Nepali)')
    message = models.TextField()
    message_ne = models.TextField(blank=True, null=True, verbose_name='Message (Nepali)')
    
    # Related objects
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )
    
    # Metadata
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Timezone support for Nepal
    user_timezone = models.CharField(max_length=50, default='Asia/Kathmandu')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.notification_type}"
    
    def get_local_time(self):
        """Convert to Nepal time"""
        nepal_tz = pytz.timezone(self.user_timezone)
        return self.created_at.astimezone(nepal_tz)
