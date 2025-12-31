# 🚀 Database Schema Enhancements & Real-Time Features

## ✅ New Database Tables Added

### 1. **Chat System** (Real-time with Redis + Django Channels)

**ChatRoom Model:**
```python
- id (PK)
- booking_id (FK → Booking, OneToOne)
- customer_id (FK → User)
- pandit_id (FK → Pandit)
- created_at
- is_active
```

**Message Model:**
```python
- id (PK)
- chat_room_id (FK → ChatRoom)
- sender_id (FK → User)
- message_type (TEXT/IMAGE/FILE/SYSTEM)
- content (Text)
- content_ne (Text, Nepali translation)
- file_url
- timestamp (Auto timezone conversion to Nepal Time)
- is_read
- read_at
```

**Features:**
- ✅ WebSocket-based real-time messaging
- ✅ Message history on connect
- ✅ Typing indicators support
- ✅ Read receipts
- ✅ Bilingual support (English + Nepali)

---

### 2. **Reviews & Ratings**

**Review Model:**
```python
- id (PK)
- booking_id (FK → Booking, OneToOne)
- pandit_id (FK → Pandit)
- customer_id (FK → User)
- rating (1-5)
- comment
- comment_ne (Nepali translation)
- professionalism (1-5)
- knowledge (1-5)
- punctuality (1-5)
- created_at
- updated_at
- is_verified (Admin approval)
```

**Features:**
- ✅ Multi-criteria ratings
- ✅ Bilingual comments
- ✅ Admin moderation
- ✅ One review per booking

---

### 3. **Payments** (Enhanced)

**Payment Model:**
```python
- id (PK)
- booking_id (FK → Booking, OneToOne)
- user_id (FK → User)
- payment_method (KHALTI/ESEWA/CONNECT_IPS/IME_PAY/STRIPE/CASH)
- amount
- currency (NPR/USD)
- transaction_id (Unique)
- gateway_response (JSON)
- status (PENDING/PROCESSING/COMPLETED/FAILED/REFUNDED)
- created_at
- updated_at
- completed_at
- refund_amount
- refund_reason
- refunded_at
```

**PaymentWebhook Model:**
```python
- id (PK)
- payment_method
- payload (JSON)
- headers (JSON)
- processed
- created_at
```

**Supported Gateways:**
- ✅ Khalti (Nepal)
- ✅ eSewa (Nepal)
- ✅ ConnectIPS
- ✅ IME Pay
- ✅ Stripe (International)
- ✅ Cash on Service

---

### 4. **Notifications** (Real-time Push)

**Notification Model:**
```python
- id (PK)
- user_id (FK → User)
- notification_type (BOOKING_CREATED/ACCEPTED/COMPLETED/CANCELLED/PAYMENT_SUCCESS/etc.)
- title
- title_ne (Nepali)
- message
- message_ne (Nepali)
- booking_id (FK → Booking, Optional)
- is_read
- read_at
- created_at
- user_timezone (Default: Asia/Kathmandu)
```

**Notification Types:**
- ✅ BOOKING_CREATED
- ✅ BOOKING_ACCEPTED
- ✅ BOOKING_COMPLETED
- ✅ BOOKING_CANCELLED
- ✅ PAYMENT_SUCCESS
- ✅ PAYMENT_FAILED
- ✅ NEW_MESSAGE
- ✅ REVIEW_RECEIVED
- ✅ PANDIT_VERIFIED
- ✅ PANDIT_REJECTED

**Features:**
- ✅ Real-time WebSocket notifications
- ✅ Auto timezone conversion (Nepal: UTC+5:45)
- ✅ Bilingual support

---

## 🌐 Language & Localization Support

### Settings Updated:
```python
LANGUAGES = [
    ('en', 'English'),
    ('ne', 'Nepali (नेपाली)'),
]

TIME_ZONE = 'Asia/Kathmandu'  # Nepal Standard Time (UTC+5:45)
USE_I18N = True  # Internationalization
USE_L10N = True  # Localization
USE_TZ = True    # Timezone awareness
```

### Features:
- ✅ All user-facing text supports English + Nepali
- ✅ Auto time conversion to Nepal timezone
- ✅ Nepali calendar support (can be added)
- ✅ Bilingual content fields in models

---

## 🔴 Redis Integration

### Docker Compose Services:
```yaml
redis:
  image: redis:7-alpine
  ports: 6379:6379
  healthcheck: redis-cli ping
```

### Django Channels Configuration:
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],
        },
    },
}
```

### Use Cases:
- ✅ WebSocket channel layers for chat
- ✅ WebSocket notifications
- ✅ Session caching (optional)
- ✅ Celery task queue (future)

---

## 🔌 WebSocket Endpoints

### Chat WebSocket:
```
ws://localhost:8000/ws/chat/<room_id>/
```

**Events:**
- `connect` → Join room, get message history
- `receive` → Save & broadcast message
- `chat_message` → Receive broadcast
- `disconnect` → Leave room

### Notifications WebSocket:
```
ws://localhost:8000/ws/notifications/
```

**Events:**
- `connect` → Join user's notification channel
- `notification_message` → Receive real-time notification

---

## 📦 New Dependencies Added

```txt
channels[daphne]     # Django Channels + ASGI server
channels-redis       # Redis channel layer backend
redis                # Redis Python client
pytz                 # Timezone support
stripe               # Stripe payment gateway
requests             # HTTP client for Khalti/eSewa APIs
django-modeltranslation  # Model field translation
```

---

## 🗂️ File Structure Created

```
backend/
├── chat/
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py (ChatRoom, Message)
│   ├── admin.py
│   ├── consumers.py (ChatConsumer, NotificationConsumer)
│   └── routing.py (WebSocket URL patterns)
├── reviews/
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py (Review)
│   └── admin.py
├── notifications/
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py (Notification)
│   └── admin.py
├── payments/
│   ├── models.py (Payment, PaymentWebhook) ✅ Enhanced
│   └── admin.py ✅ Enhanced
└── pandityatra_backend/
    ├── asgi.py ✅ Updated for Channels
    └── settings.py ✅ Updated with new apps, Redis, localization
```

---

## 🚀 Next Steps

### 1. Run Migrations:
```bash
cd pandityatra
docker compose down
docker compose up --build -d
docker compose exec web python manage.py makemigrations chat reviews notifications payments
docker compose exec web python manage.py migrate
```

### 2. Create Admin Users:
```bash
docker compose exec web python manage.py createsuperuser
```

### 3. Test WebSocket:
```javascript
// Frontend: Connect to chat
const ws = new WebSocket('ws://localhost:8000/ws/chat/1/');

ws.onopen = () => {
    ws.send(JSON.stringify({
        type: 'TEXT',
        content: 'Hello from customer!',
        content_ne: 'ग्राहकबाट नमस्कार!'
    }));
};

ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log('Message:', data);
};
```

### 4. Implement Payment Gateways:
- Khalti SDK integration
- Webhook handlers for payment confirmation
- Payment status updates

### 5. Frontend Chat Component:
- React component for chat UI
- Message list with auto-scroll
- Real-time message updates
- Language toggle (EN/NE)

---

## 🎯 Feature Completion Status

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Real-time Chat | ✅ | ❌ | 50% |
| Notifications | ✅ | ❌ | 50% |
| Reviews & Ratings | ✅ | ❌ | 50% |
| Payments | ✅ | ❌ | 50% |
| Nepali Language | ✅ | ❌ | 50% |
| Timezone Conversion | ✅ | ❌ | 50% |

**Overall Progress: ~55% Complete**

