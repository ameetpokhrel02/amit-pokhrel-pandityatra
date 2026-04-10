import json
import logging
import traceback
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message, ChatMessage
from django.utils import timezone
from django.db.models import Q
from notifications.services import notify_new_message

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat between customer and pandit
    """
    
    async def connect(self):
        try:
            self.room_id = self.scope['url_route']['kwargs']['room_id']
            self.room_group_name = f'chat_{self.room_id}'
            self.user = self.scope['user']
            
            if not self.user.is_authenticated:
                logger.warning(f"Chat WS REJECT: User is not authenticated. Room: {self.room_id}")
                await self.close()
                return

            # Verify access
            access_granted = await self.verify_room_access()
            if not access_granted:
                logger.warning(f"Chat WS REJECT: Access denied for User {self.user.id} to Room {self.room_id}")
                await self.close()
                return
            
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
        except Exception as e:
            logger.error(f"CRITICAL ERROR in Chat WS Connect: {str(e)}")
            logger.error(traceback.format_exc())
            await self.close()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        message_type = data.get('type', 'TEXT')
        content = data.get('content', '')
        content_ne = data.get('content_ne', None)
        
        # Check pre-booking limits
        is_allowed, reason = await self.check_pre_booking_limit()
        if not is_allowed:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': reason
            }))
            return

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
        # 🔔 Send notification to recipient
        notify_new_message(message)
        return message
    
    @database_sync_to_async
    def get_recent_messages(self):
        """Get recent messages for the chat room"""
        try:
            # OPTIMIZATION: select_related('sender') prevents N+1 crashes in WS context
            messages = Message.objects.filter(
                chat_room_id=self.room_id
            ).select_related('sender').order_by('-timestamp')[:50]
            
            return [{
                'id': msg.id,
                'sender': msg.sender.username if msg.sender else "System",
                'sender_id': msg.sender.id if msg.sender else 0,
                'content': msg.content,
                'content_ne': msg.content_ne,
                'message_type': msg.message_type,
                'timestamp': msg.timestamp.isoformat() if msg.timestamp else timezone.now().isoformat(),
                'is_read': msg.is_read
            } for msg in reversed(messages)]
        except Exception as e:
            logger.error(f"ERROR in get_recent_messages: {str(e)}")
            return []

    @database_sync_to_async
    def verify_room_access(self):
        """Verify user has access to this chat room"""
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            is_customer = room.customer_id == self.user.id
            is_pandit = bool(room.pandit_id == self.user.id)
            is_vendor = bool(room.vendor_id == self.user.id)
            return is_customer or is_pandit or is_vendor
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def check_pre_booking_limit(self):
        """Check if user has exceeded pre-booking message limit (10 msgs per 24h)"""
        try:
            chat_room = ChatRoom.objects.get(id=self.room_id)
            if not chat_room.is_pre_booking:
                return True, None
                
            # Only customers are limited, pandits can reply
            from users.models import User
            if self.user.role != 'user':
                return True, None

            # Limit to 10 messages per 24 hours
            time_limit = timezone.now() - timezone.timedelta(hours=24)
            msg_count = Message.objects.filter(
                chat_room=chat_room,
                sender=self.user,
                timestamp__gte=time_limit
            ).count()
            
            if msg_count >= 10:
                return False, "Pre-booking message limit reached (10 msgs/day). Book a puja for unlimited chat!"
            
            return True, None
        except ChatRoom.DoesNotExist:
            return False, "Room not found"


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

class PujaConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat during puja (interaction mode).
    Endpoint: /ws/puja/<booking_id>/
    
    Handles:
    - Real-time messaging between customer and pandit during live puja
    - Message persistence to ChatMessage model
    - Broadcasting to group (customer + pandit)
    """
    
    async def connect(self):
        try:
            self.booking_id = self.scope['url_route']['kwargs']['booking_id']
            self.room_group_name = f'puja_{self.booking_id}'
            self.user = self.scope['user']
            
            # Verify user has access to this booking (customer or pandit)
            has_access = await self.verify_booking_access()
            if not has_access:
                logger.warning(f"Puja WS REJECT: Access denied. User {self.user.id} to Booking {self.booking_id}")
                await self.close()
                return
            
            # Join puja room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Send recent messages on connect
            messages = await self.get_recent_messages()
            await self.send(text_data=json.dumps({
                'type': 'message_history',
                'messages': messages,
                'mode': 'interaction'
            }))
            
            # Send join notification
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'username': self.user.username,
                    'user_id': self.user.id
                }
            )
        except Exception as e:
            logger.error(f"CRITICAL ERROR in Puja WS Connect: {str(e)}")
            logger.error(traceback.format_exc())
            await self.close()
    
    async def disconnect(self, close_code):
        # Send leave notification
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_leave',
                'username': self.user.username,
                'user_id': self.user.id
            }
        )
        
        # Leave puja room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket and broadcast to group"""
        try:
            data = json.loads(text_data)
            content = data.get('content', '').strip()
            content_ne = data.get('content_ne', None)  # Nepali translation
            message_type = data.get('message_type', 'TEXT')
            
            if not content:
                await self.send(text_data=json.dumps({
                    'error': 'Message cannot be empty'
                }))
                return
            
            # Save message to database
            message = await self.save_message(content, content_ne, message_type)
            
            # Broadcast to puja room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'puja_message',
                    'message': {
                        'id': message.id,
                        'sender': self.user.username,
                        'sender_id': self.user.id,
                        'content': message.content,
                        'content_ne': message.content_ne,
                        'message_type': message.message_type,
                        'timestamp': message.timestamp.isoformat(),
                    }
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'error': f'Error processing message: {str(e)}'
            }))
    
    async def puja_message(self, event):
        """Receive message from room group and send to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': event['message']
        }))
    
    async def user_join(self, event):
        """Send join notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'username': event['username'],
            'user_id': event['user_id']
        }))
    
    async def user_leave(self, event):
        """Send leave notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'username': event['username'],
            'user_id': event['user_id']
        }))
    
    @database_sync_to_async
    def verify_booking_access(self):
        """Verify user has access to this booking"""
        from bookings.models import Booking
        try:
            booking = Booking.objects.get(id=self.booking_id)
            # Check if user is customer or pandit for this booking
            is_customer = booking.customer_id == self.user.id
            is_pandit = booking.pandit_id == self.user.id
            return is_customer or is_pandit
        except Booking.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content, content_ne, message_type):
        """Save message to ChatMessage model"""
        message = ChatMessage.objects.create(
            user=self.user,
            mode='interaction',
            sender='user' if self.user.is_customer else 'pandit',  # Simplified - should check actual role
            content=content,
            content_ne=content_ne,
            booking_id=self.booking_id,
            timestamp=timezone.now()
        )
        return message
    
    @database_sync_to_async
    def get_recent_messages(self):
        """Get recent messages for this puja"""
        try:
            messages = ChatMessage.objects.filter(
                booking_id=self.booking_id,
                mode='interaction'
            ).select_related('user').order_by('-timestamp')[:50]
            
            return [{
                'id': msg.id,
                'sender': msg.sender,
                'sender_id': msg.user_id,
                'content': msg.content,
                'content_ne': msg.content_ne,
                'message_type': 'TEXT',
                'timestamp': msg.timestamp.isoformat() if msg.timestamp else timezone.now().isoformat(),
            } for msg in reversed(messages)]
        except Exception as e:
            logger.error(f"ERROR in Puja get_recent_messages: {str(e)}")
            return []