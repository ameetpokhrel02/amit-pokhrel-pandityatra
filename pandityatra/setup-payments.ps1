# Payment System Migration Script (PowerShell)
# Run this after adding payment features

Write-Host "🚀 PanditYatra Payment System Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Step 1: Creating migrations..." -ForegroundColor Yellow
docker exec pandityatra-web-1 python manage.py makemigrations payments
docker exec pandityatra-web-1 python manage.py makemigrations bookings

Write-Host ""
Write-Host "🔄 Step 2: Running migrations..." -ForegroundColor Yellow
docker exec pandityatra-web-1 python manage.py migrate

Write-Host ""
Write-Host "✅ Migrations complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Add payment gateway API keys to backend/.env"
Write-Host "2. Install frontend dependencies:"
Write-Host "   cd frontend"
Write-Host "   npm install stripe @stripe/stripe-js"
Write-Host "3. Create frontend payment components"
Write-Host "4. Test with test API keys"
Write-Host ""
Write-Host "📖 See docs/PAYMENT_IMPLEMENTATION_GUIDE.md for full details" -ForegroundColor Yellow
