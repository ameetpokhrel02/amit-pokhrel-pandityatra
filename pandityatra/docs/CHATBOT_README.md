# 🚀 PanditYatra Dual-Mode Chatbot Feature

Welcome to the **unified chatbot system** for PanditYatra! This document provides a high-level overview. For detailed information, see the documentation files below.

## 📌 Quick Overview

PanditYatra now has a single, intelligent chatbot that serves **two purposes**:

### 1. **Quick Guide Mode** (AI Helper)
- **When**: Anytime, no login needed
- **What**: Ask PanditYatra's AI anything about the app
- **How**: Click floating chat button → Ask questions
- **Examples**: 
  - "How to book a puja?"
  - "What is offline Kundali?"
  - "How to pay?"

### 2. **Real-Time Interaction Mode** (Pandit Chat)
- **When**: During a live puja (in video room)
- **What**: Chat with your pandit in real-time
- **How**: Automatically activates when you click "Join Puja"
- **Examples**:
  - "Can we start now?"
  - "How long will this take?"
  - "Can you explain this ritual?"

## 🎯 User Experience Flow

### First-Time User (Anita - New to App)
```
Anita lands on PanditYatra homepage
         ↓
Sees floating chat button (saffron, bottom-right)
         ↓
Clicks chat → Dialog opens
         ↓
"Namaste! I'm PanditYatra's AI helper. Ask me anything!"
         ↓
Types: "How to book a puja?"
         ↓
AI responds: "1. Search pandit... 2. Select service... 3. Pay..."
         ↓
Understands, closes chat, searches for "Bratabandha" pandit
         ↓
Finds pandit, books puja
```

### Puja Day (Live Interaction)
```
Anita logs in → Goes to My Bookings
         ↓
Clicks "Join Puja" for her booking
         ↓
Video room opens (Whereby) with chat panel on right
         ↓
Chat auto-connects to pandit
         ↓
Types: "Can we start with Ganesh mantra?"
         ↓
Message appears instantly for both
         ↓
Pandit replies: "Yes, let's begin"
         ↓
Real-time chat continues throughout puja
         ↓
All messages saved for future reference
```

## 📁 What's New (Files Overview)

### Backend
```
backend/chat/
├── models.py           → ChatMessage model (new)
├── views.py            → QuickChatView, GuideHistoryView (new)
├── consumers.py        → PujaConsumer for WebSocket (new)
├── serializers.py      → ChatMessageSerializer (new)
├── urls.py             → New endpoints
├── routing.py          → WebSocket route
└── migrations/
    └── 0002_add_chatmessage_dual_mode.py (new)
```

### Frontend
```
frontend/src/
├── hooks/
│   └── useChat.ts                (new)
├── components/
│   └── UnifiedChatWidget.tsx     (new)
└── App.tsx                        (updated)
```

### Documentation
```
pandityatra/
├── IMPLEMENTATION_SUMMARY.md      (new) ⭐ Start here!
├── DUAL_MODE_CHATBOT_DOCUMENTATION.md (new) - Complete reference
├── DUAL_MODE_CHATBOT_USAGE_GUIDE.md (new) - Code examples
├── DUAL_MODE_CHATBOT_CHECKLIST.md (new) - Implementation steps
├── QUICK_START.sh                 (new) - Linux/Mac setup
└── QUICK_START.bat                (new) - Windows setup
```

## 🚦 Quick Start (30 seconds)

### Linux/Mac
```bash
cd pandityatra
chmod +x QUICK_START.sh
./QUICK_START.sh
```

### Windows
```cmd
cd pandityatra
QUICK_START.bat
```

### Manual Setup
```bash
# 1. Install OpenAI
pip install openai

# 2. Set API key
export OPENAI_API_KEY=sk-your_key_here

# 3. Run migration
python manage.py migrate chat

# 4. Start backend (Terminal 1)
daphne -b 0.0.0.0 -p 8000 pandityatra_backend.asgi:application

# 5. Start frontend (Terminal 2)
cd frontend
npm run dev

# 6. Open browser
http://localhost:5173
```

## 📚 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| **IMPLEMENTATION_SUMMARY.md** | Overview + what was built | 10 min |
| **DUAL_MODE_CHATBOT_DOCUMENTATION.md** | Complete technical reference | 30 min |
| **DUAL_MODE_CHATBOT_USAGE_GUIDE.md** | Code examples & integration | 20 min |
| **DUAL_MODE_CHATBOT_CHECKLIST.md** | Implementation & testing steps | 15 min |

## 🧪 Quick Test

### Test 1: Guide Mode (AI Chat)
1. Open http://localhost:5173
2. Click floating chat button (no login needed)
3. Type: "How to book a puja?"
4. Should see AI response with steps

### Test 2: Interaction Mode (Pandit Chat)
1. Create a test booking (with booking_id)
2. In code: `<UnifiedChatWidget bookingId="123" panditName="Ramesh" />`
3. WebSocket should connect automatically
4. Chat with pandit in real-time

## 🛠️ Architecture (High Level)

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (React)                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ UnifiedChatWidget (Floating button + Dialog modal) │  │
│  │         ↓                                          │  │
│  │ useChat Hook (State management)                    │  │
│  │ ├─ Guide Mode → REST API to /api/chat/           │  │
│  │ └─ Interaction → WebSocket /ws/puja/<id>/         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
         ↓                                     ↓
