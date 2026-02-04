from video.models import VideoRoom
from video.services.daily import create_daily_room_for_booking

def ensure_video_room_for_booking(booking):
    
    # Prevent duplicate rooms (webhook retries )
    if hasattr(booking, "video_room"):
        return booking.video_room
    
    room_name, room_url = create_daily_room_for_booking(booking.id)

    video_room = VideoRoom.objects.create(
        booking=booking,
        provider="daily",
        room_name=room_name,
        room_url=room_url,
        status="scheduled"
    )

    # 🚨 CRITICAL FIX: Update Booking with the URL
    booking.video_room_url = room_url
    booking.save(update_fields=['video_room_url'])

    return video_room

# Closely link room to booking
def close_video_room(booking):
    from video.models import VideoRoom
    room = VideoRoom.objects.filter(booking=booking).first()
    if room and room.status != "closed":
        room.status = "closed"
        room.save()

    return room
    
