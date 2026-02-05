from rest_framework import viewsets, generics, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from .models import ChatRoom, Message, ChatMessage
from .serializers import ChatRoomSerializer, MessageSerializer
import os
from django.conf import settings
from groq import Groq


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

class QuickGuideChat(APIView):
    """
    Quick Guide Chatbot using Groq AI.
    Goal: Floating AI helper that answers “How to use the app?”
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            message = request.data.get('message')
            if not message:
                return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

            client = Groq(api_key=settings.GROQ_API_KEY)

            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": """
                    You are the 'PanditYatra Divine Guide', a high-fidelity AI expert in Vedic rituals, Shastras, and our app's ecosystem.
                    
                    Vedic Knowledge Base:
                    - Pujas: Satyanarayan Puja (for prosperity), Ganesh Puja (new beginnings), Rudrabhishek (Lord Shiva), Bratabandha (sacred thread), Vivah (wedding).
                    - Astrology: Kundali matchmaking (Guna Milan), Manglik analysis, Dashas, and Yogas.
                    - Ritual Essentials: Sankalpa (intention), Aachaman (purification), Samagri (Puja materials like Kusha, Tila, Akshata, Belpatra).
                    
                    App Features to Explain:
                    - Booking: Search by location (Kathmandu, Pokhara, etc.) or ritual.
                    - Interface: Live Video Room for remote pujas, Real-time Chat with Pandits.
                    - Kundali: Generate PDF charts by providing Date/Time/Place of birth.
                    - Shop: Buy ritual-purity guaranteed Samagri items.
                    
                    Robustness & Persona:
                    - LANGUAGE: Detect user language. If English, stay in English. If Nepali (Unicode/Romanized), respond in Nepali. 
                    - SCOPE: Only answer questions related to Vedic culture, rituals, astrology, or app usage. 
                    - OFF-TOPIC: If asked something unrelated (e.g., politics, coding), politely redirect: "I am here to guide your spiritual journey. How can I assist with your puja today?"
                    - TONE: Respectful, serene, and professional (Namaste/Pranam).
                    - BREVITY: Keep answers concise (max 2-3 short paragraphs).
                    """},
                    {"role": "user", "content": message}
                ],
                model="llama-3.1-8b-instant",  # fast & cheap on Groq
                temperature=0.7,
                max_tokens=300
            )

            reply = chat_completion.choices[0].message.content

            # Save to DB if user is authenticated
            if request.user.is_authenticated:
                ChatMessage.objects.create(
                    user=request.user,
                    mode='guide',
                    sender='user',
                    content=message
                )
                ChatMessage.objects.create(
                    user=request.user,
                    mode='guide',
                    sender='ai',
                    content=reply
                )

            return Response({"reply": reply, "response": reply}) # compatible with both old and new frontend names
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuickChatView(APIView):
    """
    Consolidated Quick Chat API using Groq AI.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        return QuickGuideChat().post(request)


class GuideHistoryView(generics.ListAPIView):
    """
    Get guide mode chat history for authenticated user.
    Endpoint: GET /api/chat/history/
    """
    serializer_class = MessageSerializer  # Will create ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatMessage.objects.filter(
            user=self.request.user,
            mode='guide'
        ).order_by('timestamp')