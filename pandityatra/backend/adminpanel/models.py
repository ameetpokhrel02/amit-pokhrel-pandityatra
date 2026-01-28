
from django.db import models
from django.conf import settings

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
