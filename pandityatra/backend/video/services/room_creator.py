from video.models import VideoRoom
from video.services.daily import create_daily_room_for_booking
from notifications.email_utils import send_room_ready_email

def ensure_video_room_for_booking(booking):
    
    # Prevent duplicate rooms
    if hasattr(booking, "video_room"):
        return booking.video_room
    
    # Get service info for metadata
    puja_title = booking.service.title if booking.service else booking.service_name
    pandit_id = booking.pandit_id

    room_name, room_url = create_daily_room_for_booking(
        booking_id=booking.id,
        puja_type=puja_title,
        pandit_id=pandit_id
    )

    video_room = VideoRoom.objects.create(
        booking=booking,
        provider="daily",
        room_name=room_name,
        room_url=room_url,
        status="scheduled"
    )

    # Update Booking with the new fields
    booking.daily_room_url = room_url
    booking.daily_room_name = room_name
    booking.video_room_url = room_url # Legacy support
    booking.save(update_fields=['daily_room_url', 'daily_room_name', 'video_room_url'])

    # TODO: Trigger Notifications here
    try:
        from notifications.models import Notification
        Notification.objects.create(
            user=booking.user,
            notification_type='PAYMENT_SUCCESS',
            title="Puja Room Ready",
            message=f"Your {puja_title} room is ready. Join from 'My Bookings' on {booking.booking_date} at {booking.booking_time}.",
            booking=booking
        )
        Notification.objects.create(
            user=booking.pandit.user,
            notification_type='BOOKING_ACCEPTED',
            title="Puja Room Ready (Pandit)",
            message=f"The room for {puja_title} is ready. Start when scheduled.",
            booking=booking
        )
        
        # Send Emails
        send_room_ready_email(booking)
    except Exception as e:
        print(f"Notification error: {e}")

    return video_room

# Closely link room to booking
def close_video_room(booking):
    from video.models import VideoRoom
    room = VideoRoom.objects.filter(booking=booking).first()
    if room and room.status != "closed":
        room.status = "closed"
        room.save()

    return room
    
