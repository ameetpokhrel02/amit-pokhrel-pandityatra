# 🚀 Database Schema Enhancements & Real-Time Features

**Last Updated:** January 4, 2026  
**Status:** Phase 1 Complete | AI Recommender Next  
**Missing Apps:** Kundali (empty), Recommender (empty)

---

## 📊 **COMPLETE DATABASE MODELS REVIEW**

### **✅ FULLY IMPLEMENTED MODELS**

#### **1. User Model** (`users/models.py`) ✅
```python
Fields:
- username, password, email (Django Auth)
- full_name
- phone_number (Nepali validator: 98XXXXXXXX)
- profile_pic_url
- role (user/pandit/admin)
```

#### **2. Pandit Model** (`pandits/models.py`) ✅
```python
Fields:
- user (OneToOne → User)
- expertise
- language
- experience_years
- rating
- bio
- is_available
- verification_status (PENDING/APPROVED/REJECTED)
- certification_file (FileField)
- is_verified
- verified_date
- verification_notes
- date_joined
- updated_at

Indexes:
- verification_status
- is_verified
```

#### **3. Service/Puja Model** (`services/models.py`) ✅
```python
Fields:
- pandit (FK → Pandit)
- name
- description
- duration_minutes
- price
- is_available
```

#### **4. Booking Model** (`bookings/models.py`) ✅
```python
Fields:
- user (FK → User)
- pandit (FK → Pandit)
- service (FK → Puja)
- service_name
- service_location (ONLINE/HOME/TEMPLE/PANDIT_LOCATION)
- booking_date
- booking_time
- status (PENDING/ACCEPTED/COMPLETED/CANCELLED/FAILED)
- notes
- samagri_required
- service_fee
- samagri_fee
- total_fee
- payment_status
- payment_method
- created_at
- updated_at
- accepted_at
- completed_at

Unique Together: (pandit, booking_date, booking_time)
```

#### **5. Samagri Models** (`samagri/models.py`) ✅
```python
SamagriCategory:
- name
- description

SamagriItem:
- category (FK → SamagriCategory)
- name
- description
- price

PujaSamagriRequirement:
- puja (FK → Puja)
- samagri_item (FK → SamagriItem)
- quantity
- unit (kg/grams/pcs)
```

#### **6. Payment Model** (`payments/models.py`) ✅
```python
Payment:
- booking (OneToOne → Booking)
- user (FK → User)
- payment_method (KHALTI/ESEWA/CONNECT_IPS/IME_PAY/STRIPE/CASH)
- amount
- currency (NPR/USD)
- transaction_id (Unique)
- gateway_response (JSON)
- status (PENDING/PROCESSING/COMPLETED/FAILED/REFUNDED)
- created_at, updated_at, completed_at
- refund_amount, refund_reason, refunded_at

PaymentWebhook:
- payment_method
- payload (JSON)
- headers (JSON)
- processed
- created_at
```

#### **7. Review Model** (`reviews/models.py`) ✅
```python
Fields:
- booking (OneToOne → Booking)
- pandit (FK → Pandit)
- customer (FK → User)
- rating (1-5)
- comment, comment_ne
- professionalism (1-5)
- knowledge (1-5)
- punctuality (1-5)
- created_at, updated_at
- is_verified
```

#### **8. Notification Model** (`notifications/models.py`) ✅
```python
Fields:
- user (FK → User)
- notification_type (10 types)
- title, title_ne
- message, message_ne
- booking (FK → Booking, Optional)
- is_read
- read_at
- created_at
- user_timezone (Asia/Kathmandu)
```

---

### **❌ EMPTY MODELS (NEED IMPLEMENTATION)**

#### **9. Kundali Model** (`kundali/models.py`) ❌ **EMPTY**
```python
# TODO: Implement Kundali (Astrology) system
Suggested Fields:
- user (FK → User)
- name
- date_of_birth
- time_of_birth
- place_of_birth (city, country)
- latitude, longitude
- chart_data (JSON - planetary positions)
- predictions (JSON)
- compatibility_data (JSON)
- created_at
- updated_at
```

