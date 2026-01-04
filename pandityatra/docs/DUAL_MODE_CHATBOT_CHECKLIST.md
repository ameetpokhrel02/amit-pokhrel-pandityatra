# Dual-Mode Chatbot - Implementation Checklist

## Backend Setup

### Models & Database
- [x] Created `ChatMessage` model in `backend/chat/models.py`
- [x] Added migration file `0002_add_chatmessage_dual_mode.py`
- [ ] **ACTION**: Run `python manage.py migrate chat`

### API Endpoints
- [x] Implemented `QuickChatView` in `backend/chat/views.py`
  - [x] POST `/api/chat/` for quick guide mode
  - [x] OpenAI API integration with comprehensive system prompt
  - [x] GET `/api/chat/history/` for authenticated users
- [x] Updated URL routing in `backend/chat/urls.py`

### WebSocket Consumer
- [x] Implemented `PujaConsumer` in `backend/chat/consumers.py`
  - [x] WebSocket endpoint `/ws/puja/<booking_id>/`
  - [x] Auto-verification of booking access
  - [x] Message persistence to database
  - [x] Redis group broadcasting
  - [x] Join/leave notifications
- [x] Updated routing in `backend/chat/routing.py`

### Configuration
- [x] Django Channels (Daphne) already configured
- [x] Redis channel layer already configured
- [ ] **ACTION**: Add `OPENAI_API_KEY` to `.env` file

### Dependencies
- [x] Added `openai` to `backend/requirements.txt`
- [ ] **ACTION**: Run `pip install -r requirements.txt`

---

## Frontend Setup

### Hooks
- [x] Created `useChat` hook in `frontend/src/hooks/useChat.ts`
  - [x] State management (messages, loading, error, mode)
  - [x] Auto-mode detection based on bookingId
  - [x] Guide mode: REST API integration
  - [x] Interaction mode: WebSocket integration
  - [x] Auto-reconnect logic

