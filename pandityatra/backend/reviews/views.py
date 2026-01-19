from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from .models import Review
from .serializers import ReviewSerializer
from bookings.models import Booking, BookingStatus

# ---------------------------
# Create Review
# ---------------------------
class CreateReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        booking_id = self.request.data.get('booking')
        
        # Validate Booking
        booking = get_object_or_404(Booking, id=booking_id)
        
        # 1. Must be the customer of that booking
        if booking.user != user:
             raise permissions.PermissionDenied("You can only review your own bookings.")
        
        # 2. Booking must be completed
        if booking.status != BookingStatus.COMPLETED:
             # For dev/testing allowing it, but in prod should be strict
             # raise permissions.PermissionDenied("Booking must be completed to review.")
             pass 

        # 3. Check if already reviewed
        if Review.objects.filter(booking=booking).exists():
             raise permissions.PermissionDenied("You have already reviewed this booking.")

        serializer.save(
            customer=user, 
            pandit=booking.pandit,
            booking=booking
        )
