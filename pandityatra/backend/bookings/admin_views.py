from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import Booking, BookingStatus
from payments.utils import refund_stripe, refund_khalti


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_cancel_and_refund(request, booking_id):
    user = request.user

    # Only Admin / Staff
    if not (user.is_superuser or user.is_staff or user.role == "admin"):
        return Response({"detail": "Admin only"}, status=403)

    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({"detail": "Booking not found"}, status=404)

    # If already cancelled
    if booking.status == BookingStatus.CANCELLED:
        return Response({"detail": "Booking already cancelled"}, status=400)

    # =======================
    # Refund if payment done
    # =======================
    if booking.payment_status and booking.transaction_id:
        if booking.payment_method == "STRIPE":
            refund_stripe(booking.transaction_id)

        elif booking.payment_method == "KHALTI":
            refund_khalti(booking.transaction_id)

    # =======================
    # Cancel booking
    # =======================
    booking.status = BookingStatus.CANCELLED
    booking.completed_at = timezone.now()
    booking.save()

    return Response({
        "message": "Booking cancelled and refunded successfully",
        "booking_id": booking.id,
        "status": booking.status
    }, status=200)
