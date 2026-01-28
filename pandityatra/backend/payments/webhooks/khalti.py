import json
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

from payments.models import Payment   # adjust if needed
from adminpanel.models import PaymentErrorLog
from bookings.models import Booking
from video.services.room_creator import ensure_video_room_for_booking


@csrf_exempt
def khalti_webhook(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception as e:
        PaymentErrorLog.objects.create(
            error_type="WEBHOOK",
            message=f"Khalti webhook error: {str(e)}",
            context={"request_data": str(request.body)}
        )
        return HttpResponse(status=400)

    # Example payload fields (may vary by Khalti setup)
    # data = {
    #   "pidx": "...",
    #   "status": "Completed",
    #   "amount": 1800000,
    #   "transaction_id": "..."
    # }

    if data.get("status") != "Completed":
        return HttpResponse(status=200)

    pidx = data.get("pidx")
    if not pidx:
        return HttpResponse(status=200)

    try:
        with transaction.atomic():
            # Find the Payment you created when initiating Khalti
            payment = Payment.objects.select_for_update().filter(
                gateway="khalti",
                transaction_id=pidx
            ).first()

            if not payment:
                return HttpResponse(status=200)

            booking = payment.booking

            # Idempotency
            if booking.payment_status == "paid":
                return HttpResponse(status=200)

            # Update payment
            payment.status = "success"
            payment.save(update_fields=["status"])

            # Update booking
            booking.payment_status = "paid"
            booking.save(update_fields=["payment_status"])

            # Create Daily room + VideoRoom
            ensure_video_room_for_booking(booking)
    except Exception as e:
        PaymentErrorLog.objects.create(
            error_type="WEBHOOK",
            message=f"Khalti webhook processing error: {str(e)}",
            context={"event": str(data)}
        )

    return HttpResponse(status=200)