### Components
- [x] Created `UnifiedChatWidget` in `frontend/src/components/UnifiedChatWidget.tsx`
  - [x] Floating button (saffron #f97316)
  - [x] Dialog modal (shadcn/ui)
  - [x] Message list with auto-scroll
  - [x] Input with send button
  - [x] Mode indicator (Guide / Chat with Pandit)
  - [x] Connection status for interaction mode
  - [x] Welcome messages based on mode
  - [x] Loading/error states

### App Integration
- [x] Updated `frontend/src/App.tsx` to use `UnifiedChatWidget`
- [ ] **ACTION**: Test floating button appears globally

---

## Testing Checklist

### Guide Mode (Quick Chat)
- [ ] Open app, click chat button
- [ ] Send message: "How to book a puja?"
- [ ] Verify AI response appears
- [ ] Send message: "How does offline Kundali work?"
- [ ] Verify AI response about offline Kundali
- [ ] No authentication required
- [ ] Messages don't appear in database (unless logged in)

### Interaction Mode (Puja Chat)
- [ ] Create a test booking with booking_id
- [ ] Pass `<UnifiedChatWidget bookingId="123" panditName="Ramesh Ji" />`
- [ ] Click chat button - should show "Chat with Ramesh Ji"
- [ ] Verify WebSocket connects (green status indicator)
- [ ] Send message from customer
- [ ] Verify message appears in database
- [ ] Connect as pandit user
- [ ] Verify pandit receives message in real-time
- [ ] Send reply from pandit
- [ ] Verify customer receives in real-time

### Edge Cases
- [ ] Chat with no messages - shows welcome message
- [ ] Rapid message sending - no race conditions
- [ ] Disconnect/reconnect - auto-reconnects
- [ ] Browser refresh - loads message history
- [ ] Switch between guide and interaction modes

---

## Deployment Checklist

### Environment Variables
```bash
# .env file
OPENAI_API_KEY=sk-xxxxxxxxxxxx
REDIS_URL=redis://redis:6379/0  # Docker
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
```

### Database
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### Docker Services
```bash
# Verify services in docker-compose.yml
# - web (Django)
# - redis (Channel layer)
# - frontend (React)

docker-compose up -d
docker-compose ps  # Should show all running
```

### DNS/Reverse Proxy
- Ensure `/ws/` routes to Daphne (ASGI)
- Ensure `/api/` routes to Django
- WebSocket upgrade headers configured

---

## Known Limitations & TODOs

### Current Implementation
1. **No rate limiting** on `/api/chat/` endpoint
   - **FIX**: Add cache-based rate limiting
   
2. **No typing indicators** in interaction mode
   - **FIX**: Add `user_typing` WebSocket event

3. **No message reactions** (👍 etc)
   - **FIX**: Add reaction model and WebSocket handler

4. **No file upload** support
   - **FIX**: Add file handling to WebSocket consumer

5. **No voice messages**
   - **FIX**: Integrate Whisper API for transcription

6. **Guide mode always uses English**
   - **FIX**: Detect user language and translate prompts

7. **No message search** in history
   - **FIX**: Add full-text search to ChatMessage model

### Performance Optimizations
- [ ] Pagination for large message histories
- [ ] Lazy-load messages in UI
- [ ] Compress WebSocket payloads
- [ ] Cache frequently asked questions
- [ ] Use Redis for session management

### Security Enhancements
- [ ] Rate limiting (10 requests/min per user)
- [ ] Input validation/sanitization
- [ ] CSRF protection for WebSocket
- [ ] Audit logging for API calls
- [ ] Encrypted database for sensitive messages

---

## Rollback Plan

If issues occur:

1. **Revert Frontend**:
   ```bash
   git revert <commit_hash>  # Reverts to FloatingChatWidget
   ```

2. **Revert Database**:
   ```bash
   python manage.py migrate chat 0001
   ```

3. **Revert Settings**:
   ```bash
   # Remove OPENAI_API_KEY from .env
   # Remove PujaConsumer from routing
   ```

---

## Monitoring & Maintenance

### Logs to Monitor
```bash
# Django errors
tail -f logs/django.log

# Daphne (WebSocket)
tail -f logs/daphne.log

# Redis
redis-cli MONITOR

# API rate limiting
tail -f logs/rate_limit.log
```

### Metrics to Track
- API response time (target: <1s)
- WebSocket connection success rate (target: >99%)
- OpenAI API usage and costs
- Database query performance
- Redis memory usage

### Backup Strategy
```bash
# Daily backup of chat history
pg_dump pandityatra_db > backups/chat_messages_$(date +%Y%m%d).sql
```

---

## Files Changed Summary

### Backend
- ✅ `backend/chat/models.py` - Added ChatMessage model
- ✅ `backend/chat/views.py` - Added QuickChatView, GuideHistoryView
- ✅ `backend/chat/serializers.py` - Added ChatMessageSerializer
- ✅ `backend/chat/urls.py` - Added new endpoints
- ✅ `backend/chat/consumers.py` - Added PujaConsumer
- ✅ `backend/chat/routing.py` - Added PujaConsumer route
- ✅ `backend/chat/migrations/0002_add_chatmessage_dual_mode.py` - New migration
- ✅ `backend/requirements.txt` - Added openai package

### Frontend
- ✅ `frontend/src/hooks/useChat.ts` - New hook
- ✅ `frontend/src/components/UnifiedChatWidget.tsx` - New component
- ✅ `frontend/src/App.tsx` - Updated to use UnifiedChatWidget

### Documentation
- ✅ `DUAL_MODE_CHATBOT_DOCUMENTATION.md` - Full guide
- ✅ `DUAL_MODE_CHATBOT_CHECKLIST.md` - This file

---

## Quick Start Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
export OPENAI_API_KEY=sk-xxxxxxxxxxxx
daphne -b 0.0.0.0 -p 8000 pandityatra_backend.asgi:application

# Frontend
cd frontend
npm install  # if needed
npm run dev

# Test
# 1. Open http://localhost:5173
# 2. Click chat button
# 3. Type: "How to book a puja?"
# 4. AI should respond with step-by-step guide
```

---

## Contact & Support
Questions? Check the full documentation: `DUAL_MODE_CHATBOT_DOCUMENTATION.md`
