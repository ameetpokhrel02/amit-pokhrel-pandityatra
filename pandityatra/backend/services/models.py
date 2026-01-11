from django.db import models

class Puja(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    # Base duration and price (recommended / default)
    base_duration_minutes = models.IntegerField(default=60)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    is_available = models.BooleanField(default=True)
    
    # Optional image for the service
    image = models.ImageField(upload_to='puja_images/', blank=True, null=True)

    def __str__(self):
        return self.name
