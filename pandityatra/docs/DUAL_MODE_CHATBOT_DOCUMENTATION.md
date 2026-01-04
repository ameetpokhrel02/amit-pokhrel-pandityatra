# PanditYatra Dual-Mode Chatbot System
## Quick Guide & Real-Time Pandit Chat Implementation

### Overview
The PanditYatra app now features a **unified chatbot system** with two intelligent modes:
1. **Quick Guide Mode (AI Helper)** - OpenAI-powered app guidance for new users
2. **Real-Time Interaction Mode (Pandit Chat)** - WebSocket-based live messaging during pujas

Both modes operate through a single floating chat interface that intelligently switches modes based on context.

---

## System Architecture

### Backend Stack
- **Framework**: Django Rest Framework
- **Real-Time**: Django Channels (Daphne ASGI + Redis)
- **AI**: OpenAI API (GPT-3.5-turbo)
- **Database**: ChatMessage model for persistence

### Frontend Stack
- **React**: UI framework
- **WebSocket**: Real-time communication
- **shadcn/ui**: Dialog, Button, Input components
- **Tailwind CSS**: Styling

---

## Backend Implementation

### 1. Models (`backend/chat/models.py`)
New `ChatMessage` model added:
```python
class ChatMessage(models.Model):
    mode = CharField(choices=[('guide', 'AI Guide Mode'), ('interaction', 'Pandit Interaction Mode')])
    sender = CharField(choices=[('user', 'User'), ('ai', 'AI'), ('pandit', 'Pandit')])
    content = TextField()
    booking = ForeignKey(Booking, null=True, blank=True)  # For interaction mode
    pandit = ForeignKey(Pandit, null=True, blank=True)    # For interaction mode
    timestamp = DateTimeField(auto_now_add=True)
```

**Why separate from ChatRoom/Message?**
- Guide mode messages are transient (no booking/user relation required)
- Interaction mode messages link to specific bookings
- Allows flexible history management

### 2. API Endpoint (`backend/chat/views.py`)
**Quick Chat API**
- **Endpoint**: `POST /api/chat/`
- **No Authentication Required** (for anonymous users)
- **Request**:
  ```json
  {
    "message": "How to book a puja?",
    "mode": "guide"
  }
  ```
- **Response**:
  ```json
  {
    "response": "To book a puja: 1. Search pandit by occasion...",
    "mode": "guide",
    "sender": "ai",
    "timestamp": "2026-01-04T12:30:45Z"
  }
  ```

**System Prompt Features**:
- Comprehensive app knowledge (7 major features)
- Step-by-step guidance in simple language
- Support for both English and Nepali
- Clear limitations (e.g., cannot process bookings directly)

**Optional**: `/api/chat/history/` - Get authenticated user's guide mode history

### 3. WebSocket Consumer (`backend/chat/consumers.py`)
**PujaConsumer**
- **Endpoint**: `ws://localhost:8000/ws/puja/<booking_id>/`
- **Authentication**: Auto-verified (checks user is customer or pandit)
- **Features**:
  - Real-time message broadcasting via Redis
  - Message persistence to ChatMessage model
  - Join/leave notifications
  - Message history on connection

**Flow**:
1. User connects to `/ws/puja/<booking_id>/`
2. Consumer verifies booking access
3. Loads last 50 messages
4. Joins Redis group (`puja_<booking_id>`)
5. Broadcasts messages to all connected users
6. Saves to DB asynchronously

### 4. Django Settings (`backend/pandityatra_backend/settings.py`)
Already configured:
```python
INSTALLED_APPS = ['daphne', 'channels', ...]
ASGI_APPLICATION = 'pandityatra_backend.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {"hosts": [('redis', 6379)]},
    },
}
```

### 5. Environment Variables
Add to `.env`:
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxx  # Get from https://platform.openai.com/api-keys
```

---

## Frontend Implementation

### 1. useChat Hook (`frontend/src/hooks/useChat.ts`)
Central state management for chat:
```typescript
const {
  messages,           // Chat messages array
  isLoading,         // Loading state
  error,             // Error messages
  mode,              // 'guide' or 'interaction'
  sendMessage,       // Send message function
  connectWebSocket,  // Connect to puja
  disconnectWebSocket, // Disconnect
  isConnected        // Connection status
} = useChat(bookingId);
```

**Auto-Mode Detection**:
- No `bookingId` → Guide mode (AI)
- `bookingId` present → Interaction mode (Pandit)

**Message Handling**:
- Guide mode: REST API call to `/api/chat/`
- Interaction mode: WebSocket message to `/ws/puja/<bookingId>/`

### 2. UnifiedChatWidget Component (`frontend/src/components/UnifiedChatWidget.tsx`)
Single entry point for all chat:
- **Floating Button** (saffron #f97316, bottom-right)
- **Dialog Modal** (shadcn/ui Dialog)
- **Features**:
  - Auto-scrolling messages
  - Loading indicators
  - Error display
  - Connection status (interaction mode)
  - Keyboard shortcuts (Enter to send)
  - Welcome messages based on mode

**Props**:
```typescript
<UnifiedChatWidget 
  bookingId={bookingId}      // Optional, triggers interaction mode
  panditName={panditName}    // Display name during puja
