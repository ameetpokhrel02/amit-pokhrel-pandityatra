from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'title_ne', 
            'message', 'message_ne', 'booking', 'is_read', 
            'read_at', 'created_at', 'user_timezone'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
