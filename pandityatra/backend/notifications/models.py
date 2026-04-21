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
        ('REMINDER', 'Reminder'),
        ('PUJA_ROOM_READY', 'Puja Room Ready'),
        ('VIDEO_CALL_INCOMING', 'Incoming Video Call'),
        ('VIDEO_CALL_MISSED', 'Video Call Missed'),
        ('RECORDING_READY_REVIEW', 'Recording Ready (Review Prompt)'),
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


class PushNotificationToken(models.Model):
    """
    Stores push tokens/subscriptions for web/mobile devices.

    For web push, `subscription` stores endpoint/keys payload.
    For mobile push (FCM/APNS), `token` can store device token.
    """

    DEVICE_TYPES = [
        ('web', 'Web'),
        ('android', 'Android'),
        ('ios', 'iOS'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_tokens'
    )
    token = models.CharField(max_length=500)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES, default='web')
    endpoint = models.URLField(max_length=500, blank=True, null=True)
    subscription = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'device_type']),
            models.Index(fields=['token']),
            models.Index(fields=['is_active']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['user', 'token'], name='unique_user_push_token')
        ]

    def __str__(self):
        return f"PushToken<{self.user_id}:{self.device_type}>"


class EmailTemplate(models.Model):
    """
    Reusable email templates with placeholders
    """
    TEMPLATE_TYPES = [
        ('BOOKING_CONFIRMATION', 'Booking Confirmation'),
        ('ORDER_PLACED', 'Shop Order Placed'),
        ('PUJA_REMINDER', 'Puja Reminder'),
        ('RESCHEDULE_NOTIFICATION', 'Reschedule Notification'),
        ('BULK_OFFER', 'Bulk Offer/Marketing'),
        ('CUSTOM', 'Custom/Direct Message'),
    ]

    name = models.CharField(max_length=100, unique=True)
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPES)
    subject = models.CharField(max_length=255)
    html_content = models.TextField()
    plain_content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_template_type_display()} - {self.name}"


class EmailNotification(models.Model):
    """
    Log of sent emails for audit and tracking
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    
    SENDER_ROLES = [
        ('ADMIN', 'Admin'),
        ('VENDOR', 'Vendor'),
        ('PANDIT', 'Pandit'),
        ('SYSTEM', 'System'),
    ]

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_emails'
    )
    sender_role = models.CharField(max_length=10, choices=SENDER_ROLES, default='SYSTEM')
    recipient_email = models.EmailField()
    recipient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='received_emails'
    )
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.CharField(max_length=255)
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    error_message = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient_email} - {self.subject} ({self.status})"
