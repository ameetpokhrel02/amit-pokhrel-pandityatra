# bookings/serializers.py

from rest_framework import serializers
from .models import Booking, BookingStatus, LocationChoices
from services.models import Puja
from pandits.models import Pandit

class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new bookings
    """
    class Meta:
        model = Booking
        fields = [
            'pandit', 'service', 'service_name', 'service_location', 
            'booking_date', 'booking_time', 'notes', 'samagri_required'
        ]
    
    def validate(self, data):
        """Validate booking doesn't conflict with existing bookings"""
        pandit = data.get('pandit')
        booking_date = data.get('booking_date')
        booking_time = data.get('booking_time')
        
        # Check for existing booking at same time
        exists = Booking.objects.filter(
            pandit=pandit,
            booking_date=booking_date,
            booking_time=booking_time,
            status__in=[BookingStatus.PENDING, BookingStatus.ACCEPTED]
        ).exists()
        
        if exists:
            raise serializers.ValidationError(
                "This pandit is not available at the selected date/time"
            )
        
        return data
    
    def create(self, validated_data):
        """Create booking with automatic fee calculation"""
        user = self.context['request'].user
        service = validated_data.get('service')
        
        # Calculate fees
        service_fee = service.price if service else 0
        samagri_fee = 500 if validated_data.get('samagri_required', True) else 0
        total_fee = service_fee + samagri_fee
        
        booking = Booking.objects.create(
            user=user,
            service_fee=service_fee,
            samagri_fee=samagri_fee,
            total_fee=total_fee,
            **validated_data
        )
        return booking


class BookingListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing bookings
    """
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    pandit_full_name = serializers.CharField(source='pandit.user.full_name', read_only=True)
    pandit_expertise = serializers.CharField(source='pandit.expertise', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration_minutes', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user_full_name', 'pandit', 'pandit_full_name', 'pandit_expertise',
            'service_name', 'service_location', 'booking_date', 'booking_time', 
            'status', 'service_fee', 'samagri_fee', 'total_fee', 'payment_status',
            'service_duration', 'created_at'
        ]
        read_only_fields = fields


class BookingDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving detailed booking information
    """
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    pandit_full_name = serializers.CharField(source='pandit.user.full_name', read_only=True)
    pandit_expertise = serializers.CharField(source='pandit.expertise', read_only=True)
    pandit_language = serializers.CharField(source='pandit.language', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    service_description = serializers.CharField(source='service.description', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user_full_name', 'user_phone', 'pandit', 'pandit_full_name', 
            'pandit_expertise', 'pandit_language',
            'service', 'service_name', 'service_duration', 'service_description',
            'service_location', 'booking_date', 'booking_time', 'status',
            'notes', 'samagri_required',
            'service_fee', 'samagri_fee', 'total_fee', 'payment_status', 'payment_method',
            'created_at', 'updated_at', 'accepted_at', 'completed_at'
        ]
        read_only_fields = fields


class BookingStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating booking status (for pandits)
    """
    status = serializers.ChoiceField(choices=['ACCEPTED', 'COMPLETED', 'CANCELLED'])
    notes = serializers.CharField(required=False, allow_blank=True)

class BookingSerializer(serializers.ModelSerializer):
    """
    Serializer used for creating, retrieving, and updating bookings.
    """
    # Read-only fields for display
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    pandit_full_name = serializers.CharField(source='pandit.user.full_name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_full_name', 'pandit', 'pandit_full_name', 
            'service_name', 'service_location', 'booking_date', 'booking_time', 
            'status', 'service_fee', 'samagri_fee', 'total_fee', 'payment_status', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'service_fee', 'samagri_fee', 'total_fee', 'payment_status', 'created_at']