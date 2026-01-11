from django.db import models
from django.conf import settings
from decimal import Decimal


class Payment(models.Model):
    """
    Payment records for bookings
    """
    PAYMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]
    
    PAYMENT_METHODS = [
        ('KHALTI', 'Khalti'),
        ('ESEWA', 'eSewa'),
        ('CONNECT_IPS', 'ConnectIPS'),
        ('IME_PAY', 'IME Pay'),
        ('STRIPE', 'Stripe (International)'),
        ('CASH', 'Cash on Service'),
    ]
    
    # Relationships
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payment',
        null=True,
        blank=True  # Allow null for standalone shopping
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    # Payment Details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    amount_npr = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    amount_usd = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Primary amount charged
    currency = models.CharField(max_length=3, default='NPR')  # NPR or USD
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)  # Exchange rate at time of payment
    
    # Transaction Details
    transaction_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    gateway_response = models.JSONField(blank=True, null=True)  # Store full response from payment gateway
    
    # Status
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Refund Info
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    refund_reason = models.TextField(blank=True, null=True)
    refunded_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Payment {self.transaction_id} - {self.amount} {self.currency}"


class PaymentWebhook(models.Model):
    """
    Log all webhook calls from payment gateways
    """
    payment_method = models.CharField(max_length=20)
    payload = models.JSONField()
    headers = models.JSONField(blank=True, null=True)
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

class PanditWithdrawal(models.Model):
    pandit = models.ForeignKey("pandits.Pandit", on_delete=models.CASCADE, related_name="withdrawals")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default="PENDING")  # PENDING, PAID, REJECTED
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Withdrawal {self.id} - {self.pandit.user.full_name}"
