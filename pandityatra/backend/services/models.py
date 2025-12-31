# In backend/services/models.py

from django.db import models
from pandits.models import Pandit # Import the Pandit model

class Puja(models.Model):
    # Foreign Key: Links the service to the Pandit who provides it.
    pandit = models.ForeignKey(
        Pandit, 
        on_delete=models.CASCADE, 
        related_name='pujas' 
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    duration_minutes = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name