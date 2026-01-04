@echo off
REM Quick Start Guide for PanditYatra Dual-Mode Chatbot (Windows)

setlocal enabledelayedexpansion

echo.
echo ============================================
echo PanditYatra Dual-Mode Chatbot - Quick Start
echo ============================================
echo.

REM Step 1: Check Backend Directory
echo [Step 1] Checking Backend Setup...
if not exist "backend" (
    echo ERROR: backend folder not found
    echo Run this script from pandityatra root directory
    pause
    exit /b 1
)

cd backend

REM Step 2: Install Dependencies
echo.
echo [Step 2] Installing Dependencies...
echo Installing openai package...
pip install -q openai

if %errorlevel% equ 0 (
    echo [OK] openai package installed
) else (
    echo [ERROR] Failed to install openai
    pause
    exit /b 1
)

REM Step 3: Environment Setup
echo.
echo [Step 3] Environment Configuration
echo.
echo IMPORTANT: Set your OpenAI API key before continuing
echo.
echo Option A - Command line (Windows PowerShell):
echo   $env:OPENAI_API_KEY='sk-your_key_here'
echo.
echo Option B - Command line (CMD):
echo   set OPENAI_API_KEY=sk-your_key_here
echo.
echo Option C - Create .env file:
echo   Add to backend\.env:
echo   OPENAI_API_KEY=sk-your_key_here
echo.
set /p confirmation="Have you set OPENAI_API_KEY? (y/n): "
if /i not "%confirmation%"=="y" (
    echo [ERROR] Please set OPENAI_API_KEY first
    pause
    exit /b 1
)

echo [OK] API key configured

REM Step 4: Database Migration
echo.
echo [Step 4] Running Database Migration...
echo Command: python manage.py migrate chat
python manage.py migrate chat

if %errorlevel% equ 0 (
    echo [OK] Database migrated successfully
) else (
    echo [ERROR] Migration failed
    pause
    exit /b 1
)

REM Step 5: Check Redis
echo.
echo [Step 5] Checking Redis...
redis-cli ping >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Redis is running
) else (
    echo [WARNING] Redis not running
    echo.
    echo You can either:
    echo   A) Start Redis manually (if installed)
    echo   B) Use Docker: docker run -d -p 6379:6379 redis:latest
    echo   C) Update CHANNEL_LAYERS in settings.py to use InMemoryChannelLayer
    echo.
    set /p redis_continue="Continue without Redis? (y/n): "
    if /i not "!redis_continue!"=="y" (
        pause
        exit /b 1
    )
)

REM Step 6: Display Next Steps
echo.
echo ============================================
echo SETUP COMPLETE!
echo ============================================
echo.
echo NEXT STEPS:
echo.
echo 1. Start Backend (in this terminal or new one):
echo    daphne -b 0.0.0.0 -p 8000 pandityatra_backend.asgi:application
echo.
echo    Alternative (less efficient):
echo    python manage.py runserver
echo.
echo 2. Open new terminal and start Frontend:
echo    cd frontend
echo    npm install (if needed)
echo    npm run dev
echo.
echo 3. Open browser:
echo    http://localhost:5173
echo.
echo 4. Click floating chat button (bottom-right, saffron color)
echo.
echo 5. Test Guide Mode:
echo    Type: "How to book a puja?"
echo    AI should respond with steps
echo.
echo ============================================
echo TESTING COMMANDS:
echo ============================================
echo.
echo Test Quick Chat (curl):
echo   curl -X POST http://localhost:8000/api/chat/ ^
echo     -H "Content-Type: application/json" ^
echo     -d "{\"message\": \"How to book a puja?\"}"
echo.
echo Test WebSocket (install wscat first):
echo   npm install -g wscat
echo   wscat -c ws://localhost:8000/ws/puja/1/
echo.
echo ============================================
echo DOCUMENTATION:
echo ============================================
echo.
echo Read these files in order:
echo   1. IMPLEMENTATION_SUMMARY.md (Overview)
echo   2. DUAL_MODE_CHATBOT_DOCUMENTATION.md (Complete guide)
echo   3. DUAL_MODE_CHATBOT_USAGE_GUIDE.md (Code examples)
echo   4. DUAL_MODE_CHATBOT_CHECKLIST.md (Implementation checklist)
echo.
echo ============================================
echo Starting backend server...
echo ============================================
echo.

REM Start Backend
daphne -b 0.0.0.0 -p 8000 pandityatra_backend.asgi:application

pause
