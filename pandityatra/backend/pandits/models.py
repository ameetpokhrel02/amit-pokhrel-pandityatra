from django.db import models
from users.models import User 

class Pandit(models.Model):
    # Link to the User account (The most important field)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='pandit_profile')
    
    # We rely on User model for full_name, so we can remove it here to avoid duplication.
    # expertise and language fields remain:
    expertise = models.CharField(max_length=255, help_text="Areas of expertise, e.g., 'Vedic', 'Astrology'")
    language = models.CharField(max_length=50)   # e.g., 'Hindi', 'Marathi', 'Tamil'
    
    # 🚨 FIX 1: ADDING THE MISSING FIELD
    experience_years = models.IntegerField(default=0)
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    bio = models.TextField(default="")
    is_available = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False) # Adding a common verification field
    date_joined = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Use the linked user's name for clarity
        return self.user.full_name