"""
Notification Service - Creates notifications for various events
"""
import json
import logging
import importlib
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import Notification, PushNotificationToken


logger = logging.getLogger(__name__)


def _get_webpush_callable():
    try:
        module = importlib.import_module('pywebpush')
        return getattr(module, 'webpush', None), getattr(module, 'WebPushException', Exception)
    except Exception:
        return None, Exception


def create_notification(user, notification_type, title, message, booking=None, title_ne=None, message_ne=None):
    """
    Create a notification for a user
    
    Args:
        user: The user to notify
        notification_type: One of the NOTIFICATION_TYPES
        title: Notification title
        message: Notification message
        booking: Optional related booking
        title_ne: Optional Nepali title
        message_ne: Optional Nepali message
    
    Returns:
        The created Notification object
    """
    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        booking=booking,
        title_ne=title_ne,
        message_ne=message_ne
    )

    _send_push_for_notification(notification)
    return notification


def register_push_token(user, token, device_type='web', endpoint=None, subscription=None):
    """Create or update user push token/subscription."""
    if not token:
        return None

    obj, _ = PushNotificationToken.objects.update_or_create(
        user=user,
        token=token,
        defaults={
            'device_type': device_type or 'web',
            'endpoint': endpoint,
            'subscription': subscription,
            'is_active': True,
        }
    )
    return obj


def _build_push_payload(notification):
    target_url = '/my-bookings'
    if notification.booking_id:
        if notification.notification_type in {'PUJA_ROOM_READY', 'VIDEO_CALL_INCOMING'}:
            target_url = f'/video/room/{notification.booking_id}'
        elif notification.notification_type == 'RECORDING_READY_REVIEW':
            target_url = f'/my-bookings/{notification.booking_id}?tab=recording-review'

    return {
        'title': notification.title,
        'body': notification.message,
        'notification_id': notification.id,
        'notification_type': notification.notification_type,
        'booking_id': notification.booking_id,
        'url': target_url,
    }


def _send_push_for_notification(notification):
    """Best-effort web push send for active user tokens."""
    webpush_callable, webpush_exception = _get_webpush_callable()

    if not settings.VAPID_PUBLIC_KEY or not settings.VAPID_PRIVATE_KEY or webpush_callable is None:
        return

    tokens = PushNotificationToken.objects.filter(user=notification.user, is_active=True)
    if not tokens.exists():
        return

    payload = json.dumps(_build_push_payload(notification))

    for token in tokens:
        subscription = token.subscription
        if not subscription and token.endpoint:
            subscription = {'endpoint': token.endpoint}
        if not subscription:
            continue

        try:
            webpush_callable(
                subscription_info=subscription,
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={'sub': settings.VAPID_ADMIN_EMAIL},
            )
        except webpush_exception as exc:
            status_code = getattr(getattr(exc, 'response', None), 'status_code', None)
            if status_code in (404, 410):
                token.is_active = False
                token.save(update_fields=['is_active', 'updated_at'])
            logger.warning('Web push failed for token %s: %s', token.id, exc)
        except Exception as exc:
            logger.warning('Unexpected push error for token %s: %s', token.id, exc)


def notify_booking_created(booking):
    """Notify pandit when a new booking is created"""
    pandit_user = booking.pandit.user
    create_notification(
        user=pandit_user,
        notification_type='BOOKING_CREATED',
        title='New Booking Request',
        message=f'{booking.user.full_name} has requested {booking.service_name} on {booking.booking_date}',
        booking=booking,
        title_ne='नयाँ बुकिङ अनुरोध',
        message_ne=f'{booking.user.full_name} ले {booking.service_name} को लागि अनुरोध गर्नुभयो'
    )


def notify_booking_accepted(booking):
    """Notify customer when booking is accepted"""
    create_notification(
        user=booking.user,
        notification_type='BOOKING_ACCEPTED',
        title='Booking Confirmed! 🎉',
        message=f'Your {booking.service_name} with {booking.pandit.user.full_name} on {booking.booking_date} has been confirmed.',
        booking=booking,
        title_ne='बुकिङ स्वीकृत!',
        message_ne=f'तपाईंको {booking.service_name} स्वीकृत भएको छ।'
    )


def notify_booking_completed(booking):
    """Notify customer when booking is completed"""
    create_notification(
        user=booking.user,
        notification_type='BOOKING_COMPLETED',
        title='Puja Completed Successfully ✨',
        message=f'Your {booking.service_name} has been completed. Thank you for using PanditYatra!',
        booking=booking,
        title_ne='पूजा सम्पन्न',
        message_ne=f'तपाईंको {booking.service_name} सफलतापूर्वक सम्पन्न भयो।'
    )
    
    # Also notify pandit
    create_notification(
        user=booking.pandit.user,
        notification_type='BOOKING_COMPLETED',
        title='Booking Completed',
        message=f'{booking.service_name} for {booking.user.full_name} has been marked as completed.',
        booking=booking
    )


