from rest_framework import serializers
from .models import ChatRoom, Message, ChatMessage
from users.models import User
from pandits.models import PanditUser
from vendors.models import Vendor


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile_pic']


class PanditSimpleSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = PanditUser
        fields = ['id', 'user', 'full_name', 'rating', 'expertise']
        
    def get_user(self, obj):
        request = self.context.get('request')
        profile_pic = obj.profile_pic.url if obj.profile_pic else None
        if profile_pic and request:
            profile_pic = request.build_absolute_uri(profile_pic)

        return {
            'id': obj.id,
            'username': obj.username,
            'full_name': obj.full_name,
            'profile_pic': profile_pic,
            'profile_picture': profile_pic,
        }


class VendorSimpleSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = ['id', 'user', 'full_name', 'shop_name']
        
    def get_user(self, obj):
        request = self.context.get('request')
        profile_pic = obj.profile_pic.url if obj.profile_pic else None
        if profile_pic and request:
            profile_pic = request.build_absolute_uri(profile_pic)

        return {
            'id': obj.id,
            'username': obj.username,
            'full_name': obj.shop_name, # Vendors show shop name as identity
            'profile_pic': profile_pic,
            'profile_picture': profile_pic,
        }


class MessageSerializer(serializers.ModelSerializer):
    sender_obj = UserSerializer(source='sender', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender = serializers.SerializerMethodField()  # Returns 'user' or 'pandit'
    
    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'sender', 'sender_obj', 'sender_name', 'message_type', 'content', 'content_ne', 'file_url', 'timestamp', 'is_read']
        read_only_fields = ['timestamp']
    
    def get_sender(self, obj):
        """Determine if sender is customer, pandit, or vendor"""
        if obj.chat_room and obj.chat_room.pandit and obj.sender.id == obj.chat_room.pandit.id:
            return 'pandit'
        if obj.chat_room and obj.chat_room.vendor and obj.sender.id == obj.chat_room.vendor.id:
            return 'vendor'
        return 'user'
    
    def get_sender_name(self, obj):
        return obj.sender.full_name if obj.sender else 'Unknown'


class ChatRoomSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    pandit = PanditSimpleSerializer(read_only=True)
    vendor = VendorSimpleSerializer(read_only=True)
    user = serializers.SerializerMethodField()  # For service provider view - shows customer as 'user'
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'booking', 'order', 'customer', 'pandit', 'vendor', 'user', 'created_at', 'is_active', 'is_pre_booking', 'last_message', 'last_message_time', 'unread_count']
    
    def get_user(self, obj):
        """Return customer info as 'user' field for pandit's view"""
        if obj.customer:
            request = self.context.get('request')
            profile_pic = obj.customer.profile_pic.url if obj.customer.profile_pic else None
            if profile_pic and request:
                profile_pic = request.build_absolute_uri(profile_pic)

            return {
                'id': obj.customer.id,
                'full_name': obj.customer.full_name,
                'profile_pic': profile_pic,
                'profile_picture': profile_pic,
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