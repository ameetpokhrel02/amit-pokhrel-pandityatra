from django.db import models
from django.conf import settings
from decimal import Decimal

class SamagriCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class SamagriItem(models.Model):
    category = models.ForeignKey(SamagriCategory, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_quantity = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=50, default="pcs")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class PujaSamagriRequirement(models.Model):
    puja = models.ForeignKey('services.Puja', on_delete=models.CASCADE, related_name='requirements')
    samagri_item = models.ForeignKey(SamagriItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit = models.CharField(max_length=50, default="pcs")

    def __str__(self):
        return f"{self.quantity} {self.unit} of {self.samagri_item.name}"

# --- Shop Order Models ---

class ShopOrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Payment'
    PAID = 'PAID', 'Processing/Paid'
    SHIPPED = 'SHIPPED', 'Shipped'
    DELIVERED = 'DELIVERED', 'Delivered'
    CANCELLED = 'CANCELLED', 'Cancelled'

class ShopOrder(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shop_orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=ShopOrderStatus.choices, default=ShopOrderStatus.PENDING)
    
    # Shipping Info
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    shipping_address = models.TextField()
    city = models.CharField(max_length=100)
    
    payment_method = models.CharField(max_length=50, blank=True, null=True) # STRIPE, KHALTI
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.email}"

class ShopOrderItem(models.Model):
    order = models.ForeignKey(ShopOrder, on_delete=models.CASCADE, related_name='items')
    samagri_item = models.ForeignKey(SamagriItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.samagri_item.name} for Order #{self.order.id}"
