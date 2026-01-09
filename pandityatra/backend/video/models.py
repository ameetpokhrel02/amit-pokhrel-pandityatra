from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class VideoRoom(models.Model):
    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="video_room"
    )

    provider = models.CharField(max_length=20, default="daily")
    room_name = models.CharField(max_length=255, unique=True)
    room_url = models.URLField()

    status = models.CharField(
        max_length=20,
        choices=[
            ("scheduled", "Scheduled"),
            ("live", "Live"),
            ("ended", "Ended"),
        ],
        default="scheduled"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)


class VideoParticipant(models.Model):
    room = models.ForeignKey(
        VideoRoom,
        on_delete=models.CASCADE,
        related_name="participants"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="video_participations"
    )

    role = models.CharField(
        max_length=20,
        choices=[
            ("pandit", "Pandit"),
            ("customer", "Customer"),
        ]
    )

    is_host = models.BooleanField(default=False)

    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("room", "user")