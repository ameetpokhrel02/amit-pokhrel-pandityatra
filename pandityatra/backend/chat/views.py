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
import json
from django.db.models import Q
from samagri.models import SamagriItem

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

            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "search_samagri",
                        "description": "Search the database for Samagri (puja items/products) when a user asks to buy or needs an item.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The name of the item to search for (e.g., 'agarbatti', 'diya', 'kapur')."
                                }
                            },
                            "required": ["query"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "book_pandit",
                        "description": "Handle requests to book a pandit for a location and ritual.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "location": {
                                    "type": "string",
                                    "description": "The location for the puja (e.g., 'Kathmandu')."
                                },
                                "ritual": {
                                    "type": "string",
                                    "description": "The type of ritual (e.g., 'Rudrabhishek')."
                                }
                            }
                        }
                    }
                }
            ]

            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": """
                    You are the 'PanditYatra Divine Guide', a high-fidelity AI expert in Vedic rituals, Shastras, and our app's ecosystem.
                    
                    MISSION:
                    Your goal is to be a spiritual companion and a platform tutor. If a user asks a spiritual question, answer it, then pivot to how PanditYatra can help (e.g., 'To perform this ritual, you can book a verified Pandit here...').
                    
                    Vedic Knowledge Base:
                    - Pujas: Satyanarayan Puja (for prosperity), Ganesh Puja (new beginnings), Rudrabhishek (Lord Shiva), Bratabandha (sacred thread), Vivah (wedding).
                    - Astrology: Kundali matchmaking (Guna Milan), Manglik analysis, Dashas, and Yogas.
                    - Ritual Essentials: Sankalpa (intention), Aachaman (purification), Samagri (Puja materials like Kusha, Tila, Akshata, Belpatra).
                    
                    App Features (Teach these step-by-step):
                    - Booking a Pandit: Go to 'Find Pandit', select a ritual or location, and choose a verified professional.
                    - Remote Puja: Mention our 'Live Video Room' for users abroad.
                    - Kundali Service: Users can generate a detailed PDF by providing their birth details (Date, Time, Place).
                    - Samagri Shopping: Use the 'search_samagri' tool whenever they need physical items. Tell them they can add items directly to their cart from this chat!
                    
                    Robustness & Persona:
                    - PROACTIVE: Always end with a helpful 'did you know?' about an app feature if relevant.
                    - LANGUAGE: Respond in the user's language (Nepali, Romanized Nepali, or English).
                    - SCOPE: Vedic culture, rituals, astrology, and PanditYatra app help.
                    - TONE: Peaceful, professional, and spiritual (Namaste/🙏).
                    - BREVITY: Concise, bulleted steps are preferred.
                    """},
                    {"role": "user", "content": message}
                ],
                model="llama-3.1-8b-instant",  # fast & cheap on Groq
                temperature=0.7,
                max_tokens=300,
                tools=tools,
                tool_choice="auto"
            )

            ai_message = chat_completion.choices[0].message
            reply = ai_message.content or ""
            products_data = []

            # Process tool calls if AI decided to call tools
            if ai_message.tool_calls:
                for tool_call in ai_message.tool_calls:
                    if tool_call.function.name == "search_samagri":
                        args = json.loads(tool_call.function.arguments)
                        query = args.get("query", "")
                        
                        # Better search: check name OR category name OR description
                        items = SamagriItem.objects.filter(
                            Q(name__icontains=query) | 
                            Q(category__name__icontains=query) |
                            Q(description__icontains=query),
                            is_active=True
                        )[:3]
                        
                        if items.exists():
                            if not reply:
                                reply = f"Namaste! I found these {query} items that might be perfect for your puja:"
                            for item in items:
                                products_data.append({
                                    "id": item.id,
                                    "name": item.name,
                                    "price": float(item.price),
                                    "image": request.build_absolute_uri(item.image.url) if item.image else None
                                })
                        else:
                            # If no specific item found, maybe suggest the category or a general message
                            if not reply:
                                reply = f"I'm sorry, I couldn't find any items matching '{query}' in our store right now. 🙏 Please browse our 'Shop' section for our full collection of ritual essentials."
                    
                    elif tool_call.function.name == "book_pandit":
                        args = json.loads(tool_call.function.arguments)
                        location = args.get("location", "your location")
                        ritual = args.get("ritual", "your puja")
                        reply = f"To book a pandit for {ritual} in {location}, please navigate to the 'Find Pandit' section in our app to see available verified Pandits! 🙏"

            # Save to DB if user is authenticated (saves only text)
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

            return Response({"reply": reply, "response": reply, "products": products_data}) 
        except Exception as e:
            import traceback
            traceback.print_exc()
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