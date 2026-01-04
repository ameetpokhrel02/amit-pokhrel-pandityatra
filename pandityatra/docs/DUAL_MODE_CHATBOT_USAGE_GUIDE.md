# Using UnifiedChatWidget in PanditYatra Pages

## 1. Guide Mode Usage (Default - No Props Required)

### Anywhere in the App (Auto-includes)
The `UnifiedChatWidget` is globally integrated in `App.tsx`, so it automatically appears as a floating button on every page.

```tsx
// App.tsx - Already configured
<UnifiedChatWidget />  {/* No props = Guide mode */}
```

**User Experience**:
- Click floating chat icon → Dialog opens
- Welcome message: "Namaste! I'm PanditYatra's AI helper..."
- Ask questions like:
  - "How to book a puja?"
  - "What is offline Kundali?"
  - "How do payments work?"
  - "How to download recording?"
- AI responds immediately (OpenAI)
- No login required
- Messages not saved (transient)

---

## 2. Interaction Mode Usage (During Live Puja)

### In Puja Join Page / Video Room

#### Scenario: User clicks "Join Puja" and enters live video room

**Location**: `frontend/src/pages/Booking/MyBookings.tsx` or similar

```tsx
import { useState } from 'react';
import UnifiedChatWidget from '@/components/UnifiedChatWidget';
import { Booking } from '@/types/booking';

interface PujaRoomPageProps {
  booking: Booking;  // Contains booking_id, pandit details
}

export default function PujaRoomPage({ booking }: PujaRoomPageProps) {
  return (
    <div className="flex h-screen gap-4">
      {/* Left: Video (70%) */}
      <div className="w-7/12">
        {/* Whereby Video Component */}
        <iframe
          src={`https://whereby.com/${booking.video_room_id}`}
          className="w-full h-full"
        />
      </div>

      {/* Right: Chat Panel (30%) */}
      <div className="w-5/12 bg-gray-50 border-l border-gray-200">
        {/* Unified Chat Widget - Interaction Mode */}
        <UnifiedChatWidget 
          bookingId={booking.id.toString()}
          panditName={booking.pandit.user.full_name}
        />
      </div>
    </div>
  );
}
```

**How It Works**:
1. User passes `bookingId` prop → Widget detects interaction mode
2. WebSocket connects: `ws://localhost:8000/ws/puja/<booking_id>/`
3. Green "Connected" indicator appears
4. Chat panel replaces dialog (customize as needed)
5. User and pandit chat in real-time
6. Messages saved to database

---

## 3. Customizing UnifiedChatWidget in Different Contexts

### Example 1: Minimal Setup (Guide Mode)
```tsx
// No props needed - appears everywhere
import UnifiedChatWidget from '@/components/UnifiedChatWidget';

export default function HomePage() {
  return (
    <div>
      {/* Page content */}
      <h1>Welcome to PanditYatra</h1>
      {/* UnifiedChatWidget automatically available globally */}
    </div>
  );
}
```

### Example 2: Full Puja Room Setup
```tsx
import UnifiedChatWidget from '@/components/UnifiedChatWidget';
import { useParams } from 'react-router-dom';
import { useBooking } from '@/hooks/useBooking';

export default function PujaRoomPage() {
  const { bookingId } = useParams();
  const { booking, pandit } = useBooking(bookingId!);

  if (!booking) return <div>Loading...</div>;

  return (
    <div className="flex h-screen">
      {/* Video Section */}
      <div className="flex-1">
        <VideoComponent bookingId={bookingId} />
      </div>

      {/* Chat Section */}
      <div className="w-80 bg-white border-l shadow-lg">
        <UnifiedChatWidget 
          bookingId={bookingId}
          panditName={pandit?.user?.full_name || 'Pandit'}
        />
      </div>
    </div>
  );
}
```

### Example 3: Inline Chat (Not Floating)
```tsx
// If you want to customize the widget's position
import { useChat } from '@/hooks/useChat';

export default function CustomChatUI({ bookingId }: { bookingId: string }) {
  const { messages, sendMessage, isLoading } = useChat(bookingId);

  return (
    <div className="flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
            <span className={`inline-block px-3 py-2 rounded ${
              msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.message as HTMLInputElement;
        sendMessage(input.value);
        input.value = '';
      }}>
        <input name="message" placeholder="Type message..." className="w-full p-2" />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

---

## 4. Message Flow Diagrams

### Guide Mode Message Flow
```
┌─────────────────────────────────────────────────────────┐
│ User clicks chat icon on HomePage                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ UnifiedChatWidget opens (Dialog modal)                  │
│ useChat hook: mode='guide' (auto-detected, no bookingId)│
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ User types: "How to book a puja?"                       │
│ Clicks Send button                                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend: POST /api/chat/                               │
│ Body: { message: "How to book...", mode: "guide" }      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Backend: QuickChatView.post()                           │
│ Calls OpenAI API (gpt-3.5-turbo)                        │
│ System prompt: "You are PanditYatra guide..."           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ OpenAI Response:                                         │
│ "To book a puja: 1. Search pandit... 2. Select... ..."  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Backend: Save to ChatMessage (if user logged in)        │
│ Return response to frontend                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend: Display AI message in chat                    │
│ Message bubble shows timestamp                          │
│ Ready for next question                                 │
└─────────────────────────────────────────────────────────┘
```

