from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from .models import Booking, BookingStatus
from .serializers import (
    BookingCreateSerializer, BookingListSerializer, BookingDetailSerializer,
    BookingStatusUpdateSerializer, BookingSerializer
)
from pandits.models import Pandit
from users.models import User 

class BookingViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Bookings, restricted by user role.
    Customers: Create and view their own bookings
    Pandits: View bookings for them and update status
    Admin: View all bookings
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Superuser/Staff can see all bookings
        if user.is_superuser or user.is_staff:
            return Booking.objects.all().select_related('user', 'pandit', 'service')
        
        # Pandit role sees bookings made for them
        elif user.role == 'pandit':
            return Booking.objects.filter(pandit__user=user).select_related('user', 'pandit', 'service')
            
        # Customer ('user') role sees only their own bookings
        else:
            return Booking.objects.filter(user=user).select_related('user', 'pandit', 'service')

    def get_serializer_class(self):
        """Choose serializer based on action"""
        if self.action == 'create':
            return BookingCreateSerializer
        elif self.action == 'list':
            return BookingListSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return BookingDetailSerializer
        return BookingSerializer

    def perform_create(self, serializer):
        """Only customers can create a booking"""
        if self.request.user.role != 'user':
            raise permissions.PermissionDenied("Only customers can create bookings.")
        serializer.save(user=self.request.user, status=BookingStatus.PENDING)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """Pandits can accept, complete, or cancel bookings"""
        booking = self.get_object()
        user = request.user
        
        # Permission check: Only the assigned pandit can update status
        if user.role != 'pandit' or booking.pandit.user != user:
            return Response(
                {"detail": "Permission denied. You are not the assigned Pandit."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate new status
        new_status = request.data.get('status')
        if new_status not in [BookingStatus.ACCEPTED, BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            return Response(
                {"detail": "Invalid status value."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # State transition validation
        current_status = booking.status
        if current_status == BookingStatus.COMPLETED:
            return Response(
                {"detail": "Cannot change status of a completed booking."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        if current_status == BookingStatus.CANCELLED:
            return Response(
                {"detail": "Cannot change status of a cancelled booking."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status and timestamp
        booking.status = new_status
        if new_status == BookingStatus.ACCEPTED:
            booking.accepted_at = timezone.now()
        elif new_status == BookingStatus.COMPLETED:
            booking.completed_at = timezone.now()
        
        booking.save()
        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        """Allow customers to cancel pending bookings"""
        booking = self.get_object()
        user = request.user
        
        # Permission: Only the customer who created the booking can cancel
        if booking.user != user and user.role != 'admin':
            return Response(
                {"detail": "You can only cancel your own bookings."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only pending bookings can be cancelled
        if booking.status != BookingStatus.PENDING:
            return Response(
                {"detail": f"Cannot cancel a {booking.status} booking."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = BookingStatus.CANCELLED
        booking.save()
        
        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_bookings(self, request):
        """Get current user's bookings"""
        bookings = self.get_queryset()
        serializer = BookingListSerializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def available_slots(self, request):
        """Get available time slots for a pandit on a specific date"""
        pandit_id = request.query_params.get('pandit_id')
        booking_date = request.query_params.get('date')
        
        if not pandit_id or not booking_date:
            return Response(
                {"detail": "pandit_id and date are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            pandit = Pandit.objects.get(id=pandit_id)
        except Pandit.DoesNotExist:
            return Response(
                {"detail": "Pandit not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get booked time slots for this pandit on the date
        booked_slots = Booking.objects.filter(
            pandit=pandit,
            booking_date=booking_date,
            status__in=[BookingStatus.PENDING, BookingStatus.ACCEPTED]
        ).values_list('booking_time', flat=True)
        
        # Generate available slots (e.g., every 1 hour from 8 AM to 8 PM)
        from datetime import time, datetime, timedelta
        available_slots = []
        current_time = time(8, 0)  # Start at 8 AM
        end_time = time(20, 0)  # End at 8 PM
        
        while current_time < end_time:
            if current_time not in booked_slots:
                available_slots.append(current_time.strftime('%H:%M'))
            current_time = (datetime.combine(timezone.now().date(), current_time) + timedelta(hours=1)).time()
        
        return Response({"available_slots": available_slots})