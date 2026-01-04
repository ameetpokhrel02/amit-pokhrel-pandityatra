# AI Recommender & Samagri Auto-Adder System - Implementation Guide

**Date:** January 4, 2026  
**Status:** ✅ PHASE 2 - INITIAL IMPLEMENTATION COMPLETE  
**Version:** 1.0  

---

## 📋 Overview

The AI Recommender System provides intelligent recommendations for **samagri** (ritual materials) based on puja type, user preferences, and historical purchasing patterns. The system includes:

1. **Samagri Recommendation Engine** - AI-driven samagri suggestions
2. **Samagri Auto-Adder** - Automatically adds essential items to bookings
3. **User Preference Tracking** - Learns from user behavior
4. **Recommendation Analytics** - Tracks recommendation accuracy

---

## 🎯 Core Features

### 1. **SamagriRecommendation Model**
Stores AI recommendations for samagri items linked to specific pujas.

```python
# Key Fields:
- puja: ForeignKey to Puja (service type)
- samagri_item: ForeignKey to SamagriItem
- confidence_score: 0.0-1.0 (AI confidence)
- is_essential: Boolean (must-have items)
- is_optional: Boolean (user can choose)
- priority: 1-10 ranking
- category: ESSENTIAL, TRADITIONAL, OPTIONAL, LUXURY
- quantity_default: Default quantity to recommend
- reason: Why this item is recommended
- times_recommended: Tracking metric
- times_purchased: Tracking metric
- purchase_rate: Conversion tracking
- is_seasonal: Seasonal puja flag
- seasonal_months: Comma-separated months (1-12)
```

### 2. **BookingSamagriItem Model**
Links samagri items to bookings with user selections.

```python
# Key Fields:
- booking: ForeignKey to Booking
- samagri_item: ForeignKey to SamagriItem
- recommendation: ForeignKey to SamagriRecommendation
- status: RECOMMENDED, SELECTED, AUTO_ADDED, REMOVED
- quantity: User-selected quantity
- unit_price: Price at time of booking
- total_price: quantity × unit_price
- is_essential: Cannot remove
- is_optional: User can choose
- is_included: Currently in booking
```

### 3. **UserSamagriPreference Model**
Tracks user preferences and buying history.

```python
# Key Fields:
- user: ForeignKey to User
- samagri_item: ForeignKey to SamagriItem
- times_purchased: Historical count
- is_favorite: User marked as favorite
- never_recommend: User opted out
- prefer_bulk: User prefers larger quantities
```

### 4. **PujaTemplate Model**
Pre-configured samagri bundles for common pujas.

```python
# Key Fields:
- name: Template name (e.g., "Complete Havan Kit")
- puja_type: Type of puja
- samagri_items: M2M to samagri via PujaTemplateItem
- estimated_cost: Bundle total cost
- is_featured: Show on homepage
```

### 5. **RecommendationLog Model**
Analytics tracking for recommendation accuracy.

```python
# Key Fields:
- user: User who saw recommendations
- booking: Associated booking
- recommendations: M2M to SamagriRecommendation
- shown_count: How many times shown
- clicked_count: User interactions
- purchased_count: Actually purchased
- conversion_rate: clicked/shown percentage
```

---

## 🧠 Recommendation Logic

### **SamagriRecommender Class** (logic.py)

Main recommendation engine with methods:

#### `get_recommendations(limit=10, min_confidence=0.3)`
Get top N recommendations for a puja.

```python
recommender = SamagriRecommender(puja=puja_obj)
recommendations = recommender.get_recommendations(limit=10)
# Returns: Sorted by confidence_score & priority
```

#### `get_personalized_recommendations(limit=10)`
Personalized to user's preferences.

```python
recommender = SamagriRecommender(user=user_obj, puja=puja_obj)
recommendations = recommender.get_personalized_recommendations()
# Filters by: never_recommend flag, favorites boost confidence
```

#### `get_seasonal_recommendations(limit=10)`
Recommendations specific to current month.