### Interaction Mode Message Flow
```
┌──────────────────────────────────────────────────────────┐
│ User in puja room, <UnifiedChatWidget bookingId="123" /> │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ UnifiedChatWidget mounts                                 │
│ useChat hook: mode='interaction' (detected via bookingId)│
│ connectWebSocket() called                                │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Frontend: Open WebSocket                                 │
│ ws://localhost:8000/ws/puja/123/                         │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Backend: PujaConsumer.connect()                          │
│ Verify: Is user customer or pandit for booking 123?      │
│ Load last 50 messages from ChatMessage                   │
│ Send message_history to client                          │
│ Join Redis group: 'puja_123'                             │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Frontend: Display connection status ✅ Connected         │
│ Load message history in chat panel                       │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ User types: "Can we start with Ganesh mantra?"          │
│ Clicks Send                                              │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Frontend: Send WebSocket message                         │
│ JSON: { content: "Can we start...", message_type: "TEXT" }
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Backend: PujaConsumer.receive()                          │
│ Save to ChatMessage (async)                              │
│ Broadcast to group 'puja_123'                            │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ All WebSocket connections in group get message:          │
│ - Customer (Anita) sees her message                     │
│ - Pandit (Ramesh) sees customer's message               │
│ Database persists message                               │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Pandit replies: "Yes, let's begin"                      │
│ Same flow: WebSocket → Save → Broadcast                 │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Customer receives pandit's message in real-time          │
│ Chat continues during puja                              │
│ All messages saved for history/review                   │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Handling Edge Cases

### Case 1: User Not Logged In
```tsx
// App.tsx logic (in UnifiedChatWidget)
if (!token || !user) {
  return null;  // Widget doesn't show
}
```

### Case 2: WebSocket Disconnects
```tsx
// useChat hook
// Auto-reconnects after 3 seconds
reconnectTimeoutRef.current = setTimeout(() => {
  if (wsRef.current === null) {
    connectWebSocket(bookingId, token);
  }
}, 3000);
```

### Case 3: Invalid Booking ID
```tsx
// Backend: PujaConsumer.verify_booking_access()
if not booking or (not is_customer and not is_pandit):
  await self.close()  // Reject connection
```

### Case 4: API Rate Limiting (Future)
```tsx
// Backend: Add cache-based limiting
if cache.get(f"chat_{user_id}", 0) > 10:
  return Response({'error': 'Too many requests'}, status=429)
```

---

## 6. Testing Scenarios

### Test 1: Quick Chat (No Auth)
```
1. Open http://localhost:5173 (no login)
2. Click floating chat button
3. Send: "What's your name?"
4. AI should respond: "I'm PanditYatra's AI Assistant..."
5. Repeat with different questions
6. Close and reopen - no message history (transient)
```

### Test 2: Guide Mode (With Auth)
```
1. Login as customer
2. Click chat button
3. Send: "How does offline Kundali work?"
4. AI responds with guide
5. Go to /api/chat/history/ → Messages saved!
6. Check database: ChatMessage table has entries
```

### Test 3: Interaction Mode (Real-Time)
```
1. Login as customer
2. Create booking (booking_id = 123)
3. Click "Join Puja" → Opens puja room with chat
4. Send: "Hello Pandit!"
5. Login as pandit in another browser
6. Navigate to puja room (booking_id = 123)
7. Both see message in real-time
8. Pandit replies: "Namaste!"
9. Both can chat continuously
10. Check database: All messages in ChatMessage table
```

---

## 7. API Contract Examples

### Quick Chat Request/Response
```bash
# Request
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I download my recording?",
    "mode": "guide"
  }'

# Response (200 OK)
{
  "response": "Go to 'My Bookings' → Click your puja → 'View Recording' → Download button. The recording is stored securely for 30 days.",
  "mode": "guide",
  "sender": "ai",
  "timestamp": "2026-01-04T15:45:30Z"
}
```

### WebSocket Messages
```javascript
// Client sends
{"content": "Can you explain the rituals?", "message_type": "TEXT"}

// Client receives
{
  "type": "message",
  "data": {
    "id": 456,
    "sender": "pandit",
    "content": "Of course! First we invoke...",
    "timestamp": "2026-01-04T15:46:00Z"
  }
}

// Join notification
{"type": "user_joined", "username": "ramesh_shastri", "user_id": 42}

// Typing indicator (future)
{"type": "user_typing", "username": "ramesh_shastri"}
```

---

## 8. Performance Tips

### Frontend
```tsx
// Use memoization for large message lists
const MessageList = React.memo(({ messages }) => (
  <div>
    {messages.map(msg => <Message key={msg.id} {...msg} />)}
  </div>
));
```

### Backend
```python
# Use select_related for DB queries
messages = ChatMessage.objects.select_related('user').filter(...)

# Async save for non-critical ops
@database_sync_to_async
async def save_message(self, ...):
    ChatMessage.objects.create(...)  # Happens in thread pool
```

---

## Summary

| Mode | Use Case | Authentication | Persistence | Speed | Cost |
|------|----------|-----------------|-------------|-------|------|
| **Guide** | First-time users, app help | None | Optional | Fast (REST) | Low (OpenAI) |
| **Interaction** | Live puja with pandit | Required | Full (DB) | Real-time (WS) | None |

Choose the mode automatically based on context. Simple, elegant, user-friendly! 🚀