#### **10. Recommender Model** (`recommender/models.py`) ❌ **EMPTY**
```python
# TODO: Implement AI Recommendation System
Suggested Models:

SamagriRecommendation:
- puja (FK → Puja)
- samagri_item (FK → SamagriItem)
- confidence_score (0.0 - 1.0)
- is_essential (Boolean)
- reason (Text explanation)
- created_at

PanditRecommendation:
- user (FK → User)
- pandit (FK → Pandit)
- score (0.0 - 1.0)
- factors (JSON: {location, rating, experience, availability})
- created_at

BookingRecommendation:
- user (FK → User)
- recommended_puja (FK → Puja)
- reason (upcoming festival, seasonal, user_history)
- score
- created_at
```

---

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

## 🤖 **NEXT TASK: AI RECOMMENDER & SAMAGRI AUTO-ADDER**

### **Phase 2 Implementation Plan**

---

## 🎯 **1. AI Samagri Recommender System**

### **Business Logic:**
When a user books a puja service, the system should **automatically recommend** the required samagri items based on:
1. Puja type (Griha Pravesh, Satyanarayan, Wedding, etc.)
2. Historical data (what items are commonly bought together)
3. Pandit preferences
4. Seasonal availability
5. Budget optimization

### **Recommended Models:**

#### **SamagriRecommendation Model**
```python
class SamagriRecommendation(models.Model):
    puja = models.ForeignKey('services.Puja', on_delete=models.CASCADE)
    samagri_item = models.ForeignKey('samagri.SamagriItem', on_delete=models.CASCADE)
    
    # AI/ML Features
    confidence_score = models.FloatField(default=0.5)  # 0.0 - 1.0
    is_essential = models.BooleanField(default=False)  # Must-have items
    is_optional = models.BooleanField(default=False)   # Nice-to-have items
    priority = models.IntegerField(default=5)  # 1=highest, 10=lowest
    
    # Business Logic
    quantity_min = models.IntegerField(default=1)
    quantity_max = models.IntegerField(default=10)
    unit = models.CharField(max_length=50, default='pcs')
    
    # Explanation
    reason = models.TextField(help_text="Why this item is recommended")
    category = models.CharField(max_length=50)  # Essential, Traditional, Optional
    
    # Tracking
    times_recommended = models.IntegerField(default=0)
    times_purchased = models.IntegerField(default=0)
    purchase_rate = models.FloatField(default=0.0)  # times_purchased / times_recommended
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('puja', 'samagri_item')
        ordering = ['-is_essential', '-confidence_score', 'priority']
```

#### **PujaTemplate Model** (Pre-defined Samagri Lists)
```python
class PujaTemplate(models.Model):
    """
    Pre-configured samagri lists for common pujas
    """
    name = models.CharField(max_length=200)  # e.g., "Standard Griha Pravesh"
    puja_type = models.CharField(max_length=100)  # Category
    description = models.TextField()
    
    # Can be linked to multiple pujas
    recommended_for_pujas = models.ManyToManyField('services.Puja', blank=True)
    
    # Estimated cost
    estimated_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
```

#### **UserSamagriPreference Model** (Learning from User Behavior)
```python
class UserSamagriPreference(models.Model):
    """
    Track what users typically buy to personalize recommendations
    """
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    samagri_item = models.ForeignKey('samagri.SamagriItem', on_delete=models.CASCADE)
    
    # Tracking
    times_purchased = models.IntegerField(default=0)
    last_purchased = models.DateTimeField()
    average_quantity = models.FloatField(default=1.0)
    
    # Preferences
    is_favorite = models.BooleanField(default=False)
    never_show = models.BooleanField(default=False)  # User doesn't want this item
    
    class Meta:
        unique_together = ('user', 'samagri_item')
```

---

## 🔧 **2. Auto-Adder Business Logic**

### **Workflow:**

```
User Books Puja → 
Check PujaSamagriRequirement → 
Get AI Recommendations → 
Create SamagriCart (auto-added) → 
User can Review/Edit → 
Add to Booking
```

### **Implementation Steps:**