```python
recommender = SamagriRecommender(puja=puja_obj)
seasonal = recommender.get_seasonal_recommendations()
# Only items with is_seasonal=True and matching seasonal_months
```

#### `auto_add_recommendations(confidence_threshold=0.8)`
Auto-adds high-confidence items to booking.

```python
recommender = SamagriRecommender(user=user_obj, puja=puja_obj, booking=booking_obj)
added_items = recommender.auto_add_recommendations(threshold=0.8)
# Only adds items with: is_essential=True AND confidence >= threshold
# Automatically updates booking.samagri_fee
# Returns: List of BookingSamagriItem objects created
```

#### `add_recommendation_to_booking(recommendation, quantity=None)`
User adds a recommended item to booking.

```python
booking_item = recommender.add_recommendation_to_booking(recommendation, quantity=2)
# Creates BookingSamagriItem with status='SELECTED'
# Increments recommendation.times_recommended
# Updates booking samagri fees
```

#### `remove_samagri_item(booking_item)`
Remove item from booking (not if essential).

```python
recommender.remove_samagri_item(booking_item)
# Sets is_included=False, status='REMOVED'
# Cannot remove if is_essential=True
```

#### `update_quantity(booking_item, quantity)`
Update quantity in booking.

```python
recommender.update_quantity(booking_item, new_quantity=3)
# Recalculates total_price
# Updates booking samagri_fee
```

---

## 📊 API Endpoints

### **Samagri Recommendations**

#### `GET /api/recommender/recommendations/`
List all recommendations.

```bash
curl http://localhost:8000/api/recommender/recommendations/
```

#### `GET /api/recommender/recommendations/by_puja/`
Get recommendations for a puja.

```bash
curl "http://localhost:8000/api/recommender/recommendations/by_puja/?puja_id=1&limit=10&min_confidence=0.3"
```

#### `GET /api/recommender/recommendations/personalized/`
Get personalized recommendations for user.

```bash
curl "http://localhost:8000/api/recommender/recommendations/personalized/?puja_id=1&limit=10"
# Requires authentication
```

#### `GET /api/recommender/recommendations/seasonal/`
Get seasonal recommendations.

```bash
curl "http://localhost:8000/api/recommender/recommendations/seasonal/?puja_id=1"
```

#### `GET /api/recommender/recommendations/stats/`
Get recommendation statistics.

```bash
curl "http://localhost:8000/api/recommender/recommendations/stats/?puja_id=1&days=30"
# Returns: total_shown, total_purchased, accuracy_percentage
```

---

### **Booking Samagri Management**

#### `GET /api/recommender/bookings/{booking_id}/samagri/`
Get samagri items in booking.

```bash
curl http://localhost:8000/api/recommender/bookings/1/samagri/
```

#### `POST /api/recommender/bookings/{booking_id}/samagri/recommendations/`
Get recommendations for booking.

```bash
curl -X POST http://localhost:8000/api/recommender/bookings/1/samagri/recommendations/ \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10,
    "min_confidence": 0.3,
    "personalized": true
  }'
```

#### `POST /api/recommender/bookings/{booking_id}/samagri/auto-add/`
Auto-add recommendations to booking.

```bash
curl -X POST http://localhost:8000/api/recommender/bookings/1/samagri/auto-add/ \
  -H "Content-Type: application/json" \
  -d '{"confidence_threshold": 0.8}'

# Response:
{
  "message": "3 items auto-added",
  "items_added": 3,
  "booking_id": 1,
  "total_samagri_fee": "5000.00",
  "total_fee": "10500.00"
}
```

#### `POST /api/recommender/bookings/{booking_id}/samagri/add-item/`
User adds recommended item to booking.

```bash
curl -X POST http://localhost:8000/api/recommender/bookings/1/samagri/add-item/ \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_id": 5,
    "quantity": 2
  }'
```

---

### **Puja Templates**

