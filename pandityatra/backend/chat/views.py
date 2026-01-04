from rest_framework import viewsets, generics, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from .models import ChatRoom, Message, ChatMessage
from .serializers import ChatRoomSerializer, MessageSerializer
import openai
import os
from django.conf import settings


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

class QuickChatView(APIView):
    """
    Quick Chat API for AI guide mode.
    Endpoint: POST /api/chat/
    No authentication required - transient guide mode for new users.
    
    Request body:
    {
        "message": "How to book a puja?",
        "mode": "guide"  # Optional, defaults to 'guide'
    }
    
    Response:
    {
        "response": "AI response...",
        "mode": "guide",
        "sender": "ai"
    }
    """
    permission_classes = [AllowAny]
    
    # System prompt with app knowledge
    SYSTEM_PROMPT = """You are PanditYatra's AI Assistant - a friendly guide for users of a spiritual puja booking platform.
    
    App Features You Can Help With:
    1. BOOKING PUJAS: Users can search for pandits by occasion (e.g., Bratabandha, Vivaha, etc.), select services, choose dates, add samagri (ritual items), and pay via Stripe or Khalti.
    
    2. OFFLINE KUNDALI: Users can access the "Offline Kundali" menu to generate birth charts without internet. They enter:
       - Date of Birth (DOB)
       - Time of Birth
       - Place of Birth
       This uses WebAssembly technology for fast, offline calculations.
    
    3. LIVE PUJA: During a booked puja, users can join a video room to interact with the pandit in real-time via:
       - Video (Whereby platform integration)
       - Real-time text chat (WebSocket-based)
       
    4. SAMAGRI (RITUAL ITEMS): The app suggests samagri based on the puja type. Users can:
       - View AI-recommended items
       - Add custom items
       - See costs
       
    5. AI PANDIT RECOMMENDER: The app recommends suitable pandits based on:
       - User's puja type and preferences
       - Pandit's expertise and ratings
       - Availability
       
    6. PAYMENTS: Supports:
       - Stripe (for USD/international)
       - Khalti (for NPR/Nepal)
       - Currency auto-conversion
       
    7. MY BOOKINGS: Users can view all their bookings, status, and recordings.
    
    8. REVIEWS & RATINGS: Users can review pandits after puja completion.
    
    Communication Style:
    - Be friendly, helpful, and concise
    - Use "you" to address the user
    - Explain step-by-step for complex tasks
    - If unsure, ask clarifying questions
    - Mention relevant app features when helpful
    - Support both English and Nepali (respond in user's language preference)
    
    Limitations:
    - You cannot process bookings directly - only guide users through the process
    - You cannot access user's personal data
    - For technical issues, suggest contacting support"""
    
    def post(self, request):
        """Handle chat message and return AI response"""
        try:
            message = request.data.get('message', '').strip()
            mode = request.data.get('mode', 'guide')
            user_id = request.user.id if request.user.is_authenticated else None
            
            if not message:
                return Response(
                    {'error': 'Message cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get OpenAI API key
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                return Response(
                    {'error': 'OpenAI API key not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Call OpenAI API
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": self.SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": message
                    }
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content
            
            # Save to DB only if user is authenticated and wants history
            if user_id:
                ChatMessage.objects.create(
                    user_id=user_id,
                    mode='guide',
                    sender='user',
                    content=message
                )
                ChatMessage.objects.create(
                    user_id=user_id,
                    mode='guide',
                    sender='ai',
                    content=ai_response
                )
            
            return Response({
                'response': ai_response,
                'mode': 'guide',
                'sender': 'ai',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
        
        except openai.APIError as e:
            return Response(
                {'error': f'OpenAI API error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Error processing chat: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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