def notify_booking_cancelled(booking, cancelled_by='user'):
    """Notify relevant party when booking is cancelled"""
    if cancelled_by == 'user':
        # Notify pandit
        create_notification(
            user=booking.pandit.user,
            notification_type='BOOKING_CANCELLED',
            title='Booking Cancelled',
            message=f'{booking.user.full_name} has cancelled the {booking.service_name} booking for {booking.booking_date}.',
            booking=booking
        )
    else:
        # Notify customer
        create_notification(
            user=booking.user,
            notification_type='BOOKING_CANCELLED',
            title='Booking Cancelled',
            message=f'Your {booking.service_name} booking with {booking.pandit.user.full_name} has been cancelled.',
            booking=booking
        )


def notify_payment_success(booking, amount):
    """Notify customer on successful payment"""
    create_notification(
        user=booking.user,
        notification_type='PAYMENT_SUCCESS',
        title='Payment Successful 💰',
        message=f'Payment of ₹{amount} for {booking.service_name} was successful.',
        booking=booking,
        title_ne='भुक्तानी सफल',
        message_ne=f'₹{amount} को भुक्तानी सफल भयो।'
    )
    
    # Notify pandit about the payment
    create_notification(
        user=booking.pandit.user,
        notification_type='PAYMENT_SUCCESS',
        title='Payment Received',
        message=f'Payment of ₹{amount} received for {booking.service_name} from {booking.user.full_name}.',
        booking=booking
    )


def notify_payment_failed(booking, amount):
    """Notify customer on failed payment"""
    create_notification(
        user=booking.user,
        notification_type='PAYMENT_FAILED',
        title='Payment Failed',
        message=f'Payment of ₹{amount} for {booking.service_name} failed. Please try again.',
        booking=booking
    )


def notify_new_message(message):
    """
    Notify the recipient of a new chat message
    
    Args:
        message: The Message object that was sent
    """
    chat_room = message.chat_room
    sender = message.sender
    message_preview = message.content
    
    # Determine recipient
    if chat_room.pandit and chat_room.pandit.user == sender:
        recipient = chat_room.customer
    elif chat_room.vendor and chat_room.vendor.user == sender:
        recipient = chat_room.customer
    else:
        # Sender is customer, recipient is either pandit or vendor
        recipient = chat_room.pandit.user if chat_room.pandit else chat_room.vendor.user
    
    sender_name = sender.full_name or sender.username
    
    create_notification(
        user=recipient,
        notification_type='NEW_MESSAGE',
        title=f'New message from {sender_name}',
        message=message_preview[:100] + ('...' if len(message_preview) > 100 else ''),
        booking=chat_room.booking
    )


def notify_puja_room_ready(booking):
    """Notify both parties when video puja room is ready"""
    # Notify customer
    create_notification(
        user=booking.user,
        notification_type='PUJA_ROOM_READY',
        title='Puja Room Ready (Customer)',
        message=f'The room for {booking.service_name} is ready. Join when scheduled.',
        booking=booking
    )
    
    # Notify pandit
    create_notification(
        user=booking.pandit.user,
        notification_type='PUJA_ROOM_READY',
        title='Puja Room Ready (Pandit)',
        message=f'The room for {booking.service_name} is ready. Start when scheduled.',
        booking=booking
    )


def notify_incoming_video_call(booking, caller_user):
    """Notify the opposite participant that call is incoming."""
    caller_id = getattr(caller_user, 'id', None)
    recipient = booking.pandit.user if booking.user_id == caller_id else booking.user

    # anti-spam guard: do not create repeated incoming-call notifications within 30 seconds
    recent_cutoff = timezone.now() - timedelta(seconds=30)
    exists_recent = Notification.objects.filter(
        user=recipient,
        booking=booking,
        notification_type='VIDEO_CALL_INCOMING',
        created_at__gte=recent_cutoff,
    ).exists()
    if exists_recent:
        return None

    caller_name = caller_user.full_name or caller_user.username
    return create_notification(
        user=recipient,
        notification_type='VIDEO_CALL_INCOMING',
        title='Incoming Video Call',
        message=f'{caller_name} is calling you for {booking.service_name}. Join now.',
        booking=booking,
    )


