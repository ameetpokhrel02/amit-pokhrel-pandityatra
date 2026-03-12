from django.db import models
from django.conf import settings
from pandits.models import Pandit

class PaymentErrorLog(models.Model):
	"""
	Log all payment and booking errors for admin review
	"""
	ERROR_TYPE_CHOICES = [
		("PAYMENT", "Payment Error"),
		("WEBHOOK", "Webhook Error"),
		("BOOKING", "Booking Error"),
		("REFUND", "Refund Error"),
	]

	error_type = models.CharField(max_length=20, choices=ERROR_TYPE_CHOICES)
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
	booking_id = models.IntegerField(null=True, blank=True)
	payment_id = models.IntegerField(null=True, blank=True)
	message = models.TextField()
	context = models.JSONField(blank=True, null=True)
	resolved = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	resolved_at = models.DateTimeField(null=True, blank=True)
	admin_note = models.TextField(blank=True, null=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.error_type} - {self.message[:60]}"

class ActivityLog(models.Model):
    """
    Log of system activities, mainly for Admin review.
    Tracks actions by Users and Pandits like Login, Profile View, Booking, etc.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    pandit = models.ForeignKey(Pandit, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    action_type = models.CharField(max_length=50) # LOGIN, VIEW_PROFILE, ADD_TO_CART, BOOKING, PAYMENT, VIDEO_CALL, REVIEW
    details = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        actor = self.user.full_name if self.user else "System"
        return f"{actor} - {self.action_type} at {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
