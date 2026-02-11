from django.db import models
from django.utils.text import slugify

class PujaCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='category_images/', blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Lucide icon name")
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Puja Categories"
        ordering = ['order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Puja(models.Model):
    category = models.ForeignKey(PujaCategory, on_delete=models.SET_NULL, related_name='pujas', null=True, blank=True)
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
