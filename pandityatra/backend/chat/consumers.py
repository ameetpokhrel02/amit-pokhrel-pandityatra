import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat between customer and pandit
    """
    
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send recent messages on connect
        messages = await self.get_recent_messages()
        await self.send(text_data=json.dumps({
            'type': 'message_history',
            'messages': messages
        }))
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.dumps(text_data)
        message_type = data.get('type', 'TEXT')
        content = data.get('content', '')
        content_ne = data.get('content_ne', None)  # Nepali translation
        
        # Save message to database
        message = await self.save_message(content, content_ne, message_type)
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message.id,
                    'sender': message.sender.username,
                    'sender_id': message.sender.id,
                    'content': message.content,
                    'content_ne': message.content_ne,
                    'message_type': message.message_type,
                    'timestamp': message.timestamp.isoformat(),
                    'is_read': message.is_read
                }
            }
        )
    
    async def chat_message(self, event):
        """Receive message from room group and send to WebSocket"""
        await self.send(text_data=json.dumps(event['message']))
    
    @database_sync_to_async
    def save_message(self, content, content_ne, message_type):
        """Save message to database"""
        chat_room = ChatRoom.objects.get(id=self.room_id)
        message = Message.objects.create(
            chat_room=chat_room,
            sender=self.user,
            content=content,
            content_ne=content_ne,
            message_type=message_type
        )
        return message
    
    @database_sync_to_async
    def get_recent_messages(self):
        """Get recent messages for the chat room"""
        messages = Message.objects.filter(
            chat_room_id=self.room_id
        ).order_by('-timestamp')[:50]
        
        return [{
            'id': msg.id,
            'sender': msg.sender.username,
            'sender_id': msg.sender.id,
            'content': msg.content,
            'content_ne': msg.content_ne,
            'message_type': msg.message_type,
            'timestamp': msg.timestamp.isoformat(),
            'is_read': msg.is_read
        } for msg in reversed(messages)]


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    """
    
    async def connect(self):
        self.user = self.scope['user']
        self.room_group_name = f'notifications_{self.user.id}'
        
        # Join notification group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave notification group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps(event['notification']))
