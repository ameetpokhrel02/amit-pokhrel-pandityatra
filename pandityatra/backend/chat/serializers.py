from rest_framework import serializers
from .models import ChatRoom, Message, ChatMessage
from users.models import User
from pandits.models import Pandit


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile_pic']


class PanditSimpleSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Pandit
        fields = ['id', 'user', 'rating', 'expertise']


class MessageSerializer(serializers.ModelSerializer):
    sender_obj = UserSerializer(source='sender', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender = serializers.SerializerMethodField()  # Returns 'user' or 'pandit'
    
    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'sender', 'sender_obj', 'sender_name', 'message_type', 'content', 'content_ne', 'file_url', 'timestamp', 'is_read']
        read_only_fields = ['timestamp']
    
    def get_sender(self, obj):
        """Determine if sender is customer or pandit"""
        if obj.chat_room and obj.chat_room.pandit and obj.sender.id == obj.chat_room.pandit.user.id:
            return 'pandit'
        return 'user'
    
    def get_sender_name(self, obj):
        return obj.sender.full_name if obj.sender else 'Unknown'


class ChatRoomSerializer(serializers.ModelSerializer):
    customer = UserSerializer()
    pandit = PanditSimpleSerializer()
    user = serializers.SerializerMethodField()  # For pandit view - shows customer as 'user'
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'booking', 'customer', 'pandit', 'user', 'created_at', 'is_active', 'is_pre_booking', 'last_message', 'last_message_time', 'unread_count']
    
    def get_user(self, obj):
        """Return customer info as 'user' field for pandit's view"""
        if obj.customer:
            return {
                'id': obj.customer.id,
                'full_name': obj.customer.full_name,
                'profile_picture': obj.customer.profile_pic.url if obj.customer.profile_pic else None
            }
        return None
    
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return last_msg.content
        return None
    
    def get_last_message_time(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return last_msg.timestamp
        return None
    
    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for guide mode messages (ChatMessage model)
    """
    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'mode', 'sender', 'content', 'content_ne', 'booking', 'pandit', 'timestamp', 'is_read']
        read_only_fields = ['timestamp', 'user']