from rest_framework import viewsets, permissions, status, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
from decimal import Decimal # 🚨 ADDED
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

from .models import Booking, BookingStatus

from .serializers import (
    BookingCreateSerializer,
    BookingListSerializer,
    BookingDetailSerializer,
    BookingSerializer
)
from pandits.models import PanditUser
from notifications.services import (
    notify_booking_created,
    notify_booking_accepted,
    notify_booking_completed,
    notify_booking_cancelled
)
from video.services.room_creator import ensure_video_room_for_booking


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
        if user.is_superuser or user.is_staff or user.role in ("admin", "superadmin"):
            return Booking.objects.all().select_related("user", "pandit", "service")

        # Pandit sees his bookings
        if user.role == "pandit":
            return Booking.objects.filter(pandit=user).select_related("user", "pandit", "service")

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
            raise exceptions.PermissionDenied("Only customers can create bookings.")

        pandit = serializer.validated_data["pandit"]

        # 🚨 Only verified pandits can receive bookings
        if not pandit.is_verified:
            raise exceptions.PermissionDenied("This Pandit is not verified by admin.")

        serializer.save(user=user, status=BookingStatus.PENDING)
        
        # 🔔 Send notification to pandit about new booking
        booking = serializer.instance
        notify_booking_created(booking)
        
        service = serializer.validated_data.get('service')
        service_name = getattr(service, 'name', 'Service')
        
        from adminpanel.utils import log_activity
        log_activity(
            user=user, 
            action_type="BOOKING", 
            details=f"Booked {service_name} with {pandit.full_name}", 
            request=self.request,
            pandit=pandit
        )

    # ---------------------------
    # PANDIT UPDATE STATUS
    # ---------------------------
    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        user = request.user

        if user.role != "pandit" or booking.pandit_id != user.id:
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
            # 🔔 Notify customer that booking is accepted
            notify_booking_accepted(booking)

            # Auto-create video room for online bookings
            if booking.service_location == 'ONLINE':
                try:
                    ensure_video_room_for_booking(booking)
                except Exception as e:
                    # Keep booking acceptance successful even if room setup retries later
                    import logging
                    logging.getLogger(__name__).error(f"Failed to auto-create video room on booking accept: {e}")
            
        if new_status == BookingStatus.COMPLETED:
            booking.completed_at = timezone.now()
            # 🔔 Notify both parties that booking is completed
            notify_booking_completed(booking)
            
            # Credit Pandit earnings (Wallet System)
            pandit_wallet = booking.pandit.wallet
            pandit_share = booking.total_fee * Decimal("0.80") # 80% Share
            
            pandit_wallet.total_earned += pandit_share
            pandit_wallet.available_balance += pandit_share
            pandit_wallet.save()
            
        if new_status == BookingStatus.CANCELLED:
            # 🔔 Notify customer that pandit cancelled
            notify_booking_cancelled(booking, cancelled_by='pandit')

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
        
        # 🔔 Notify pandit that customer cancelled
        notify_booking_cancelled(booking, cancelled_by='user')

        return Response(BookingDetailSerializer(booking).data)

    # ---------------------------
    # ADMIN CANCEL + REFUND
    # ---------------------------
    @action(detail=True, methods=["post"])
    def admin_cancel(self, request, pk=None):
        booking = self.get_object()
        user = request.user

        if not (user.is_superuser or user.is_staff or user.role in ("admin", "superadmin")):
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
        from datetime import datetime, timedelta, time
        pandit_id = request.query_params.get("pandit_id")
        booking_date = request.query_params.get("date")
        service_id = request.query_params.get("service_id")

        # Validate input
        if not pandit_id or not booking_date:
            return Response({"detail": "pandit_id and date required"}, status=400)

        try:
            pandit = PanditUser.objects.get(id=pandit_id, is_verified=True)
        except PanditUser.DoesNotExist:
            return Response({"detail": "Pandit not found or not verified"}, status=404)

        # Get requested service duration from Puja model
        duration_minutes = 60 # Default
        if service_id:
            from services.models import Puja
            try:
                puja = Puja.objects.get(id=service_id)
                duration_minutes = getattr(puja, 'base_duration_minutes', 60)
            except Puja.DoesNotExist:
                pass  # fallback to default

        # Parse booking_date
        try:
            booking_date_obj = datetime.strptime(booking_date, "%Y-%m-%d").date()
        except Exception:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        # Fetch existing bookings with their services
        existing_bookings = Booking.objects.filter(
            pandit=pandit,
            booking_date=booking_date_obj,
            status__in=[BookingStatus.PENDING, BookingStatus.ACCEPTED]
        ).select_related('service')

        # Build list of busy intervals [(start, end)]
        busy_intervals = []
        for b in existing_bookings:
            start_time = datetime.combine(booking_date_obj, b.booking_time)
            # Use booking's service duration or default
            b_duration = getattr(b.service, 'base_duration_minutes', 60) if b.service else 60
            end_time = start_time + timedelta(minutes=b_duration)
            busy_intervals.append((start_time, end_time))

        # 🚨 ADDED: Fetch manual unavailability blocks
        from pandits.models import PanditAvailability
        manual_blocks = PanditAvailability.objects.filter(
            pandit=pandit,
            start_time__date=booking_date_obj
        )
        for block in manual_blocks:
            # Convert to naive datetime if needed, or ensure tz awareness match
            # For simplicity in this context, assuming localized or naive match
            start = timezone.localtime(block.start_time).replace(tzinfo=None) # if using naive logic below
            end = timezone.localtime(block.end_time).replace(tzinfo=None)
            busy_intervals.append((start, end))

        slots = []

        # Helper to check overlap
        def is_overlapping(candidate_start, candidate_end, intervals):
            for start, end in intervals:
                if candidate_start < end and candidate_end > start:
                    return True
            return False

        # Generate slots every 30 mins
        current_time = datetime.combine(booking_date_obj, time(8, 0)) # Start at 8 AM
        end_of_day = datetime.combine(booking_date_obj, time(20, 0)) # End at 8 PM

        while current_time + timedelta(minutes=duration_minutes) <= end_of_day:
            candidate_start = current_time
            candidate_end = current_time + timedelta(minutes=duration_minutes)

            if not is_overlapping(candidate_start, candidate_end, busy_intervals):
                slots.append(candidate_start.time().strftime("%H:%M"))

            current_time += timedelta(minutes=30)

        return Response({"available_slots": slots})

    @action(detail=True, methods=["get"], url_path="invoice")
    def invoice(self, request, pk=None):
        """GET /api/bookings/{id}/invoice/ — Download PDF invoice for a booking"""
        try:
            booking = Booking.objects.select_related(
                'user', 'pandit', 'service'
            ).get(id=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30*mm, bottomMargin=20*mm,
                                leftMargin=20*mm, rightMargin=20*mm)
        styles = getSampleStyleSheet()
        elements = []

        # Custom styles
        title_style = ParagraphStyle('InvoiceTitle', parent=styles['Title'],
                                     fontSize=24, textColor=colors.HexColor('#EA580C'),
                                     spaceAfter=4*mm)
        subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
                                        fontSize=10, textColor=colors.grey,
                                        spaceAfter=2*mm)
        heading_style = ParagraphStyle('SectionHead', parent=styles['Heading2'],
                                       fontSize=13, textColor=colors.HexColor('#1F2937'),
                                       spaceBefore=6*mm, spaceAfter=3*mm)
        normal = styles['Normal']
        bold_style = ParagraphStyle('BoldNormal', parent=normal, fontName='Helvetica-Bold')

        # --- Header ---
        elements.append(Paragraph("PanditYatra", title_style))
        elements.append(Paragraph("Your Spiritual Journey Partner — Booking Invoice", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#EA580C'),
                                   spaceAfter=4*mm, spaceBefore=2*mm))

        # --- Invoice Info ---
        info_data = [
            [Paragraph(f"<b>Invoice #:</b> INV-BK-{booking.id}", normal),
             Paragraph(f"<b>Booking Date:</b> {booking.booking_date.strftime('%B %d, %Y')}", normal)],
            [Paragraph(f"<b>Booking ID:</b> #{booking.id}", normal),
             Paragraph(f"<b>Status:</b> {booking.get_status_display()}", normal)],
            [Paragraph(f"<b>Booking Time:</b> {booking.booking_time.strftime('%I:%M %p')}", normal),
             Paragraph(f"<b>Location:</b> {booking.get_service_location_display()}", normal)],
        ]
        info_table = Table(info_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 4*mm))

        # --- Customer Info ---
        elements.append(Paragraph("Customer", heading_style))
        elements.append(Paragraph(f"<b>{booking.user.full_name}</b>", normal))
        elements.append(Paragraph(f"Email: {booking.user.email}", normal))
        if hasattr(booking.user, 'phone_number') and booking.user.phone_number:
            elements.append(Paragraph(f"Phone: {booking.user.phone_number}", normal))
        elements.append(Spacer(1, 3*mm))

        # --- Pandit Info ---
        elements.append(Paragraph("Pandit", heading_style))
        pandit_name = booking.pandit.full_name if booking.pandit else 'N/A'
        elements.append(Paragraph(f"<b>{pandit_name}</b>", normal))
        if booking.pandit and booking.pandit.expertise:
            elements.append(Paragraph(f"Expertise: {booking.pandit.expertise}", normal))
        elements.append(Spacer(1, 3*mm))

        # --- Service Details Table ---
        elements.append(Paragraph("Service Details", heading_style))
        table_data = [
            [Paragraph('<b>Description</b>', normal), Paragraph('<b>Amount</b>', normal)],
            [f"Puja: {booking.service_name}", f"Rs. {booking.service_fee:,.2f}"],
        ]
        if booking.samagri_required:
            table_data.append(["Samagri (Materials)", f"Rs. {booking.samagri_fee:,.2f}"])
        table_data.append([Paragraph('<b>Total</b>', bold_style),
                          Paragraph(f"<b>Rs. {booking.total_fee:,.2f}</b>", bold_style)])

        svc_table = Table(table_data, colWidths=[doc.width * 0.65, doc.width * 0.35])
        svc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFF7ED')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#9A3412')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor('#E5E7EB')),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#EA580C')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#FFFBF5')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEABOVE', (0, -1), (-1, -1), 1.5, colors.HexColor('#EA580C')),
        ]))
        elements.append(svc_table)
        elements.append(Spacer(1, 6*mm))

        # --- Payment Info ---
        elements.append(Paragraph("Payment Details", heading_style))
        payment_info = [
            [Paragraph('<b>Payment Status:</b>', normal),
             Paragraph('Paid' if booking.payment_status else 'Unpaid', normal)],
            [Paragraph('<b>Payment Method:</b>', normal),
             Paragraph(booking.payment_method or 'N/A', normal)],
            [Paragraph('<b>Transaction ID:</b>', normal),
             Paragraph(booking.transaction_id or 'N/A', normal)],
        ]
        pay_table = Table(payment_info, colWidths=[doc.width * 0.35, doc.width * 0.65])
        pay_table.setStyle(TableStyle([
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(pay_table)
        elements.append(Spacer(1, 8*mm))

        # --- Footer ---
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#D1D5DB'),
                                   spaceAfter=3*mm))
        footer_style = ParagraphStyle('Footer', parent=normal, fontSize=8,
                                      textColor=colors.grey, alignment=TA_CENTER)
        elements.append(Paragraph("Thank you for choosing PanditYatra!", footer_style))
        elements.append(Paragraph("This is a computer-generated invoice. No signature required.", footer_style))
        elements.append(Paragraph("support@pandityatra.com | www.pandityatra.com", footer_style))

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="PanditYatra_Invoice_Booking_{booking.id}.pdf"'
        return response
