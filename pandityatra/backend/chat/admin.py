from django.contrib import admin
from .models import ChatRoom, Message


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'pandit', 'booking', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['customer__username', 'pandit__user__username']
    readonly_fields = ['created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'chat_room', 'sender', 'message_type', 'timestamp', 'is_read']
    list_filter = ['message_type', 'is_read', 'timestamp']
    search_fields = ['sender__username', 'content']
    readonly_fields = ['timestamp']
