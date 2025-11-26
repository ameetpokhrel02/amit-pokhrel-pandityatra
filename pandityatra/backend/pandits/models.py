# In backend/pandits/models.py

from django.db import models

class Pandit(models.Model):
    full_name = models.CharField(max_length=100)
    expertise = models.CharField(max_length=100) # e.g., 'Vedic', 'Astrology', 'Vastu'
    language = models.CharField(max_length=50)   # e.g., 'Hindi', 'Marathi', 'Tamil'
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    bio = models.TextField()
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name