┌──────────────────┐            ┌──────────────────────┐
│   Django REST    │            │  Django Channels     │
│   /api/chat/     │            │  /ws/puja/<id>/      │
│        ↓         │            │         ↓            │
│   OpenAI API     │            │   Daphne ASGI        │
│   (GPT-3.5)      │            │   + Redis            │
└──────────────────┘            │   (Broadcasting)     │
                                └──────────────────────┘
```

## 🎨 User Interface

### Floating Chat Button
- **Location**: Bottom-right corner
- **Color**: Saffron (#f97316)
- **Icon**: Speech bubble
- **Always visible**: On every page (if logged in)

### Chat Dialog
- **Title**: "PanditYatra AI Guide" (guide mode) or "Chat with [Pandit Name]" (interaction)
- **Messages**: Auto-scrolling, timestamped
- **Input**: Type message + Send button
- **Status**: Connection indicator (interaction mode)

## 🔑 Key Features

✅ **Single Interface** - One chat for everything
✅ **Auto Mode Detection** - Switches based on context
✅ **Real-Time Messaging** - WebSocket powered
✅ **AI Powered** - OpenAI for smart responses
✅ **Message History** - Saved to database
✅ **Auto Reconnect** - WebSocket auto-reconnects
✅ **No Auth for Guide** - Anyone can ask AI
✅ **Auth for Interaction** - Only for live pujas
✅ **Mobile Friendly** - Works on all devices
✅ **Fully Documented** - 4 comprehensive guides

## 📊 Technical Details

### API Endpoints
- `POST /api/chat/` - Quick chat (guide mode)
- `GET /api/chat/history/` - Chat history (auth required)

### WebSocket
- `ws://localhost:8000/ws/puja/<booking_id>/` - Puja interaction

### Database
- `ChatMessage` table - Stores all messages
- Indexes on (mode, user, timestamp) and (booking, timestamp)

### Environment Variables
- `OPENAI_API_KEY` - Your OpenAI API key

## 🔐 Security

- **Guide Mode**: No authentication (anonymous)
- **Interaction Mode**: Requires login + booking verification
- **Data**: Messages linked to users/bookings
- **Future**: Rate limiting, input validation

## 🚀 Deployment

1. **Install packages**: `pip install openai`
2. **Set API key**: `export OPENAI_API_KEY=sk-...`
3. **Run migrations**: `python manage.py migrate chat`
4. **Start server**: `daphne -p 8000 pandityatra_backend.asgi:application`
5. **Check Redis**: Ensure Redis is running

## ❓ FAQ

**Q: Do users need to log in to use the AI guide?**
A: No! Guide mode works for anyone. Interaction mode requires login.

**Q: Is the chat history saved?**
A: Yes, if user is logged in. Guide mode is transient unless user authenticates.

**Q: How fast is the AI response?**
A: Usually <1 second (depends on OpenAI API).

**Q: What about offline mode?**
A: Currently requires internet for both modes. Future: Local LLM for offline.

**Q: Can I customize the chat UI?**
A: Yes! Modify `UnifiedChatWidget.tsx` or build your own using `useChat` hook.

**Q: How much does this cost?**
A: Only OpenAI API costs for guide mode. Check https://openai.com/pricing

## 🐛 Troubleshooting

### WebSocket Connection Fails
```
Problem: ws://localhost:8000/ws/puja/123 connection failed
Solution: 
  1. Ensure Daphne is running (not Django runserver)
  2. Check Redis is running: redis-cli ping
  3. Check booking_id is valid
```

### OpenAI API Returns Error
```
Problem: openai.APIError: Unauthorized
Solution:
  1. Check OPENAI_API_KEY is set
  2. Verify key at https://platform.openai.com/api-keys
  3. Check key hasn't been deleted
```

### Chat Widget Not Showing
```
Problem: Floating button doesn't appear
Solution:
  1. Check you're logged in (required for now, can change)
  2. Check z-index doesn't conflict
  3. Check browser console for errors
```

## 📞 Support

For detailed information:
1. Check **IMPLEMENTATION_SUMMARY.md** for overview
2. Read **DUAL_MODE_CHATBOT_DOCUMENTATION.md** for technical details
3. See **DUAL_MODE_CHATBOT_USAGE_GUIDE.md** for code examples
4. Follow **DUAL_MODE_CHATBOT_CHECKLIST.md** for setup steps

## 🎁 What's Included

✅ Complete backend implementation
✅ Complete frontend implementation
✅ Database migrations
✅ 4 comprehensive documentation files
✅ Windows + Linux/Mac setup scripts
✅ API examples
✅ Testing scenarios
✅ Future enhancement suggestions
✅ Troubleshooting guide
✅ Deployment checklist

## 🌟 Next Steps

1. **Read** the IMPLEMENTATION_SUMMARY.md (10 min overview)
2. **Run** QUICK_START.sh or QUICK_START.bat
3. **Test** guide mode with "How to book a puja?"
4. **Explore** code in components/UnifiedChatWidget.tsx
5. **Extend** with new features (typing indicators, reactions, etc.)

---

**Ready to chat? Click the floating button and ask "How does PanditYatra work?" 🎉**

For questions, refer to the documentation files or check the code comments.

Happy building! 🚀