#### `GET /api/recommender/templates/`
List all puja templates.

```bash
curl http://localhost:8000/api/recommender/templates/
```

#### `GET /api/recommender/templates/featured/`
Get featured templates.

```bash
curl http://localhost:8000/api/recommender/templates/featured/
```

#### `POST /api/recommender/templates/`
Create puja template (admin only).

```bash
curl -X POST http://localhost:8000/api/recommender/templates/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Complete Havan Kit",
    "puja_type": "Havan",
    "description": "All items needed for traditional havan",
    "estimated_cost": "2500.00",
    "is_featured": true,
    "samagri_items_ids": [1, 2, 3, 4, 5]
  }'
```

---

### **User Preferences**

#### `GET /api/recommender/user/preferences/`
Get user's samagri preferences.

```bash
curl http://localhost:8000/api/recommender/user/preferences/
# Requires authentication
```

#### `GET /api/recommender/user/preferences/insights/`
Get user preference insights.

```bash
curl http://localhost:8000/api/recommender/user/preferences/insights/

# Response:
{
  "total_purchases": 15,
  "favorites_count": 3,
  "never_recommend_count": 2,
  "top_items": [
    {
      "name": "Ghee",
      "times_purchased": 12,
      "total_spent": "5600.00"
    }
  ]
}
```

#### `POST /api/recommender/user/preferences/`
Mark item as favorite or never recommend.

```bash
curl -X POST http://localhost:8000/api/recommender/user/preferences/ \
  -H "Content-Type: application/json" \
  -d '{
    "samagri_item_id": 3,
    "is_favorite": true,
    "never_recommend": false
  }'
```

---

## 🔄 Workflow: Anita Books a Puja with Auto-Recommendations

### Step 1: Anita Selects Pandit & Service
```
User: Anita (customer)
Service: Havan (fire ritual)
Pandit: Ramesh
Date: Tomorrow, 10 AM
Location: Home
```

### Step 2: System Creates Booking
```python
booking = Booking.objects.create(
    user=anita,
    pandit=ramesh,
    service=havan_puja,
    service_location='HOME',
    booking_date=tomorrow,
    booking_time='10:00',
    service_fee=5000.00  # Pandit fee
)
```

### Step 3: AI Auto-Adds Essential Items
```python
# Backend triggers after booking creation
recommender = SamagriRecommender(
    user=anita,
    puja=havan_puja,
    booking=booking
)

# Auto-add high-confidence essential items
auto_added = recommender.auto_add_recommendations(confidence_threshold=0.8)
# Adds: Ghee (1L), Flowers, Incense, etc.

# Booking updated:
booking.samagri_fee = 2500.00  # Auto-added items
booking.total_fee = 7500.00    # service_fee + samagri_fee
```

### Step 4: Frontend Shows Booking Details
```json
{
  "booking_id": 42,
  "service": "Havan",
  "pandit": "Ramesh",
  "service_fee": 5000.00,
  "samagri_fee": 2500.00,
  "total_fee": 7500.00,
  "samagri_items": [
    {
      "id": 1,
      "name": "Ghee (1L)",
      "quantity": 1,
      "unit_price": 800.00,
      "total_price": 800.00,
      "status": "AUTO_ADDED",
      "is_essential": true,
      "is_included": true,
      "reason": "Essential for Havan ceremony"
    },
    {
      "id": 2,
      "name": "Flowers Mix",
      "quantity": 2,
      "unit_price": 500.00,
      "total_price": 1000.00,
      "status": "AUTO_ADDED",
      "is_essential": true
    }
  ],
  "recommended_items": [
    // Optional items with lower confidence
  ]
}
```

### Step 5: Anita Can Modify Samagri
```
Actions available:
✓ Increase/decrease quantity (changes total_price)
✓ Add recommended items from suggestions
✗ Cannot remove essential items (is_essential=true)
✓ Can remove optional items
```

