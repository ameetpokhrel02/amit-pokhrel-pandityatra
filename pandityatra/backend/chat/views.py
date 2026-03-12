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
from bookings.models import Booking, BookingStatus
from notifications.services import notify_new_message

class ChatRoomListView(generics.ListAPIView):
    """List all chat rooms for the current user"""
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # For customers, show rooms they are part of
        # For pandits (via user link), show rooms they are part of
        return ChatRoom.objects.filter(
            Q(customer=user) | Q(pandit__user=user)
        ).distinct().order_by('-created_at')


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


class MessageListView(generics.ListCreateAPIView):
    """List all messages in a chat room or send a new message"""
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
    
    def create(self, request, *args, **kwargs):
        """Send a new message to the chat room"""
        room_id = self.kwargs['room_id']
        user = request.user
        
        try:
            chat_room = ChatRoom.objects.get(id=room_id)
            
            # Verify user has access to this room
            is_customer = chat_room.customer_id == user.id
            is_pandit = chat_room.pandit.user_id == user.id
            
            if not (is_customer or is_pandit):
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Create the message
            message = Message.objects.create(
                chat_room=chat_room,
                sender=user,
                content=request.data.get('content', ''),
                message_type=request.data.get('message_type', 'TEXT')
            )
            
            # 🔔 Send notification to the recipient
            notify_new_message(message)
            
            serializer = self.get_serializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Chat room not found'}, status=status.HTTP_404_NOT_FOUND)


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

            # Booking Context Injection
            booking_context = ""
            if request.user.is_authenticated:
                active_bookings = Booking.objects.filter(
                    user=request.user, 
                    status__in=[BookingStatus.ACCEPTED, BookingStatus.PENDING]
                ).select_related('pandit__user')
                
                if active_bookings.exists():
                    booking_info = []
                    for b in active_bookings:
                        booking_info.append(f"Booking ID {b.id}: {b.service_name} with Pandit {b.pandit.user.full_name} on {b.booking_date}")
                    booking_context = "\nACTIVE USER BOOKINGS:\n" + "\n".join(booking_info) + "\nNote: If a user asks about their puja, suggest switching to the real-time chat mode using their Booking ID."

            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "search_samagri",
                        "description": "Search for physical puja items/products (like books, agarbatti, diya) when a user wants to BUY or FIND something.",
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
                        "name": "add_to_cart",
                        "description": "Used when a user explicitly asks to BUY or ADD an item to their cart.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "item_name": {
                                    "type": "string",
                                    "description": "The name of the item to add to cart."
                                },
                                "quantity": {
                                    "type": "integer",
                                    "default": 1
                                }
                            },
                            "required": ["item_name"]
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
                },
                {
                    "type": "function",
                    "function": {
                        "name": "suggest_real_time_chat",
                        "description": "Used when the user asks about their booking or needs to speak to their Pandit. Provides a switch to the real-time chat window.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "booking_id": {"type": "string"},
                                "pandit_name": {"type": "string"}
                            },
                            "required": ["booking_id"]
                        }
                    }
                }
            ]
            
            # Get active booking context if user is authenticated
            booking_context = ""
            if request.user.is_authenticated:
                active_booking = Booking.objects.filter(
                    user=request.user, 
                    status__in=[BookingStatus.ACCEPTED, BookingStatus.PENDING]
                ).first()
                if active_booking:
                    service_name = active_booking.service.name if active_booking.service else active_booking.service_name
                    pandit_name = active_booking.pandit.user.full_name if active_booking.pandit.user.full_name else active_booking.pandit.user.username
                    booking_context = f"The user has an ACTIVE BOOKING (ID: {active_booking.id}) for {service_name} with Pandit {pandit_name}. Mention this if relevant."

            PANDITYATRA_KNOWLEDGE = """
            SITE NAVIGATION & FEATURES (How to use PanditYatra):
            1. Find Pandits: Click 'Find Pandits' in the menu to search and book professional Pandits for any ritual.
            2. Puja Categories: Browse 'Puja Categories' to see different types of ceremonies (e.g., Wedding, Satyanarayan, Graha Pravesh).
            3. Kundali: Use our 'Kundali' feature for life-long horoscope generation (100% offline, privacy-first).
            4. Shop: Visit the 'Shop' to buy Samagri (ritual items) and Books.
            5. Appointments: Management of bookings is done via the User Dashboard.
            6. Cart: Users can add items to their cart and checkout using Khalti or Stripe.
            7. Live Video Puja: We support live video rituals for global connectivity.
            """

            messages = [
                {"role": "system", "content": f"""
                You are the 'PanditYatra Divine Guide' - a knowledgeable spiritual assistant.
                
                SITE KNOWLEDGE:
                {PANDITYATRA_KNOWLEDGE}
                
                STRICT RULES:
                1. PRODUCT SEARCH: For ANY request about a product, item, book, or samagri (e.g., 'laddu', 'agarbatti', 'bhagavad gita'), you MUST call 'search_samagri'.
                2. NO HALLUCINATIONS: NEVER suggest or describe a product unless it appears in the 'search_samagri' tool output. If the tool returns nothing, say: "I couldn't find [item] in our shop. Would you like me to find an alternative?"
                3. SERVICE VS PRODUCT: 
                   - 'HIRE/RESERVE PANDIT' -> use 'book_pandit'.
                   - 'BUY/NEED ITEM' -> use 'search_samagri'.
                4. ADD TO CART: When you find an item the user wants, use 'add_to_cart' to simplify their journey.
                
                {booking_context}
                
                Tone: Peaceful, spiritual, and welcoming (Namaste/🙏). 
                If asked "How to use this site", explain the features listed in SITE KNOWLEDGE.
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
            actions_data = []

            if tool_calls:
                messages.append(response_message)
                
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    if function_name == "search_samagri":
                        query = function_args.get("query", "")
                        # Enhanced search with better fallback
                        items = SamagriItem.objects.filter(
                            Q(name__icontains=query) | 
                            Q(category__name__icontains=query) |
                            Q(description__icontains=query),
                            is_active=True
                        ).distinct()[:3]
                        
                        # Fallback: if no results, try splitting into words or searching by first 3 chars
                        if not items.exists() and len(query) >= 3:
                            words = query.split()
                            q_objects = Q()
                            for word in words:
                                if len(word) >= 3:
                                    # Try name, category, and description with each word
                                    q_objects |= Q(name__icontains=word)
                                    q_objects |= Q(category__name__icontains=word)
                            
                            # Also try a very fuzzy check for the first few letters
                            if not q_objects:
                                q_objects = Q(name__icontains=query[:3])
                                
                            items = SamagriItem.objects.filter(q_objects, is_active=True).distinct()[:3]

                        results_summary = "No items found in the current inventory."
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

                    elif function_name == "add_to_cart":
                        item_name = function_args.get("item_name", "")
                        qty = function_args.get("quantity", 1)
                        # Find the best match to add
                        item = SamagriItem.objects.filter(Q(name__icontains=item_name), is_active=True).first()
                        if item:
                            actions_data.append({
                                "type": "ADD_TO_CART",
                                "product": {
                                    "id": item.id,
                                    "title": item.name,
                                    "price": float(item.price),
                                    "image": request.build_absolute_uri(item.image.url) if item.image else None
                                },
                                "quantity": qty
                            })
                            content = f"Added {qty} of {item.name} to the user's reactive cart."
                        else:
                            content = "Item not found to add to cart."
                        
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": content,
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

                    elif function_name == "suggest_real_time_chat":
                        bid = function_args.get("booking_id")
                        pname = function_args.get("pandit_name", "your Pandit")
                        actions_data.append({
                            "type": "SWITCH_MODE",
                            "bookingId": bid,
                            "panditName": pname
                        })
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": f"Offered the user to switch to real-time chat for booking {bid}.",
                        })

                # Second Pass: Natural Response
                final_response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=messages,
                )
                reply = final_response.choices[0].message.content
            else:
                reply = response_message.content

            # Final Cleanup - Remove ALL function-like tags
            if reply:
                import re
                # Remove <function=xyz>{...}</function> patterns (various formats)
                reply = re.sub(r'<function[^>]*>.*?</function>', '', reply, flags=re.DOTALL).strip()
                reply = re.sub(r',?function[=:][a-z_]+[>}]\s*\{[^}]*\}\s*<?\/function>?', '', reply, flags=re.DOTALL | re.IGNORECASE).strip()
                # Remove <thought>...</thought> patterns
                reply = re.sub(r'<thought[^>]*>.*?</thought>', '', reply, flags=re.DOTALL).strip()
                # Remove <suggest_real_time_chat>...</suggest_real_time_chat> and similar
                reply = re.sub(r'<[a-z_]+>\s*\{.*?\}\s*</[a-z_]+>', '', reply, flags=re.DOTALL).strip()
                # Remove any remaining function call syntax like <function=add_to_cart>...
                reply = re.sub(r'<function=[a-z_]+>.*', '', reply, flags=re.DOTALL | re.IGNORECASE).strip()
                # Clean up any orphaned JSON-like content at start/end
                reply = re.sub(r'^[\s,]*\{["\']?[a-z_]+["\']?:.*?\}[\s,]*', '', reply, flags=re.IGNORECASE).strip()
                # If reply became empty after cleanup, provide a fallback
                if not reply:
                    reply = "I've processed your request. Is there anything else I can help you with? 🙏"

            # Save History
            if request.user.is_authenticated:
                ChatMessage.objects.create(user=request.user, mode='guide', sender='user', content=message)
                ChatMessage.objects.create(user=request.user, mode='guide', sender='ai', content=reply)

            return Response({
                "reply": reply, 
                "response": reply, 
                "products": products_data,
                "actions": actions_data
            })

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

class ChatRoomInitiateView(APIView):
    """
    Initiate or get a pre-booking chat room with a pandit.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pandit_id = request.data.get('pandit_id')
        if not pandit_id:
            return Response({'error': 'pandit_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from pandits.models import Pandit
            pandit = Pandit.objects.get(id=pandit_id)
            
            # Check for existing pre-booking room
            room, created = ChatRoom.objects.get_or_create(
                customer=request.user,
                pandit=pandit,
                is_pre_booking=True,
                defaults={'is_active': True}
            )
            
            serializer = ChatRoomSerializer(room, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        except Pandit.DoesNotExist:
            return Response({'error': 'Pandit not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)