/>
```

### 3. Integration (`frontend/src/App.tsx`)
```tsx
<UnifiedChatWidget />  {/* Global floating chat */}
```

---

## Usage Flows

### Quick Guide Mode (Anita's First-Time Experience)
```
1. Anita opens PanditYatra
2. Clicks floating chat icon → Dialog opens
3. Types: "How to book a puja?"
4. Frontend: POST to /api/chat/ with message
5. Backend: OpenAI responds with step-by-step guide
6. Message appears in chat (not saved, transient)
7. Anita learns and proceeds to booking
```

### Real-Time Interaction Mode (Puja Day)
```
1. Anita clicks "Join Puja" → Video room opens
2. UnifiedChatWidget with bookingId prop mounts
3. useChat detects mode='interaction'
4. WebSocket connects: ws://localhost:8000/ws/puja/<booking_id>/
5. Anita types: "Pandit ji, can we start?"
6. Message sent via WebSocket
7. Ramesh (pandit) receives in real-time
8. Message persisted to ChatMessage model
9. Chat history loaded when pandit joins
```

---

## Database Migrations

### Run Migrations
```bash
cd backend
python manage.py makemigrations chat
python manage.py migrate chat
```

### Migration File: `0002_add_chatmessage_dual_mode.py`
- Creates `ChatMessage` table
- Adds indexes on (mode, user, timestamp) and (booking, timestamp)
- Foreign keys to User, Booking, Pandit (nullable for guide mode)

---

## Configuration & Deployment

### Local Development
1. **Install OpenAI Package**:
   ```bash
   pip install openai
   ```

2. **Set Environment Variable**:
   ```bash
   export OPENAI_API_KEY=sk-xxxxxxxxxxxx
   ```

3. **Redis (for WebSocket)**:
   ```bash
   # Docker
   docker run -d -p 6379:6379 redis:latest
   
   # Or update settings.py for in-memory channel layer:
   CHANNEL_LAYERS = {
       "default": {
           "BACKEND": "channels.layers.InMemoryChannelLayer"
       }
   }
   ```

4. **Run Server**:
   ```bash
   python manage.py runserver
   # Or with Daphne:
   daphne -b 0.0.0.0 -p 8000 pandityatra_backend.asgi:application
   ```

### Production (Docker)
Already configured in `docker-compose.yml`:
- Daphne ASGI server
- Redis channel layer
- Environment variables via `.env`

---

## API Reference

### POST /api/chat/ (Guide Mode)
```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "How does offline Kundali work?"}'

# Response:
{
  "response": "Go to menu → Offline Kundali → Enter DOB/time/place...",
  "mode": "guide",
  "sender": "ai",
  "timestamp": "2026-01-04T12:35:22Z"
}
```

### WebSocket /ws/puja/<booking_id>/ (Interaction Mode)
```javascript
// Connect
const ws = new WebSocket('ws://localhost:8000/ws/puja/123/');

// Send message
ws.send(JSON.stringify({
  content: "Can we start with Ganesh mantra?",
  message_type: "TEXT"
}));

// Receive message
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'message') {
    console.log(data.data.content);  // Pandit's reply
  }
};
```

### GET /api/chat/history/ (Guide History - Authenticated)
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/chat/history/

# Response:
[
  {
    "id": 1,
    "mode": "guide",
    "sender": "user",
    "content": "How to book a puja?",
    "timestamp": "2026-01-04T12:30:00Z"
  },
  {
    "id": 2,
    "mode": "guide",
    "sender": "ai",
    "content": "To book a puja: 1. Search pandit...",
    "timestamp": "2026-01-04T12:30:05Z"
  }
]
```

---

## Troubleshooting

### WebSocket Connection Fails
**Issue**: `WebSocket connection to ws://localhost:8000/ws/puja/123/ failed`
- **Fix**: Ensure Daphne is running, not Django runserver
- **Fix**: Check Redis is running: `redis-cli ping` → should return `PONG`
- **Fix**: Verify booking_id exists and user has access