#### **Step 1: Create Samagri Mapping (Backend)**
```python
# recommender/logic.py

def get_samagri_for_puja(puja_id):
    """
    Get recommended samagri items for a specific puja
    """
    # 1. Get explicit requirements
    explicit_items = PujaSamagriRequirement.objects.filter(
        puja_id=puja_id
    ).select_related('samagri_item')
    
    # 2. Get AI recommendations
    ai_recommendations = SamagriRecommendation.objects.filter(
        puja_id=puja_id,
        is_active=True,
        confidence_score__gte=0.6  # Only high-confidence items
    ).order_by('-is_essential', '-confidence_score')
    
    # 3. Combine and return
    samagri_list = []
    
    # Add essential items
    for req in explicit_items:
        samagri_list.append({
            'item': req.samagri_item,
            'quantity': req.quantity,
            'unit': req.unit,
            'type': 'REQUIRED',
            'can_remove': False
        })
    
    # Add AI recommended items
    for rec in ai_recommendations:
        if rec.is_essential:
            samagri_list.append({
                'item': rec.samagri_item,
                'quantity': rec.quantity_min,
                'unit': rec.unit,
                'type': 'ESSENTIAL',
                'confidence': rec.confidence_score,
                'reason': rec.reason,
                'can_remove': False
            })
        else:
            samagri_list.append({
                'item': rec.samagri_item,
                'quantity': rec.quantity_min,
                'unit': rec.unit,
                'type': 'OPTIONAL',
                'confidence': rec.confidence_score,
                'reason': rec.reason,
                'can_remove': True
            })
    
    return samagri_list
```

#### **Step 2: Auto-Add to Booking**
```python
# bookings/signals.py or bookings/views.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Booking
from recommender.logic import get_samagri_for_puja

@receiver(post_save, sender=Booking)
def auto_add_samagri_to_booking(sender, instance, created, **kwargs):
    """
    Automatically add recommended samagri when booking is created
    """
    if created and instance.samagri_required:
        # Get recommended items
        samagri_items = get_samagri_for_puja(instance.service.id)
        
        # Create cart items or booking items
        for item_data in samagri_items:
            BookingSamagriItem.objects.create(
                booking=instance,
                samagri_item=item_data['item'],
                quantity=item_data['quantity'],
                unit=item_data['unit'],
                is_required=not item_data['can_remove'],
                auto_added=True
            )
        
        # Update booking samagri_fee
        total_samagri_cost = sum(
            item['item'].price * item['quantity']
            for item in samagri_items
        )
        instance.samagri_fee = total_samagri_cost
        instance.total_fee = instance.service_fee + total_samagri_cost
        instance.save()
```

#### **Step 3: New Model for Booking-Samagri Link**
```python
class BookingSamagriItem(models.Model):
    """
    Link between booking and samagri items (what was actually ordered)
    """
    booking = models.ForeignKey('Booking', on_delete=models.CASCADE, related_name='samagri_items')
    samagri_item = models.ForeignKey('samagri.SamagriItem', on_delete=models.CASCADE)
    
    quantity = models.IntegerField(default=1)
    unit = models.CharField(max_length=50, default='pcs')
    price_at_booking = models.DecimalField(max_digits=8, decimal_places=2)  # Price when booked
    
    is_required = models.BooleanField(default=False)  # Can't be removed
    auto_added = models.BooleanField(default=False)   # Added by AI
    user_added = models.BooleanField(default=False)   # User manually added
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('booking', 'samagri_item')
```

---

## 📊 **3. Rule-Based AI Logic (Simple Start)**

### **Rules for Common Pujas:**

