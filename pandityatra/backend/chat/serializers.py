from rest_framework import serializers
from .models import ChatRoom, Message
from users.models import User
from pandits.models import Pandit


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile_pic_url']


class PanditSimpleSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Pandit
        fields = ['id', 'user', 'rating', 'expertise']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'sender', 'message_type', 'content', 'content_ne', 'file_url', 'timestamp', 'is_read']
        read_only_fields = ['timestamp', 'sender']


class ChatRoomSerializer(serializers.ModelSerializer):
    customer = UserSerializer()
    pandit = PanditSimpleSerializer()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'booking', 'customer', 'pandit', 'created_at', 'is_active', 'last_message', 'unread_count']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'content': last_msg.content,
                'timestamp': last_msg.timestamp,
                'sender': last_msg.sender.username
            }
        return None
    
    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()
