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
                        "description": "Search for physical puja items/products (like books, agarbatti, diya) when a user wants to BUY something.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The item name or category (e.g., 'book', 'agarbatti')."
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
                        "description": "Used ONLY when a user wants to RESERVE/HIRE a pandit for a ritual (e.g., 'book a pandit for wedding'). DO NOT use this for physical books.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "location": {"type": "string"},
                                "ritual": {"type": "string"}
                            }
                        }
                    }
                }
            ]

            messages = [
                {"role": "system", "content": """
                You are the 'PanditYatra Divine Guide'. 
                
                CRITICAL INSTRUCTION:
                Distinguish between 'booking' a service (Puja ceremony) and 'buying' a physical item (e.g., a Book, Agarbatti, Diya). 
                - If the user needs a PHYSICAL ITEM (like a book or incense), use 'search_samagri'.
                - If the user wants to HIRE A PANDIT for a ceremony, use 'book_pandit'.
                
                Tone: Peaceful, spiritual, and professional (Namaste/🙏). 
                Encourage users to add products directly to their cart when search results are found.
                """},
                {"role": "user", "content": message}
            ]

            # First Pass: Check for tools
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                tools=tools,
                tool_choice="auto",
                max_tokens=300
            )

            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            products_data = []

            if tool_calls:
                messages.append(response_message)
                
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    if function_name == "search_samagri":
                        query = function_args.get("query", "")
                        # Robust Search: Try exact, then word split
                        items = SamagriItem.objects.filter(
                            Q(name__icontains=query) | 
                            Q(category__name__icontains=query) |
                            Q(description__icontains=query),
                            is_active=True
                        )[:3]
                        
                        if not items.exists() and len(query) > 3:
                            # Fallback: split words if query is long
                            words = query.split()
                            q_objects = Q()
                            for word in words:
                                if len(word) > 2:
                                    q_objects |= Q(name__icontains=word)
                            items = SamagriItem.objects.filter(q_objects, is_active=True)[:3]

                        results_summary = "No items found."
                        if items.exists():
                            results_summary = f"Found {items.count()} matching items: " + ", ".join([i.name for i in items])
                            for item in items:
                                products_data.append({
                                    "id": item.id,
                                    "name": item.name,
                                    "price": float(item.price),
                                    "image": request.build_absolute_uri(item.image.url) if item.image else None
                                })
                        
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": results_summary,
                        })

                    elif function_name == "book_pandit":
                        loc = function_args.get("location", "anywhere")
                        rit = function_args.get("ritual", "a puja")
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": f"The user must go to 'Find Pandit' to book for {rit} in {loc} manually.",
                        })

                # Second Pass: Natural Response
                final_response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=messages,
                )
                reply = final_response.choices[0].message.content
            else:
                reply = response_message.content

            # Final Cleanup: Remove any raw tool call tags leaked into the text (leaks sometimes occur in Llama 3)
            if reply:
                import re
                reply = re.sub(r'<function.*?>.*?</function>', '', reply, flags=re.DOTALL).strip()
                # Also remove lingering thought-style tags if any
                reply = re.sub(r'<thought.*?>.*?</thought>', '', reply, flags=re.DOTALL).strip()

            # Save History
            if request.user.is_authenticated:
                ChatMessage.objects.create(user=request.user, mode='guide', sender='user', content=message)
                ChatMessage.objects.create(user=request.user, mode='guide', sender='ai', content=reply)

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