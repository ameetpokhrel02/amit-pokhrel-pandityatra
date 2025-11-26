# bookings/serializers.py

from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    """
    Serializer used for creating, retrieving, and updating bookings.
    """
    # Read-only fields for display
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    pandit_full_name = serializers.CharField(source='pandit.full_name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_full_name', 'pandit', 'pandit_full_name', 
            'service_name', 'service_location', 'booking_date', 'booking_time', 
            'status', 'fee', 'payment_status', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'fee', 'payment_status', 'created_at']