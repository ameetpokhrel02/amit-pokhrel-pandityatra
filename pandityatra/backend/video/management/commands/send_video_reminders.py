import logging
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from notifications.email_utils import send_room_reminder_email
from notifications.services import notify_puja_room_reminder
from video.models import VideoRoom

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send one-time reminders around 10 minutes before scheduled online video sessions."

    def handle(self, *args, **options):
        now = timezone.localtime(timezone.now())
        current_tz = timezone.get_current_timezone()

        candidates = (
            VideoRoom.objects.select_related("booking", "booking__user", "booking__pandit")
            .filter(
                reminder_sent_at__isnull=True,
                status="scheduled",
                booking__service_location="ONLINE",
                booking__status="ACCEPTED",
                booking__payment_status=True,
            )
        )

        sent_count = 0
        skipped_count = 0

        for room in candidates:
            booking = room.booking

            if not booking.booking_date or not booking.booking_time:
                skipped_count += 1
                continue

            session_start_naive = datetime.combine(booking.booking_date, booking.booking_time)
            session_start = timezone.make_aware(session_start_naive, current_tz)
            minutes_to_start = (session_start - now).total_seconds() / 60

            # Run every minute: accept a small [4, 11] minute window around "10 min before".
            if not (4 <= minutes_to_start <= 11):
                skipped_count += 1
                continue

            try:
                with transaction.atomic():
                    locked = VideoRoom.objects.select_for_update().get(id=room.id)
                    if locked.reminder_sent_at is not None:
                        skipped_count += 1
                        continue

                    notify_puja_room_reminder(booking)
                    send_room_reminder_email(booking)

                    locked.reminder_sent_at = timezone.now()
                    locked.save(update_fields=["reminder_sent_at"])

                sent_count += 1
            except Exception as exc:
                logger.error("Failed to send video reminder for room %s: %s", room.id, exc)

        self.stdout.write(
            self.style.SUCCESS(
                f"Video reminder run completed: sent={sent_count}, skipped={skipped_count}, checked={candidates.count()}"
            )
        )