def notify_missed_video_puja(booking, missing_user_role):
    """
    Notify users when a video puja is missed.
    missing_user_role: 'customer' or 'pandit'
    """
    if missing_user_role == 'customer':
        # Anita missed the call
        create_notification(
            user=booking.user,
            notification_type='VIDEO_CALL_MISSED',
            title='You missed your Puja session 🙏',
            message=f'You missed the scheduled {booking.service_name} with {booking.pandit.user.full_name}. Would you like to reschedule?',
            booking=booking,
            title_ne='पूजा सत्र छुटेको छ 🙏',
            message_ne=f'तपाईंको {booking.pandit.user.full_name} सँगको {booking.service_name} छुटेको छ। के तपाईं अर्को समय मिलाउन चाहनुहुन्छ?'
        )
        create_notification(
            user=booking.pandit.user,
            notification_type='VIDEO_CALL_MISSED',
            title=f'{booking.user.full_name} did not join',
            message=f'{booking.user.full_name} did not join the {booking.service_name}. The session has ended. Recording not created.',
            booking=booking,
            title_ne='ग्राहक सामेल हुनुभएन',
            message_ne=f'{booking.user.full_name} पूजामा सामेल हुनुभएन। सत्र समाप्त भएको छ।'
        )
    else:
        # Pandit missed the call
        create_notification(
            user=booking.user,
            notification_type='VIDEO_CALL_MISSED',
            title='Pandit did not join',
            message=f'{booking.pandit.user.full_name} did not join the session. We have notified him. You can request a reschedule.',
            booking=booking,
            title_ne='पण्डित सामेल हुनुभएन',
            message_ne=f'{booking.pandit.user.full_name} सामेल हुनुभएन। तपाईं अर्को समय अनुरोध गर्न सक्नुहुन्छ।'
        )
        create_notification(
            user=booking.pandit.user,
            notification_type='VIDEO_CALL_MISSED',
            title='You missed a scheduled Puja 🙏',
            message=f'You missed the {booking.service_name} with {booking.user.full_name}. Please contact the customer to reschedule.',
            booking=booking,
            title_ne='पूजा सत्र छुटेको छ 🙏',
            message_ne=f'तपाईंको {booking.user.full_name} सँगको {booking.service_name} छुटेको छ।'
        )


def notify_recording_ready_review(booking):
    """Notify customer to review recording and leave rating after upload."""
    create_notification(
        user=booking.user,
        notification_type='RECORDING_READY_REVIEW',
        title='Recording Ready - Please Review',
        message=f'Your {booking.service_name} recording is ready. Please review and rate your session.',
        booking=booking,
    )

    create_notification(
        user=booking.pandit.user,
        notification_type='RECORDING_READY_REVIEW',
        title='Recording Uploaded',
        message=f'The recording for {booking.service_name} is ready for customer review.',
        booking=booking,
    )


def notify_puja_room_reminder(booking):
    """Notify both participants 5 minutes before scheduled online puja."""
    create_notification(
        user=booking.user,
        notification_type='PUJA_ROOM_READY',
        title='Puja starts in 5 minutes ⏰',
        message=f'Your {booking.service_name} session will start soon. Please join the video room.',
        booking=booking,
    )

    create_notification(
        user=booking.pandit.user,
        notification_type='PUJA_ROOM_READY',
        title='Upcoming puja in 5 minutes ⏰',
        message=f'{booking.service_name} with {booking.user.full_name} starts in 5 minutes. Please join the room.',
        booking=booking,
    )


def notify_review_received(review):
    """Notify pandit when they receive a review"""
    create_notification(
        user=review.pandit.user,
        notification_type='REVIEW_RECEIVED',
        title=f'New Review ⭐ {review.rating}/5',
        message=f'{review.customer.full_name} left a review: "{review.comment[:80]}..."' if review.comment else f'{review.customer.full_name} rated you {review.rating} stars.',
        booking=review.booking
    )


def notify_pandit_verified(pandit):
    """Notify pandit when their profile is verified"""
    create_notification(
        user=pandit.user,
        notification_type='PANDIT_VERIFIED',
        title='Profile Verified ✓',
        message='Congratulations! Your pandit profile has been verified. You can now receive bookings.',
    )


def notify_pandit_rejected(pandit, reason=None):
    """Notify pandit when their profile verification is rejected"""
    message = 'Your pandit profile verification was not approved.'
    if reason:
        message += f' Reason: {reason}'
    
    create_notification(
        user=pandit.user,
        notification_type='PANDIT_REJECTED',
        title='Profile Verification Update',
        message=message,
    )
