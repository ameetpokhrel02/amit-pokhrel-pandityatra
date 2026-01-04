from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class SamagriRecommendation(models.Model):
    """
    AI-based recommendations for samagri items for specific pujas.
    Tracks confidence scores, essentiality, and purchase patterns.
    """
    CATEGORY_CHOICES = [
        ('ESSENTIAL', 'Essential - Must Have'),
        ('TRADITIONAL', 'Traditional - Recommended'),
        ('OPTIONAL', 'Optional - Nice to Have'),
        ('LUXURY', 'Luxury - Premium Add-on'),
    ]
    
    puja = models.ForeignKey(
        'services.Puja',
        on_delete=models.CASCADE,
        related_name='samagri_recommendations'
    )
    samagri_item = models.ForeignKey(
        'samagri.SamagriItem',
        on_delete=models.CASCADE,
        related_name='puja_recommendations'
    )
    
    # AI/ML Scoring
    confidence_score = models.FloatField(
        default=0.5,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Confidence score 0.0-1.0 based on historical data"
    )
    
    # Flags
    is_essential = models.BooleanField(
        default=False,
        help_text="Cannot be removed from booking"
    )
    is_optional = models.BooleanField(
        default=False,
        help_text="User can choose to include or exclude"
    )
    priority = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="1=highest priority, 10=lowest"
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='TRADITIONAL'
    )
    
    # Quantities
    quantity_min = models.IntegerField(default=1)
    quantity_max = models.IntegerField(default=10)
    quantity_default = models.IntegerField(default=1)
    unit = models.CharField(max_length=50, default='pcs')
    
    # Explanation & Business Logic
    reason = models.TextField(
        help_text="Why this item is recommended",
        blank=True
    )
    description = models.TextField(blank=True)
    
    # Tracking & Analytics
    times_recommended = models.IntegerField(default=0)
    times_purchased = models.IntegerField(default=0)
    purchase_rate = models.FloatField(
        default=0.0,
        help_text="times_purchased / times_recommended"
    )
    average_rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)]
    )
    
    # Active/Inactive
    is_active = models.BooleanField(default=True)
    
    # Seasonal (for festivals)
    is_seasonal = models.BooleanField(default=False)
    seasonal_months = models.CharField(
        max_length=100,
        blank=True,
        help_text="Comma-separated months (1-12) when recommended"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('puja', 'samagri_item')
        ordering = ['-is_essential', '-confidence_score', 'priority']
        indexes = [
            models.Index(fields=['puja', 'is_active']),
            models.Index(fields=['confidence_score']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.puja.name} → {self.samagri_item.name} ({self.confidence_score}%)"
    
    def calculate_purchase_rate(self):
        """Calculate purchase rate from tracked metrics"""
        if self.times_recommended > 0:
            self.purchase_rate = self.times_purchased / self.times_recommended
            self.save()
        return self.purchase_rate
    
    def increment_recommendation(self):
        """Called when this recommendation is shown to user"""
        self.times_recommended += 1
        self.save()
    
    def increment_purchase(self):
        """Called when user actually buys this item"""
        self.times_purchased += 1
        self.calculate_purchase_rate()


class PujaTemplate(models.Model):
    """
    Pre-configured samagri lists for common pujas.
    Allows admins to bundle items for specific puja types.
    """
    name = models.CharField(max_length=200)
    puja_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Recommended for multiple pujas
    recommended_for_pujas = models.ManyToManyField(
        'services.Puja',
        blank=True,
        related_name='templates'
    )
    
    # Estimated cost
    estimated_cost = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00')
    )
    estimated_cost_with_discount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['puja_type', 'is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_total_items(self):
        """Get count of items in this template"""
        return self.samagri_items.count()


class PujaTemplateItem(models.Model):
    """
    Items in a puja template.
    Links templates to samagri items with quantities.
    """
    template = models.ForeignKey(
        PujaTemplate,
        on_delete=models.CASCADE,
        related_name='samagri_items'
    )
    samagri_item = models.ForeignKey(
        'samagri.SamagriItem',
        on_delete=models.CASCADE,
        related_name='template_inclusions'
    )
    
    quantity = models.IntegerField(default=1)
    unit = models.CharField(max_length=50, default='pcs')
    is_required = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('template', 'samagri_item')
    
    def __str__(self):
        return f"{self.template.name} - {self.samagri_item.name}"


class UserSamagriPreference(models.Model):
    """
    Track user preferences and buying patterns for personalized recommendations.
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='samagri_preferences'
    )
    samagri_item = models.ForeignKey(
        'samagri.SamagriItem',
        on_delete=models.CASCADE,
        related_name='user_preferences'
    )
    
    # Tracking
    times_purchased = models.IntegerField(default=0)
    last_purchased = models.DateTimeField(null=True, blank=True)
    average_quantity = models.FloatField(default=1.0)
    total_spent = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # User Preferences
    is_favorite = models.BooleanField(default=False)
    never_recommend = models.BooleanField(
        default=False,
        help_text="User doesn't want this item recommended"
    )
    prefer_bulk = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'samagri_item')
        ordering = ['-times_purchased', '-last_purchased']
        indexes = [
            models.Index(fields=['user', 'is_favorite']),
            models.Index(fields=['user', 'times_purchased']),
        ]
    
    def __str__(self):
        return f"{self.user.username} → {self.samagri_item.name}"


class RecommendationLog(models.Model):
    """
    Log every recommendation shown to users for analytics.
    Helps track recommendation accuracy and improve algorithms.
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='recommendation_logs'
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='recommendation_logs'
    )
    
    recommendations = models.ManyToManyField(
        SamagriRecommendation,
        related_name='shown_in_logs'
    )
    
    # Tracking
    shown_count = models.IntegerField(default=0)
    clicked_count = models.IntegerField(default=0)
    purchased_count = models.IntegerField(default=0)
    
    # Feedback
    user_feedback = models.CharField(
        max_length=20,
        choices=[
            ('HELPFUL', 'Helpful'),
            ('NOT_HELPFUL', 'Not Helpful'),
            ('NO_FEEDBACK', 'No Feedback'),
        ],
        default='NO_FEEDBACK'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['booking']),
        ]
    
    def __str__(self):
        return f"Recommendations for Booking #{self.booking.id}"
    
    def get_conversion_rate(self):
        """Calculate conversion rate of recommendations"""
        if self.shown_count > 0:
            return (self.purchased_count / self.shown_count) * 100
        return 0.0
