from django.conf import settings
from django.db import models


class Kundali(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    dob = models.DateField()
    time = models.TimeField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    timezone = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    lagna = models.FloatField(null=True)
    midheaven = models.FloatField(null=True)


class KundaliPlanet(models.Model):
    kundali = models.ForeignKey(Kundali, on_delete=models.CASCADE, related_name="planets")
    planet = models.CharField(max_length=20)
    longitude = models.FloatField()
    rashi = models.CharField(max_length=20)
    nakshatra = models.CharField(max_length=20)
    house = models.IntegerField()


class KundaliHouse(models.Model):
    kundali = models.ForeignKey(Kundali, on_delete=models.CASCADE, related_name="houses")
    house_number = models.IntegerField()
    cusp_longitude = models.FloatField()

    def __str__(self):
        return f"House {self.house_number} – {self.cusp_longitude}"