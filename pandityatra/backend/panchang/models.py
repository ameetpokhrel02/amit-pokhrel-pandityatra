from django.db import models

class PanchangData(models.Model):
    date = models.DateField(unique=True)  # Gregorian date
    bs_date = models.CharField(max_length=50)  # e.g., २०८२ वैशाख १५
    bs_year = models.IntegerField()
    bs_month = models.IntegerField()
    bs_day = models.IntegerField()
    
    tithi = models.CharField(max_length=100)
    nakshatra = models.CharField(max_length=100, blank=True, null=True)
    yoga = models.CharField(max_length=100, blank=True, null=True)
    karana = models.CharField(max_length=100, blank=True, null=True)
    
    sunrise = models.TimeField(null=True, blank=True)
    sunset = models.TimeField(null=True, blank=True)
    
    festivals = models.JSONField(default=list, blank=True)
    muhurat_hints = models.TextField(blank=True)
    
    is_holiday = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.bs_date} ({self.date})"

    class Meta:
        verbose_name = "Panchang Data"
        verbose_name_plural = "Panchang Data"
        ordering = ['-date']
