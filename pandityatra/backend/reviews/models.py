from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    """
    Customer reviews for pandits after completing a booking
    """
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='review'
    )
    pandit = models.ForeignKey(
        'pandits.Pandit',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    comment_ne = models.TextField(blank=True, null=True, verbose_name='Comment (Nepali)')  # Nepali translation
    
    # Additional rating categories
    professionalism = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5
    )
    knowledge = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5
    )
    punctuality = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)  # Admin verification
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['pandit', '-created_at']),
            models.Index(fields=['customer']),
        ]
    
    def __str__(self):
        return f"{self.customer.username} -> {self.pandit.user.username} ({self.rating}⭐)"
