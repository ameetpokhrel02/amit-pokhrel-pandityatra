import os
import stripe
import logging
import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.conf import settings
from django.utils import timezone

from payments.models import Payment, PaymentWebhook
from adminpanel.models import PaymentErrorLog
from bookings.models import Booking
from video.utils import create_video_room

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    
    try:
        json_payload = json.loads(payload)
    except:
        json_payload = {}

    # Log webhook receipt
    webhook_log = PaymentWebhook.objects.create(
        payment_method='STRIPE',
        payload=json_payload, 
        headers=dict(request.META),
        processed=False
    )

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        logger.error(f"Invalid payload: {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        logger.error(f"Invalid signature: {e}")
        return HttpResponse(status=400)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        PaymentErrorLog.objects.create(
            error_type="WEBHOOK",
            message=f"Stripe webhook construction error: {str(e)}",
            context={"request_data": str(request.body)}
        )
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        _handle_successful_payment(session, webhook_log)

    return HttpResponse(status=200)

def _handle_successful_payment(session, webhook_log):
    try:
        metadata = session.get('metadata', {})
        booking_id = metadata.get('booking_id')
        payment_id = metadata.get('payment_id')
        order_id = metadata.get('order_id')
        type_param = metadata.get('type')

        with transaction.atomic():
            # Handle Booking Flow
            if booking_id and payment_id:
                payment = Payment.objects.select_for_update().get(id=payment_id)
                if payment.status == 'COMPLETED':
                    logger.info(f"Payment {payment_id} already completed")
                    return

                payment.status = 'COMPLETED'
                payment.transaction_id = session['id']
                payment.gateway_response = session
                payment.completed_at = timezone.now()
                payment.save()

                booking = Booking.objects.select_for_update().get(id=booking_id)
                booking.payment_status = True
                booking.payment_method = 'STRIPE'
                booking.status = 'ACCEPTED' 
                booking.transaction_id = session['id']
                booking.save()

                # 🚨 CHECK FOR FIRST TIME BOOKING (New User for Puja)
                from payments.models import Payment
                is_first_booking = not Payment.objects.filter(
                    user=payment.user, 
                    status='COMPLETED', 
                    booking__isnull=False
                ).exclude(id=payment.id).exists()

                if is_first_booking:
                    from adminpanel.utils import log_activity
                    log_activity(
                        user=payment.user,
                        action_type="NEW_USER_PUJA",
                        details=f"First time booking Pandit Puja via Stripe: {booking.service_name}",
                        request=None
                    )
                
                # Create video room if ONLINE
                if getattr(booking, 'service_location', None) == 'ONLINE':
                    from video.utils import create_video_room
                    room_url = create_video_room(
                        booking.id,
                        str(booking.booking_date),
                        booking.service_name
                    )
                    if room_url:
                        booking.video_room_url = room_url
                        booking.save()
                
                logger.info(f"Payment completed for booking {booking_id}")

            # Handle Shop Order Flow
            elif order_id or type_param == 'shop_order':
                from samagri.models import ShopOrder, ShopOrderStatus
                order = ShopOrder.objects.select_for_update().get(id=order_id)
                
                if order.status == ShopOrderStatus.PAID:
                    logger.info(f"Order {order_id} already paid")
                    return

                order.status = ShopOrderStatus.PAID
                order.payment_method = 'STRIPE'
                order.transaction_id = session['id']
                order.save()
                
                logger.info(f"Stripe payment completed for shop order {order_id}")

            webhook_log.processed = True
            webhook_log.save()

    except Exception as e:
        logger.error(f"Stripe webhook processing error: {e}")
        PaymentErrorLog.objects.create(
            error_type="WEBHOOK",
            message=f"Stripe webhook processing error: {str(e)}",
            context={"event": str(session)}
        )