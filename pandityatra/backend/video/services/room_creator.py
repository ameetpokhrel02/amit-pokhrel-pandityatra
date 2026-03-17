from django.conf import settings
from django.utils.text import slugify

from video.models import VideoRoom
from notifications.email_utils import send_room_ready_email
from notifications.services import notify_puja_room_ready


def _build_internal_room_name(booking):
    """Generate deterministic room name per booking (idempotent with OneToOne room)."""
    title = booking.service.name if booking.service else booking.service_name
    title_slug = slugify(title)[:40] if title else "puja"
    return f"bk-{booking.id}-{title_slug}"


def _build_internal_room_url(room_name):
    base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{base}/video/{room_name}"


def ensure_video_room_for_booking(booking):

    # Prevent duplicate rooms
    if hasattr(booking, "video_room"):
        return booking.video_room

    room_name = _build_internal_room_name(booking)
    room_url = _build_internal_room_url(room_name)

    video_room = VideoRoom.objects.create(
        booking=booking,
        provider="webrtc",
        room_name=room_name,
        room_url=room_url,
        status="scheduled"
    )

    # Update Booking fields (legacy fields retained for compatibility)
    booking.daily_room_url = room_url
    booking.daily_room_name = room_name
    booking.video_room_url = room_url
    booking.save(update_fields=['daily_room_url', 'daily_room_name', 'video_room_url'])

    # 🔔 Trigger Notifications for puja room ready
    try:
        notify_puja_room_ready(booking)
        
        # Send Emails
        send_room_ready_email(booking)
    except Exception as e:
        print(f"Notification error: {e}")

    return video_room

# Closely link room to booking
def close_video_room(booking):
    from video.models import VideoRoom
    room = VideoRoom.objects.filter(booking=booking).first()
    if room and room.status != "ended":
        room.status = "ended"
        room.save()

    return room
    
