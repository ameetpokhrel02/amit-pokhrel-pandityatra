# bookings/serializers.py

from rest_framework import serializers
from .models import Booking, BookingStatus, LocationChoices
from services.models import Puja
from pandits.models import PanditUser

class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new bookings
    """
    service_name = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'pandit', 'service', 'service_name', 'service_location', 
            'booking_date', 'booking_time', 'notes', 'samagri_required',
            'customer_timezone', 'customer_location', 'status', 'user'
        ]
        read_only_fields = ['id', 'user']
    
    def validate(self, data):
        """Validate booking doesn't conflict with existing bookings"""
        pandit = data.get('pandit')
        booking_date = data.get('booking_date')
        booking_time = data.get('booking_time')
        
        # Check if date is in the past
        import datetime
        if booking_date < datetime.date.today():
            raise serializers.ValidationError(
                "Booking date cannot be in the past"
            )

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
        # Get user and status passed from perform_create
        user = validated_data.pop('user', self.context['request'].user)
        status = validated_data.pop('status', BookingStatus.PENDING)
        # Calculate fees and set service name
        service = validated_data.get('service')
        service_name = validated_data.get('service_name')
        if not service_name and service:
            service_name = service.name
            
        service_fee = service.base_price if service else 0
        samagri_fee = 500 if validated_data.get('samagri_required', True) else 0
        total_fee = service_fee + samagri_fee
        
        # Pop service_name from validated_data to avoid duplicate argument error in create()
        validated_data.pop('service_name', None)
        
        booking = Booking.objects.create(
            user=user,
            status=status,
            service_name=service_name,
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
    pandit_full_name = serializers.CharField(source='pandit.full_name', read_only=True)
    pandit_expertise = serializers.CharField(source='pandit.expertise', read_only=True)
    pandit_id = serializers.IntegerField(source='pandit.id', read_only=True)
    service_duration = serializers.IntegerField(source='service.base_duration_minutes', read_only=True)
    service_image = serializers.SerializerMethodField()
    is_reviewed = serializers.SerializerMethodField()

    def get_is_reviewed(self, obj):
        return hasattr(obj, 'review')

    def get_service_image(self, obj):
        request = self.context.get('request')
        image_url = None
        
        if obj.service:
            if obj.service.image:
                image_url = obj.service.image.url
            elif obj.service.category and obj.service.category.image:
                image_url = obj.service.category.image.url
        
        if image_url:
            if request:
                return request.build_absolute_uri(image_url)
            return image_url
        return None

    class Meta:
        model = Booking
        fields = [
            'id', 'user_full_name', 'pandit', 'pandit_full_name', 'pandit_expertise', 'pandit_id',
            'service_name', 'service_location', 'booking_date', 'booking_time',
            'status', 'service_fee', 'samagri_fee', 'total_fee', 'payment_status',
            'payment_method', 'transaction_id',
            'service_duration', 'service_image', 'created_at', 'is_reviewed',
            'daily_room_url', 'video_room_url', 'recording_url', 'recording_available'
        ]
        read_only_fields = fields


class BookingDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving detailed booking information
    """
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    pandit_full_name = serializers.CharField(source='pandit.full_name', read_only=True)
    pandit_expertise = serializers.CharField(source='pandit.expertise', read_only=True)
    pandit_language = serializers.CharField(source='pandit.language', read_only=True)
    service_duration = serializers.IntegerField(source='service.base_duration_minutes', read_only=True)
    service_description = serializers.CharField(source='service.description', read_only=True)
    service_image = serializers.SerializerMethodField()
    chat_room_id = serializers.SerializerMethodField()
    is_reviewed = serializers.SerializerMethodField()

    def get_is_reviewed(self, obj):
        return hasattr(obj, 'review')

    def get_chat_room_id(self, obj):
        # 1. Check if room is directly linked to this booking
        if hasattr(obj, 'chat_room'):
            return obj.chat_room.id
        
        # 2. Fallback: Search for an inquiry room between these two people
        from chat.models import ChatRoom
        room = ChatRoom.objects.filter(
            customer=obj.user,
            pandit=obj.pandit,
            is_pre_booking=True
        ).first()
        return room.id if room else None

    def get_service_image(self, obj):
        request = self.context.get('request')
        image_url = None
        if obj.service:
            if obj.service.image:
                image_url = obj.service.image.url
            elif obj.service.category and obj.service.category.image:
                image_url = obj.service.category.image.url
        
        if image_url:
            if request:
                return request.build_absolute_uri(image_url)
            return image_url
        return None

    class Meta:
        model = Booking
        fields = [
            'id', 'user_full_name', 'user_phone', 'pandit', 'pandit_full_name', 
            'pandit_expertise', 'pandit_language',
            'service', 'service_name', 'service_duration', 'service_description', 'service_image',
            'service_location', 'booking_date', 'booking_time', 'status',
            'notes', 'samagri_required',
            'service_fee', 'samagri_fee', 'total_fee', 'payment_status', 'payment_method',
            'customer_timezone', 'customer_location',
            'created_at', 'updated_at', 'accepted_at', 'completed_at', 'is_reviewed',
            'chat_room_id',
            'daily_room_url', 'daily_room_name', 'video_room_url', 'recording_url', 'recording_available'
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
    pandit_full_name = serializers.CharField(source='pandit.full_name', read_only=True)
    service_image = serializers.SerializerMethodField()
    is_reviewed = serializers.SerializerMethodField()

    def get_is_reviewed(self, obj):
        return hasattr(obj, 'review')

    def get_service_image(self, obj):
        request = self.context.get('request')
        image_url = None
        if obj.service:
            if obj.service.image:
                image_url = obj.service.image.url
            elif obj.service.category and obj.service.category.image:
                image_url = obj.service.category.image.url
        
        if image_url:
            if request:
                return request.build_absolute_uri(image_url)
            return image_url
        return None

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_full_name', 'pandit', 'pandit_full_name', 
            'service_name', 'service_image', 'service_location', 'booking_date', 'booking_time', 
            'status', 'service_fee', 'samagri_fee', 'total_fee', 'payment_status', 'created_at', 'is_reviewed',
            'daily_room_url', 'video_room_url', 'recording_url', 'recording_available'
        ]
        read_only_fields = ['id', 'user', 'status', 'service_fee', 'samagri_fee', 'total_fee', 'payment_status', 'created_at']