### OpenAI API Returns 401
**Issue**: `openai.APIError: Unauthorized`
- **Fix**: Check `OPENAI_API_KEY` is set
- **Fix**: Verify key from https://platform.openai.com/api-keys
- **Fix**: Check key hasn't expired

### Chat Widget Not Showing
**Issue**: Floating button doesn't appear
- **Fix**: Check `useAuth()` returns valid token and user
- **Fix**: Widget only shows for authenticated users
- **Fix**: Check z-index: 40 doesn't conflict with other elements

### Messages Not Saving
**Issue**: Guide mode messages don't persist
- **Fix**: This is by design - guide mode is transient
- **Fix**: To save, authenticate the user - messages auto-save with user_id
- **Fix**: Check `ChatMessage` table has `user_id` populated

---

## Performance Optimization

### Message Pagination (Future)
Currently loads last 50 messages. For large histories:
```python
@database_sync_to_async
def get_recent_messages(self, limit=50, offset=0):
    messages = ChatMessage.objects.filter(
        booking_id=self.booking_id,
        mode='interaction'
    ).order_by('-timestamp')[offset:offset+limit]
```

### Redis Memory Management
Monitor Redis memory:
```bash
redis-cli INFO memory
redis-cli DBSIZE
```

### Batch Message Processing
For high-volume pujas, consider async message queue (Celery):
```python
from celery import shared_task

@shared_task
def save_puja_message(booking_id, user_id, content):
    ChatMessage.objects.create(...)
```

---

## Security Considerations

### OpenAI API Key
- Store in `.env` (not in code)
- Use environment variables in production
- Rotate keys regularly
- Monitor usage: https://platform.openai.com/account/usage

### WebSocket Authentication
- User identity verified via Django session/token
- Booking access verified in `verify_booking_access()`
- Only customer + pandit can access `/ws/puja/<booking_id>/`

### Rate Limiting (Future)
```python
# Add to QuickChatView
from django.core.cache import cache
from django.http import HttpResponse

def post(self, request):
    # Rate limit: 10 requests per minute
    key = f"chat_{request.user.id}"
    if cache.get(key, 0) > 10:
        return Response({'error': 'Too many requests'}, status=429)
    cache.incr(key)
    cache.expire(key, 60)
    ...
```

---

## Future Enhancements

1. **Chat Persistence for Guide Mode**
   - Let users save favorite Q&A
   - Track conversation trends

2. **Typing Indicators**
   - Show "Pandit is typing..."
   - WebSocket event: `user_typing`

3. **Message Reactions**
   - 👍 👎 😊 reactions
   - Helpful feedback for AI

4. **File Sharing**
   - Upload puja schedule
   - Share ritual images
   - Medical records for Ayurveda

5. **Voice Messages**
   - Audio input for hands-free
   - Transcription via Whisper API

6. **Multilingual**
   - Guide mode in Nepali, Hindi, English
   - Auto-translate real-time messages

7. **AI Pandit**
   - Run local LLM for offline mode
   - No internet dependency
   - Faster response

---

## Testing

### Unit Tests (Backend)
```python
# test_chat.py
from django.test import TestCase
from rest_framework.test import APIClient

class QuickChatTest(TestCase):
    def test_guide_mode_api(self):
        response = self.client.post('/api/chat/', {
            'message': 'How to book?',
            'mode': 'guide'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('response', response.data)
```

### WebSocket Tests (Backend)
```python
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import User

async def test_puja_connection(self):
    user = await database_sync_to_async(User.objects.create_user)('test')
    communicator = WebsocketCommunicator(PujaConsumer.as_asgi(), 'ws/puja/1/')
    connected = await communicator.connect()
    self.assertTrue(connected)
```

### E2E Tests (Frontend)
```javascript
// cypress/integration/chat.cy.js
describe('Chat Widget', () => {
  it('opens guide mode on click', () => {
    cy.visit('/');
    cy.get('[data-testid="chat-button"]').click();
    cy.contains('PanditYatra AI Guide').should('be.visible');
  });
  
  it('sends quick chat message', () => {
    cy.get('[placeholder="Ask me anything"]').type('How to book?');
    cy.get('button').contains('Send').click();
    cy.contains('To book a puja').should('be.visible');
  });
});
```

---

## Support & Questions
- **API Issues**: Check backend logs with `tail -f logs/django.log`
- **WebSocket Issues**: Monitor Daphne with `--debug` flag
- **AI Responses**: Test at https://platform.openai.com/playground
- **Redis Issues**: Check `redis-cli` and `MONITOR` command

