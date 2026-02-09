from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

def send_puja_email(recipient_email, subject, template_name, context):
    """
    Generic function to send puja-related emails using templates.
    """
    try:
        html_content = render_to_string(f'emails/{template_name}', context)
        text_content = strip_tags(html_content)
        
        from_email = settings.DEFAULT_FROM_EMAIL
        msg = EmailMultiAlternatives(
            subject,
            text_content,
            from_email,
            [recipient_email],
            reply_to=['support@pandityatra.com']
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")
        return False

def send_room_ready_email(booking):
    """
    Notify customer and pandit that the video room is ready.
    """
    # Notify Customer
    customer_context = {
        'user_name': booking.user.full_name,
        'puja_name': booking.service_name,
        'booking_date': booking.booking_date,
        'booking_time': booking.booking_time,
        'room_url': booking.daily_room_url,
        'role': 'customer'
    }
    send_puja_email(
        booking.user.email,
        f"Your {booking.service_name} Room is Ready!",
        'room_ready_email.html',
        customer_context
    )

    # Notify Pandit
    if booking.pandit and booking.pandit.user.email:
        pandit_context = {
            'user_name': booking.pandit.user.full_name,
            'puja_name': booking.service_name,
            'booking_date': booking.booking_date,
            'booking_time': booking.booking_time,
            'room_url': booking.daily_room_url,
            'role': 'pandit'
        }
        send_puja_email(
            booking.pandit.user.email,
            f"Upcoming Puja: {booking.service_name} Room Ready",
            'room_ready_email.html',
            pandit_context
        )

def send_recording_ready_email(booking):
    """
    Notify customer that the puja recording is available.
    """
    context = {
        'user_name': booking.user.full_name,
        'puja_name': booking.service_name,
        'recording_url': f"{settings.FRONTEND_URL}/recording/{booking.id}"
    }
    send_puja_email(
        booking.user.email,
        f"Your {booking.service_name} Recording is Ready",
        'recording_ready_email.html',
        context
    )
