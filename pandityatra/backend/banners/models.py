from django.db import models
from django.conf import settings

class Banner(models.Model):
    BANNER_TYPE_CHOICES = [
        ("MAIN_BANNER", "Main Banner"),
        ("SALE_BANNER", "Sale Banner"),
        ("FESTIVAL_BANNER", "Festival Banner"),
        ("OFFER_BANNER", "Offer Banner"),
        ("DISCOUNT_BANNER", "Discount Banner"),
    ]
    
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
        ("SCHEDULED", "Scheduled"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image_url = models.URLField(max_length=500)  # Desktop Image
    mobile_image_url = models.URLField(max_length=500, blank=True, null=True) # Mobile Image
    link_url = models.URLField(max_length=500, blank=True, null=True)
    link_text = models.CharField(max_length=100, blank=True, null=True)
    
    banner_type = models.CharField(max_length=20, choices=BANNER_TYPE_CHOICES, default="MAIN_BANNER")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ACTIVE")
    priority_order = models.IntegerField(default=1)
    
    background_color = models.CharField(max_length=50, blank=True, null=True)
    text_color = models.CharField(max_length=50, blank=True, null=True)
    
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    view_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_banners"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="updated_banners"
    )

    class Meta:
        ordering = ["priority_order", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.banner_type})"
