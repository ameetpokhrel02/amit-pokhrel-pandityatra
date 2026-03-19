from rest_framework import serializers
from .models import Notification, PushNotificationToken

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
            'REVIEW_RECEIVED': 'review',
            'PANDIT_VERIFIED': 'system',
            'PANDIT_REJECTED': 'system',
            'REMINDER': 'reminder',
            'PUJA_ROOM_READY': 'puja',
            'VIDEO_CALL_INCOMING': 'booking',
            'RECORDING_READY_REVIEW': 'review',
        }
        return type_mapping.get(obj.notification_type, 'system')
    
    def get_action_url(self, obj):
        """Generate action URL based on notification type"""
        if obj.booking_id:
            if obj.notification_type in ['PUJA_ROOM_READY', 'VIDEO_CALL_INCOMING']:
                return f'/video/room/{obj.booking_id}'
            if obj.notification_type == 'RECORDING_READY_REVIEW':
                return f'/my-bookings/{obj.booking_id}?tab=recording-review'
            return '/my-bookings'
        return None


class PushTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushNotificationToken
        fields = ['id', 'token', 'device_type', 'endpoint', 'subscription', 'is_active', 'updated_at']
        read_only_fields = ['id', 'is_active', 'updated_at']

    def validate(self, attrs):
        if attrs.get('device_type') == 'web' and not attrs.get('subscription'):
            raise serializers.ValidationError({'subscription': 'Web device requires subscription payload.'})
        return attrs
