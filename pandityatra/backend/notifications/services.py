"""
Notification Service - Creates notifications for various events
"""
from .models import Notification


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
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        booking=booking,
        title_ne=title_ne,
        message_ne=message_ne
    )


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
    if chat_room.pandit.user == sender:
        recipient = chat_room.customer
    else:
        recipient = chat_room.pandit.user
    
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


def notify_review_received(review):
    """Notify pandit when they receive a review"""
    create_notification(
        user=review.pandit.user,
        notification_type='REVIEW_RECEIVED',
        title=f'New Review ⭐ {review.rating}/5',
        message=f'{review.user.full_name} left a review: "{review.comment[:80]}..."' if review.comment else f'{review.user.full_name} rated you {review.rating} stars.',
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
