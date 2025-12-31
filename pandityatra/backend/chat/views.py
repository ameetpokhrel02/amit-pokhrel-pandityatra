from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer


class ChatRoomListView(generics.ListAPIView):
    """List all chat rooms for the current user"""
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            customer=user
        ).order_by('-created_at') | ChatRoom.objects.filter(
            pandit__user=user
        ).order_by('-created_at')


class ChatRoomDetailView(generics.RetrieveUpdateAPIView):
    """Get or update a specific chat room"""
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            customer=user
        ) | ChatRoom.objects.filter(pandit__user=user)


class MessageListView(generics.ListAPIView):
    """List all messages in a chat room"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return Message.objects.filter(chat_room_id=room_id).order_by('timestamp')
    
    def list(self, request, *args, **kwargs):
        """Mark all messages as read when fetching"""
        room_id = self.kwargs['room_id']
        user = request.user
        
        # Mark all messages as read for this user
        Message.objects.filter(
            chat_room_id=room_id
        ).exclude(sender=user).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return super().list(request, *args, **kwargs)


class MarkMessageReadView(generics.UpdateAPIView):
    """Mark a specific message as read"""
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        message = self.get_object()
        message.is_read = True
        message.read_at = timezone.now()
        message.save()
        return Response(self.get_serializer(message).data)
