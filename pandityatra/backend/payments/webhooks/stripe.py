import os
import stripe
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

from payments.models import Payment
from adminpanel.models import PaymentErrorLog
from bookings.models import Booking
from video.services.room_creator import ensure_video_room_for_booking

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        PaymentErrorLog.objects.create(
            error_type="WEBHOOK",
            message=f"Stripe webhook error: {str(e)}",
            context={"request_data": str(request.body)}
        )
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        try:
            # We pass orderID when creating Stripe checkout
            order_id = session["metadata"]["order_id"]
            stripe_tx = session["payment_intent"]

            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(order_id=order_id)

                # Prevent duplicate webhook execution
                if payment.status == "success":
                    return HttpResponse(status=200)

                payment.status = "success"
                payment.transactionID = stripe_tx
                payment.save(update_fields=["status", "transactionID"])

                booking = payment.order
                booking.payment_status = "paid"
                booking.save(update_fields=["payment_status"])

                # Create Daily room + VideoRoom
                ensure_video_room_for_booking(booking)
        except Exception as e:
            PaymentErrorLog.objects.create(
                error_type="WEBHOOK",
                message=f"Stripe webhook processing error: {str(e)}",
                context={"event": str(event)}
            )

    return HttpResponse(status=200)