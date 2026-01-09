from django.test import TestCase

# Create your tests here.
from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL

class Video(models.Model):
    booking =models.OneToOneField(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="video_room"
    )

    provider =models.CharField(
        max_length=20,
        default="daily"
    )

    room_name =models.CharField(max_length=255, unique=True)
    room_url =models.URLField()

    status =models.CharField(
    max_length=20,
    choices=[
        ("scheduled", "Scheduled"),
        ("live", "Live"),
        ("ended", "Ended"),
    ],
    default="scheduled"
    )
    created_at =models.DateTimeField(auto_now_add=True)
    updated_at =models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.room_name    