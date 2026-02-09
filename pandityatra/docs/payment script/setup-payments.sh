#!/bin/bash

# Payment System Migration Script
# Run this after adding payment features

echo "🚀 PanditYatra Payment System Setup"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📦 Step 1: Creating migrations..."
docker exec pandityatra-web-1 python manage.py makemigrations payments
docker exec pandityatra-web-1 python manage.py makemigrations bookings

echo ""
echo "🔄 Step 2: Running migrations..."
docker exec pandityatra-web-1 python manage.py migrate

echo ""
echo "✅ Migrations complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add payment gateway API keys to backend/.env"
echo "2. Install frontend dependencies: cd frontend && npm install stripe @stripe/stripe-js"
echo "3. Create frontend payment components"
echo "4. Test with test API keys"
echo ""
echo "📖 See docs/PAYMENT_IMPLEMENTATION_GUIDE.md for full details"
