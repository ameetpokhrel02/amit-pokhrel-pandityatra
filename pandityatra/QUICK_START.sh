#!/bin/bash
# Quick Start Guide for PanditYatra Dual-Mode Chatbot

echo "🚀 PanditYatra Dual-Mode Chatbot - Quick Start"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backend Setup
echo -e "${YELLOW}Step 1: Backend Setup${NC}"
echo "--------------------------------------"

cd backend 2>/dev/null || { echo "❌ Not in project root. Run from pandityatra/ folder."; exit 1; }

# Check if OpenAI package is installed
echo "📦 Installing/Checking dependencies..."
pip install -q openai
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ openai package ready${NC}"
else
    echo -e "${RED}❌ Failed to install openai${NC}"
    exit 1
fi

# Step 2: Environment Setup
echo ""
echo -e "${YELLOW}Step 2: Environment Configuration${NC}"
echo "--------------------------------------"
echo ""
echo "⚠️  IMPORTANT: Set your OpenAI API key"
echo ""
echo "Option A - Linux/Mac:"
echo "  export OPENAI_API_KEY=sk-your_key_here"
echo ""
echo "Option B - Windows (PowerShell):"
echo "  \$env:OPENAI_API_KEY='sk-your_key_here'"
echo ""
echo "Option C - Create .env file:"
echo "  echo 'OPENAI_API_KEY=sk-your_key_here' >> .env"
echo ""
read -p "Have you set OPENAI_API_KEY? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ API key configured${NC}"
else
    echo -e "${RED}❌ Please set OPENAI_API_KEY and try again${NC}"
    exit 1
fi

# Step 3: Database Migration
echo ""
echo -e "${YELLOW}Step 3: Database Migration${NC}"
echo "--------------------------------------"
echo "Running: python manage.py migrate chat"
python manage.py migrate chat

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrated${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

# Step 4: Redis Check
echo ""
echo -e "${YELLOW}Step 4: Redis Setup${NC}"
echo "--------------------------------------"
echo "Checking Redis connection..."
redis-cli ping > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis not running. Starting Docker...${NC}"
    docker run -d -p 6379:6379 redis:latest > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Redis started in Docker${NC}"
        sleep 2
    else
        echo -e "${RED}❌ Could not start Redis. Run manually:${NC}"
        echo "   docker run -d -p 6379:6379 redis:latest"
        echo ""
        echo "   OR use in-memory channel layer (single server only):"
        echo "   Update CHANNEL_LAYERS in settings.py to InMemoryChannelLayer"
    fi
fi

# Step 5: Start Backend
echo ""
echo -e "${YELLOW}Step 5: Start Backend Server${NC}"
echo "--------------------------------------"
echo ""
echo "Starting Daphne ASGI server..."
echo "Server will run at: http://localhost:8000"
echo ""
echo "Run this command:"
echo "  daphne -b 0.0.0.0 -p 8000 pandityatra_backend.asgi:application"
echo ""
echo "Or (with debug output):"
echo "  daphne -b 0.0.0.0 -p 8000 --verbosity 3 pandityatra_backend.asgi:application"
echo ""

# Step 6: Frontend Setup
echo ""
echo -e "${YELLOW}Step 6: Frontend Setup (In New Terminal)${NC}"
echo "--------------------------------------"
cd ../frontend 2>/dev/null
echo "Run in a new terminal:"
echo "  cd frontend"
echo "  npm install  # if needed"
echo "  npm run dev"
echo ""
echo "Frontend will run at: http://localhost:5173"
echo ""

# Step 7: Testing
echo ""
echo -e "${YELLOW}Step 7: Test the Implementation${NC}"
echo "--------------------------------------"
echo ""
echo "🧪 Quick Chat Test (Guide Mode):"
echo "  curl -X POST http://localhost:8000/api/chat/ \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"message\": \"How to book a puja?\"}'"
echo ""
echo "Expected response:"
echo "  { \"response\": \"To book a puja: 1. Search...\", ... }"
echo ""
echo "🧪 Guide History Test (Authenticated):"
echo "  curl -H 'Authorization: Bearer <your_token>' \\"
echo "    http://localhost:8000/api/chat/history/"
echo ""
echo "🧪 WebSocket Test:"
echo "  wscat -c ws://localhost:8000/ws/puja/123/"
echo ""

# Final Instructions
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Start Backend (Terminal 1):"
echo "   daphne -b 0.0.0.0 -p 8000 pandityatra_backend.asgi:application"
echo ""
echo "2️⃣  Start Frontend (Terminal 2):"
echo "   cd frontend && npm run dev"
echo ""
echo "3️⃣  Open in Browser:"
echo "   http://localhost:5173"
echo ""
echo "4️⃣  Click floating chat button (bottom-right)"
echo ""
echo "5️⃣  Test:"
echo "   Guide Mode: Ask 'How to book a puja?'"
echo "   (AI should respond with steps)"
echo ""
echo "6️⃣  For Interaction Mode:"
echo "   Pass bookingId prop to UnifiedChatWidget"
echo "   WebSocket will auto-connect"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  📖 DUAL_MODE_CHATBOT_DOCUMENTATION.md (Main reference)"
echo "  📋 DUAL_MODE_CHATBOT_CHECKLIST.md (Implementation steps)"
echo "  📚 DUAL_MODE_CHATBOT_USAGE_GUIDE.md (Developer guide)"
echo "  📝 IMPLEMENTATION_SUMMARY.md (Overview)"
echo ""
echo -e "${GREEN}Happy chatting! 🎉${NC}"
echo ""
