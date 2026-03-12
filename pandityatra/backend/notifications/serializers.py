from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    action_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'type', 'title', 'title_ne', 
            'message', 'message_ne', 'booking', 'is_read', 
            'read_at', 'created_at', 'user_timezone', 'action_url'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
    
    def get_type(self, obj):
        """Map notification_type to frontend type categories"""
        type_mapping = {
            'BOOKING_CREATED': 'booking',
            'BOOKING_ACCEPTED': 'booking',
            'BOOKING_COMPLETED': 'booking',
            'BOOKING_CANCELLED': 'booking',
            'PAYMENT_SUCCESS': 'payment',
            'PAYMENT_FAILED': 'payment',
            'NEW_MESSAGE': 'message',
            'REVIEW_RECEIVED': 'system',
            'PANDIT_VERIFIED': 'system',
            'PANDIT_REJECTED': 'system',
            'REMINDER': 'reminder',
            'PUJA_ROOM_READY': 'puja',
        }
        return type_mapping.get(obj.notification_type, 'system')
    
    def get_action_url(self, obj):
        """Generate action URL based on notification type"""
        if obj.booking_id:
            return f'/my-bookings'
        return None
