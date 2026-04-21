import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from mailjet_rest import Client
from .models import EmailNotification, EmailTemplate
from django.template import Context, Template
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

@shared_task(name='notifications.tasks.send_email_task')
def send_email_task(notification_id):
    """
    Background task to send email using Mailjet
    """
    try:
        notification = EmailNotification.objects.get(id=notification_id)
    except EmailNotification.DoesNotExist:
        logger.error(f"EmailNotification with id {notification_id} does not exist.")
        return False

    try:
        mailjet = Client(auth=(settings.MAILJET_API_KEY, settings.MAILJET_SECRET_KEY), version='v3.1')
        
        # Branding context
        logo_url = f"{settings.FRONTEND_URL}/images/AAApandityatra.png"
        
        context_data = {
            'logo_url': logo_url,
            'subject': notification.subject,
            'recipient_name': notification.recipient_user.full_name if notification.recipient_user else "User",
            'frontend_url': settings.FRONTEND_URL,
        }

        # If a template is used, render it
        if notification.template:
            html_template = Template(notification.template.html_content)
            plain_template = Template(notification.template.plain_content or "")
            
            rendered_html = html_template.render(Context(context_data))
            rendered_plain = plain_template.render(Context(context_data)) if notification.template.plain_content else strip_tags(rendered_html)
        else:
            # Fallback for custom emails without database templates
            msg_body = notification.message or ""
            rendered_html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <div style="text-align:center; padding: 20px;">
                        <img src="{logo_url}" width="150" alt="PanditYatra">
                    </div>
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #ff9933;">{notification.subject}</h2>
                        <div style="white-space: pre-wrap;">{msg_body}</div>
                    </div>
                    <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                        &copy; {timezone.now().year} PanditYatra. All rights reserved.
                    </div>
                </body>
            </html>
            """
            rendered_plain = strip_tags(rendered_html)

        data = {
            'Messages': [
                {
                    "From": {
                        "Email": settings.MAILJET_SENDER_EMAIL,
                        "Name": settings.MAILJET_SENDER_NAME
                    },
                    "To": [
                        {
                            "Email": notification.recipient_email,
                            "Name": notification.recipient_user.full_name if notification.recipient_user else ""
                        }
                    ],
                    "Subject": notification.subject,
                    "TextPart": rendered_plain,
                    "HTMLPart": rendered_html
                }
            ]
        }

        result = mailjet.send.create(data=data)
        
        if result.status_code == 200:
            notification.status = 'SENT'
            notification.sent_at = timezone.now()
            notification.save()
            logger.info(f"Successfully sent email to {notification.recipient_email}")
            return True
        else:
            notification.status = 'FAILED'
            notification.error_message = str(result.json())
            notification.save()
            logger.error(f"Mailjet failed to send email to {notification.recipient_email}: {result.json()}")
            return False

    except Exception as e:
        notification.status = 'FAILED'
        notification.error_message = str(e)
        notification.save()
        logger.error(f"Error in send_email_task for notification {notification_id}: {str(e)}", exc_info=True)
        return False

@shared_task(name='notifications.tasks.booking_notification_task')
def booking_notification_task(booking_id, notification_type):
    """
    Task to trigger booking related emails
    """
    from bookings.models import Booking
    try:
        booking = Booking.objects.get(id=booking_id)
        
        # Identify template
        template_name = 'BOOKING_CONFIRMATION' if notification_type == 'CREATED' else 'RESCHEDULE_NOTIFICATION'
        template = EmailTemplate.objects.filter(template_type=template_name).first()
        
        if not template:
            logger.warning(f"No EmailTemplate found for {template_name}")
            return False

        # Create log
        notification = EmailNotification.objects.create(
            recipient_email=booking.user.email,
            recipient_user=booking.user,
            template=template,
            subject=template.subject.replace('{{puja_name}}', booking.service_name),
            sender_role='SYSTEM'
        )
        
        # Queue the actual sending
        send_email_task.delay(notification.id)
        return True
        
    except Exception as e:
        logger.error(f"Error in booking_notification_task: {str(e)}")
        return False