### Step 6: Proceed to Payment
```
Final amounts:
- Service Fee: 5000.00
- Samagri Fee: 2500.00 (auto-added essentials)
- Total: 7500.00

Anita confirms and pays via Khalti
```

---

## 📈 Analytics & Insights

### **Recommendation Accuracy**
```python
analytics = RecommendationAnalytics()
stats = analytics.get_recommendation_accuracy(puja_obj, days=30)

# Returns:
{
    'total_shown': 150,           # Times recommended
    'total_purchased': 105,       # Actually purchased
    'accuracy_percentage': 70.0,  # Conversion rate
    'recommendations_count': 12   # How many items recommended
}
```

### **User Insights**
```python
insights = analytics.get_user_preference_insights(user_obj)

# Returns:
{
    'total_purchases': 24,
    'favorites_count': 3,
    'never_recommend_count': 2,
    'top_items': [
        {'name': 'Ghee', 'times_purchased': 12, 'total_spent': '5600.00'},
        {'name': 'Flowers', 'times_purchased': 8, 'total_spent': '4000.00'}
    ]
}
```

---

## 🚀 Setup & Usage

### 1. **Create Migrations**
```bash
python manage.py makemigrations recommender bookings
python manage.py migrate
```

### 2. **Seed Initial Data**
```bash
# Create sample recommendations
python manage.py seed_recommendations

# Register in Django admin
python manage.py createsuperuser
# Navigate to: http://localhost:8000/admin/
```

### 3. **Admin Interface**

Access at `/admin/`:
- Create/manage pujas in Services
- Create/manage samagri items in Samagri
- Create SamagriRecommendation entries
- Create PujaTemplate bundles

### 4. **Frontend Integration**

#### Show Recommendations
```typescript
// Frontend: Get recommendations for a puja
const response = await fetch(
  '/api/recommender/recommendations/personalized/?puja_id=1&limit=10',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
const recommendations = await response.json();
```

#### Auto-Add to Booking
```typescript
// Trigger auto-add after booking creation
const response = await fetch(
  `/api/recommender/bookings/${bookingId}/samagri/auto-add/`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ confidence_threshold: 0.8 })
  }
);
const result = await response.json();
// Updates booking with auto-added items
```

---

## 🔮 Future Enhancements

### **Phase 2.1: ML Models**
- Collaborative filtering (user-item similarity)
- Content-based filtering (samagri categories)
- Time-series analysis for seasonal patterns
- User clustering for persona-based recommendations

### **Phase 2.2: Advanced Features**
- Real-time bundling discounts
- A/B testing for recommendation variants
- Feedback loops for model improvement
- Push notifications for trending items

### **Phase 2.3: Integrations**
- Inventory management auto-reorder
- Supplier integration for pricing
- Multi-vendor samagri comparison
- Ratings/reviews per samagri item

---

## 🐛 Troubleshooting

### **Empty Recommendations**
```
Issue: No items showing up
Solution: 
1. Ensure SamagriRecommendation records exist
2. Check confidence_score >= 0.3
3. Verify is_active=True
4. Run: python manage.py seed_recommendations
```

### **Samagri Fee Not Updating**
```
Issue: Total fee doesn't change when adding items
Solution:
1. Call calculate_total_price() on BookingSamagriItem
2. Call _update_booking_samagri_fee() on booking
3. Verify unit_price is set correctly
```

### **Can't Remove Essential Items**
```
Issue: "Cannot remove essential items" error
Solution:
1. This is intentional - essential items cannot be removed
2. User should be informed via UI that some items are required
3. Admin can change is_essential=False to make removable
```

---

## 📞 Support

**For issues or questions:**
- Check DATABASE_ENHANCEMENTS.md for schema details
- Review logic.py for recommendation algorithm
- Test with: `python manage.py shell` + manual testing
- Admin dashboard at: http://localhost:8000/admin/

---

**Status:** ✅ Implementation Complete  
**Next Steps:** Phase 2.2 - ML Model Integration  
**Estimated:** 2-3 weeks
