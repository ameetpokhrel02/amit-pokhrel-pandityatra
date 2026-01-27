from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal # 🚨 ADDED

from .models import Booking, BookingStatus

from .serializers import (
    BookingCreateSerializer,
    BookingListSerializer,
    BookingDetailSerializer,
    BookingSerializer
)
from pandits.models import Pandit


class BookingViewSet(viewsets.ModelViewSet):
    """
    Customers → create & view own bookings
    Pandits   → manage bookings assigned to them
    Admin     → full control (view, cancel, refund)
    """
    permission_classes = [permissions.IsAuthenticated]

    # ---------------------------
    # QUERYSET FILTERING
    # ---------------------------
    def get_queryset(self):
        user = self.request.user

        # Admin sees everything
        if user.is_superuser or user.is_staff or user.role == "admin":
            return Booking.objects.all().select_related("user", "pandit", "service")

        # Pandit sees his bookings
        if user.role == "pandit":
            return Booking.objects.filter(pandit__user=user).select_related("user", "pandit", "service")

        # Customer sees own bookings
        return Booking.objects.filter(user=user).select_related("user", "pandit", "service")

    # ---------------------------
    # SERIALIZER
    # ---------------------------
    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        elif self.action == "list":
            return BookingListSerializer
        elif self.action in ["retrieve", "update", "partial_update"]:
            return BookingDetailSerializer
        return BookingSerializer

    # ---------------------------
    # CREATE BOOKING
    # ---------------------------
    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "user":
            raise permissions.PermissionDenied("Only customers can create bookings.")

        pandit = serializer.validated_data["pandit"]

        # 🚨 Only verified pandits can receive bookings
        if not pandit.is_verified:
            raise permissions.PermissionDenied("This Pandit is not verified by admin.")

        serializer.save(user=user, status=BookingStatus.PENDING)

    # ---------------------------
    # PANDIT UPDATE STATUS
    # ---------------------------
    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        user = request.user

        if user.role != "pandit" or booking.pandit.user != user:
            return Response({"detail": "Not your booking"}, status=403)

        new_status = request.data.get("status")

        valid_transitions = {
            BookingStatus.PENDING: [BookingStatus.ACCEPTED, BookingStatus.CANCELLED],
            BookingStatus.ACCEPTED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
        }

        if new_status not in valid_transitions.get(booking.status, []):
            return Response(
                {"detail": f"Invalid status transition from {booking.status} to {new_status}"},
                status=400
            )

        booking.status = new_status

        if new_status == BookingStatus.ACCEPTED:
            booking.accepted_at = timezone.now()
        if new_status == BookingStatus.COMPLETED:
            booking.completed_at = timezone.now()
            
            # Credit Pandit earnings (Wallet System)
            pandit_wallet = booking.pandit.wallet
            pandit_share = booking.total_fee * Decimal("0.80") # 80% Share
            
            pandit_wallet.total_earned += pandit_share
            pandit_wallet.available_balance += pandit_share
            pandit_wallet.save()

        booking.save()
        return Response(BookingDetailSerializer(booking).data)


    # ---------------------------
    # CUSTOMER CANCEL
    # ---------------------------
    @action(detail=True, methods=["patch"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        user = request.user

        if booking.user != user:
            return Response({"detail": "You can cancel only your own booking"}, status=403)

        if booking.status != BookingStatus.PENDING:
            return Response({"detail": "Only pending bookings can be cancelled"}, status=400)

        booking.status = BookingStatus.CANCELLED
        booking.cancelled_by = "user"
        booking.save()

        return Response(BookingDetailSerializer(booking).data)

    # ---------------------------
    # ADMIN CANCEL + REFUND
    # ---------------------------
    @action(detail=True, methods=["post"])
    def admin_cancel(self, request, pk=None):
        booking = self.get_object()
        user = request.user

        if not (user.is_superuser or user.is_staff or user.role == "admin"):
            return Response({"detail": "Admin only"}, status=403)

        if booking.status in [BookingStatus.CANCELLED, BookingStatus.COMPLETED]:
            return Response({"detail": "Cannot cancel this booking"}, status=400)

        # 🔔 Refund Logic (Ported from admin_views.py)
        refund_successful = False
        if booking.payment_status and booking.transaction_id:
            from payments.utils import refund_stripe, refund_khalti
            
            if booking.payment_method == "STRIPE":
                refund_successful = refund_stripe(booking.transaction_id)
            elif booking.payment_method == "KHALTI":
                refund_successful = refund_khalti(booking.transaction_id)
                
            if not refund_successful:
                 return Response({"detail": "Refund failed at gateway. Cancellation aborted."}, status=400)

        booking.status = BookingStatus.CANCELLED
        booking.cancelled_by = "admin"
        booking.save()

        return Response({
            "detail": "Booking cancelled and refunded by admin",
            "booking_id": booking.id,
            "refund_processed": refund_successful
        })

    # ---------------------------
    # USER BOOKINGS
    # ---------------------------
    @action(detail=False, methods=["get"])
    def my_bookings(self, request):
        serializer = BookingListSerializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    # ---------------------------
    # AVAILABLE SLOTS
    # ---------------------------
    @action(detail=False, methods=["get"])
    def available_slots(self, request):
        pandit_id = request.query_params.get("pandit_id")
        booking_date = request.query_params.get("date")
        service_id = request.query_params.get("service_id")

        if not pandit_id or not booking_date:
            return Response({"detail": "pandit_id and date required"}, status=400)

        pandit = Pandit.objects.filter(id=pandit_id, is_verified=True).first()
        if not pandit:
            return Response({"detail": "Pandit not found or not verified"}, status=404)
        
        # Get requested service duration
        duration_minutes = 60 # Default
        if service_id:
            from services.models import Service
            service = Service.objects.filter(id=service_id).first()
            if service:
                duration_minutes = service.duration_minutes

        # Fetch existing bookings with their services
        existing_bookings = Booking.objects.filter(
            pandit=pandit,
            booking_date=booking_date,
            status__in=[BookingStatus.PENDING, BookingStatus.ACCEPTED]
        ).select_related('service')

        # Build list of busy intervals [(start, end)]
        busy_intervals = []
        for b in existing_bookings:
            start_time = datetime.combine(datetime.today(), b.booking_time)
            # Use booking's service duration or default
            b_duration = b.service.duration_minutes if b.service else 60
            end_time = start_time + timedelta(minutes=b_duration)
            busy_intervals.append((start_time, end_time))

        from datetime import time
        slots = []
        
        # Helper to check overlap
        def is_overlapping(candidate_start, candidate_end, intervals):
            for start, end in intervals:
                # Check if candidate overlaps with existing booking
                # Overlap logic: A_start < B_end AND A_end > B_start
                if candidate_start < end and candidate_end > start:
                    return True
            return False

        # Generate slots every 30 mins
        current_time = datetime.combine(datetime.today(), time(8, 0)) # Start at 8 AM
        end_of_day = datetime.combine(datetime.today(), time(20, 0)) # End at 8 PM

        while current_time + timedelta(minutes=duration_minutes) <= end_of_day:
            candidate_start = current_time
            candidate_end = current_time + timedelta(minutes=duration_minutes)
            
            if not is_overlapping(candidate_start, candidate_end, busy_intervals):
                slots.append(candidate_start.time().strftime("%H:%M"))
            
            current_time += timedelta(minutes=30) # 30 min increments

        return Response({"available_slots": slots})
