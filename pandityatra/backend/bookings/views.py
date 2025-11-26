from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Booking, BookingStatus
from .serializers import BookingSerializer
from users.models import User 

class BookingViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Bookings, restricted by user role.
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Superuser/Staff can see all bookings
        if user.is_superuser or user.role == 'staff':
            return Booking.objects.all().select_related('user', 'pandit')
        
        # Pandit role sees bookings made for them
        elif user.role == 'pandit':
            return Booking.objects.filter(pandit__user=user.id).select_related('user', 'pandit')
            
        # Customer ('user') role sees only their own bookings
        else:
            # Filters bookings where the authenticated user is the one who created it
            return Booking.objects.filter(user=user).select_related('user', 'pandit')

    def perform_create(self, serializer):
        # Only customers can create a booking
        if self.request.user.role == 'user':
            # Automatically set the user and initial PENDING status
            serializer.save(user=self.request.user, status=BookingStatus.PENDING)
        else:
            # Deny booking creation for Pandits/Staff via this endpoint
            raise permissions.PermissionDenied("Only customers can initiate a booking.")

    # Custom action for Pandits to change the status
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        new_status = request.data.get('status')

        # 1. Permission Check: Only the assigned Pandit can update the status
        if user.role != 'pandit' or booking.pandit.user != user:
            return Response({"detail": "Permission denied. You are not the assigned Pandit."}, 
                            status=status.HTTP_403_FORBIDDEN)

        # 2. Status Validation: Ensure the status value is valid
        if new_status not in [BookingStatus.ACCEPTED, BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            return Response({"detail": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Update Status
        booking.status = new_status
        booking.save()
        
        return Response(BookingSerializer(booking).data)