```python
# recommender/puja_rules.py

PUJA_SAMAGRI_RULES = {
    'Griha Pravesh': {
        'essential': [
            ('Kumkum', 1, 'packet'),
            ('Haldi (Turmeric)', 100, 'grams'),
            ('Rice (Akshat)', 500, 'grams'),
            ('Coconut', 2, 'pcs'),
            ('Mango Leaves', 1, 'bunch'),
            ('Incense Sticks (Agarbatti)', 2, 'packet'),
            ('Camphor', 1, 'packet'),
            ('Ghee', 100, 'ml'),
            ('Cotton Wicks', 1, 'packet'),
            ('Flowers (Marigold)', 1, 'garland'),
            ('Kalash (pot)', 1, 'pcs'),
        ],
        'optional': [
            ('Supari (Betel Nut)', 50, 'grams'),
            ('Pan Leaves', 12, 'pcs'),
            ('Sugar', 250, 'grams'),
            ('Dry Fruits', 100, 'grams'),
        ]
    },
    
    'Satyanarayan Puja': {
        'essential': [
            ('Kumkum', 1, 'packet'),
            ('Haldi', 100, 'grams'),
            ('Rice', 500, 'grams'),
            ('Coconut', 1, 'pcs'),
            ('Banana', 12, 'pcs'),
            ('Incense Sticks', 2, 'packet'),
            ('Ghee', 200, 'ml'),
            ('Sugar', 500, 'grams'),
            ('Panchamrit ingredients', 1, 'set'),
        ],
        'optional': [
            ('Flowers', 1, 'garland'),
            ('Dry Fruits', 200, 'grams'),
        ]
    },
    
    'Wedding Ceremony': {
        'essential': [
            ('Kumkum', 2, 'packet'),
            ('Haldi', 250, 'grams'),
            ('Rice', 1, 'kg'),
            ('Coconut', 5, 'pcs'),
            ('Mango Leaves', 2, 'bunch'),
            ('Incense Sticks', 5, 'packet'),
            ('Ghee', 500, 'ml'),
            ('Red Thread (Mauli)', 1, 'roll'),
            ('Flowers (Rose & Marigold)', 5, 'garland'),
            ('Sacred Fire Wood', 1, 'bundle'),
        ],
        'optional': [
            ('Sandalwood Paste', 1, 'packet'),
            ('Rose Water', 1, 'bottle'),
        ]
    },
}

def get_rule_based_recommendations(puja_name):
    """
    Simple rule-based system before ML
    """
    rules = PUJA_SAMAGRI_RULES.get(puja_name, {})
    
    recommendations = []
    
    # Essential items
    for item_name, qty, unit in rules.get('essential', []):
        try:
            item = SamagriItem.objects.get(name__icontains=item_name)
            recommendations.append({
                'item': item,
                'quantity': qty,
                'unit': unit,
                'type': 'ESSENTIAL',
                'confidence': 1.0,
                'reason': f'Required for {puja_name}'
            })
        except SamagriItem.DoesNotExist:
            pass  # Log missing items
    
    # Optional items
    for item_name, qty, unit in rules.get('optional', []):
        try:
            item = SamagriItem.objects.get(name__icontains=item_name)
            recommendations.append({
                'item': item,
                'quantity': qty,
                'unit': unit,
                'type': 'OPTIONAL',
                'confidence': 0.8,
                'reason': f'Commonly used in {puja_name}'
            })
        except SamagriItem.DoesNotExist:
            pass
    
    return recommendations
```

---

## 🚀 **4. Implementation Checklist**

### **Database Setup:**
- [ ] Create `SamagriRecommendation` model in `recommender/models.py`
- [ ] Create `BookingSamagriItem` model in `bookings/models.py`
- [ ] Create `PujaTemplate` model (optional)
- [ ] Run migrations

### **Backend Logic:**
- [ ] Create `recommender/logic.py` with recommendation functions
- [ ] Create `recommender/puja_rules.py` with rule-based logic
- [ ] Add signal in `bookings/signals.py` for auto-adding samagri
- [ ] Create API endpoint: `POST /api/bookings/{id}/samagri/` (get recommendations)
- [ ] Create API endpoint: `PATCH /api/bookings/{id}/samagri/{item_id}/` (edit quantity)

### **Frontend:**
- [ ] Update `BookingForm.tsx` to show samagri preview
- [ ] Create `SamagriRecommendationCard.tsx` component
- [ ] Add "Review Samagri Items" step in booking flow
- [ ] Allow users to add/remove optional items
- [ ] Show real-time price calculation

### **Admin Panel:**
- [ ] Create admin interface for `SamagriRecommendation`
- [ ] Add bulk import for samagri mappings
- [ ] Analytics dashboard for recommendation accuracy

---

## 📈 **5. Future ML Enhancements**

### **Phase 3: Machine Learning Model**
```python
# Use collaborative filtering or content-based filtering
# Train on historical booking + samagri purchase data

Features:
- Puja type
- Season (festival time)
- User demographics
- Budget range
- Historical purchases
- Pandit recommendations

Model Output:
- Recommended items with confidence scores
- Estimated quantities
- Price optimization
```

---

## ✅ **Summary**

**Current Status:**
- ✅ All core database models implemented (9/10)
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

