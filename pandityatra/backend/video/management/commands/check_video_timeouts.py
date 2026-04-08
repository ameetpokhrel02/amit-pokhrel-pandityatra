import logging
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from video.models import VideoRoom, VideoParticipant
from notifications.services import notify_missed_video_puja

from bookings.models import BookingStatus

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Check for video call timeouts (8 mins join window) and handle missed calls'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # We look for rooms that are NOT ended
        active_rooms = VideoRoom.objects.exclude(status='ended').select_related('booking', 'booking__user', 'booking__pandit')
        
        for room in active_rooms:
            booking = room.booking
            # Combine date and time to get localized start dt
            naive_start = datetime.combine(booking.booking_date, booking.booking_time)
            # Assuming server/booking timezone is same as default (or Asia/Kathmandu)
            start_dt = timezone.make_aware(naive_start, timezone.get_current_timezone())
            
            # If we are at least 8 minutes past the scheduled start
            if now > (start_dt + timedelta(minutes=8)):
                active_participants = VideoParticipant.objects.filter(room=room, left_at__isnull=True)
                count = active_participants.count()
                
                if count == 1:
                    # Someone is waiting alone!
                    participant = active_participants.first()
                    # Check if they have been waiting for at least 8 minutes
                    if now > (participant.joined_at + timedelta(minutes=8)):
                        # Journey Rule: System auto-ends if partner didn't join within 8 mins of waiting
                        room.status = 'ended'
                        room.ended_at = now
                        room.save()
                        
                        # Mark booking as MISSED
                        booking.status = BookingStatus.MISSED
                        booking.save()
                        
                        is_pandit_waiting = (booking.pandit and booking.pandit.user_id == participant.user_id)
                        missing_role = 'customer' if is_pandit_waiting else 'pandit'
                        
                        notify_missed_video_puja(booking, missing_role)
                        self.stdout.write(self.style.SUCCESS(f"Auto-ended room {room.room_name} and marked booking {booking.id} as MISSED due to {missing_role} missing."))
                
                elif count == 0 and now > (start_dt + timedelta(minutes=15)):
                    # Both missed the call completely (15 min grace period)
                    room.status = 'ended'
                    room.ended_at = now
                    room.save()
                    
                    # Mark booking as MISSED
                    booking.status = BookingStatus.MISSED
                    booking.save()
                    
                    self.stdout.write(self.style.WARNING(f"Auto-ended room {room.room_name} and marked booking {booking.id} as MISSED - neither party joined."))
