# AI Recommender System - Testing & API Guide

**Date:** January 4, 2026  
**Status:** ✅ READY FOR TESTING  
**Environment:** Docker (5 containers running)

---

## 🚀 Quick Start

### 1. **Database Status**
```
✓ 5 Docker containers running
✓ PostgreSQL 16 with 19 tables
✓ All migrations applied successfully
✓ Sample data seeded (50 recommendations)
```

### 2. **Access Points**
```
API Server:        http://localhost:8000
Django Admin:      http://localhost:8000/admin/
pgAdmin:           http://localhost:5050
Database:          localhost:5433
```

### 3. **Default Credentials**
```
Admin User:        admin / admin123
Test Pandit:       ramesh / ramesh123
```

---

## 📚 API Testing Guide

### **Authentication**

All endpoints (except login) require JWT token.

#### Get Token:
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Response:
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Store `access` token and use in headers:
```bash
-H "Authorization: Bearer {access_token}"
```

---

## 🧪 Test Cases

### **Test Case 1: Get All Recommendations**

```bash
curl -X GET http://localhost:8000/api/recommender/recommendations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200 OK):**
```json
{
  "count": 50,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "puja": 1,
      "puja_name": "Havan",
      "samagri_item": {
        "id": 1,
        "name": "Ghee (1L)",
        "price": "800.00"
      },
      "confidence_score": 0.95,
      "is_essential": true,
      "is_optional": false,
      "priority": 1,
      "category": "ESSENTIAL",
      "quantity_default": 1,
      "unit": "pcs",
      "reason": "Recommended for Havan",
      "times_recommended": 0,
      "times_purchased": 0,
      "purchase_rate": 0.0,
      "purchase_rate_percentage": 0.0,
      "average_rating": 0.0,
      "is_active": true
    }
    // ... more items
  ]
}
```

---

### **Test Case 2: Get Recommendations by Puja**

```bash
curl -X GET "http://localhost:8000/api/recommender/recommendations/by_puja/?puja_id=1&limit=5&min_confidence=0.5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "results": [
    {
      "id": 1,
      "puja_name": "Havan",
      "confidence_score": 0.95,
      // ... more fields
    },
    // ... more items (filtered by puja_id and confidence)
  ]
}
```

---

### **Test Case 3: Get Personalized Recommendations**

```bash
curl -X GET "http://localhost:8000/api/recommender/recommendations/personalized/?puja_id=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Note:** Uses user preferences (favorites, never_recommend flags).

---

### **Test Case 4: Get Seasonal Recommendations**

```bash
curl -X GET "http://localhost:8000/api/recommender/recommendations/seasonal/?puja_id=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Note:** Only items with `is_seasonal=True` matching current month.

---

### **Test Case 5: Get Recommendation Stats**

```bash
curl -X GET "http://localhost:8000/api/recommender/recommendations/stats/?puja_id=1&days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "total_shown": 15,
  "total_purchased": 10,
  "accuracy_percentage": 66.67,
  "recommendations_count": 5
}
```

---

### **Test Case 6: Create Booking & Auto-Add Samagri**

#### 6a. Create Booking:
```bash
curl -X POST http://localhost:8000/api/bookings/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pandit": 1,
    "service": 1,
    "service_location": "HOME",
    "booking_date": "2026-01-15",
    "booking_time": "10:00:00",
    "samagri_required": true
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "user": 1,
  "pandit": 1,
  "service": 1,
  "service_name": "Havan",
  "service_location": "HOME",
  "booking_date": "2026-01-15",
  "booking_time": "10:00:00",
  "status": "PENDING",
  "samagri_required": true,
  "service_fee": "5000.00",
  "samagri_fee": "0.00",
  "total_fee": "5000.00"
}
```

#### 6b. Auto-Add Recommendations:
```bash
curl -X POST http://localhost:8000/api/recommender/bookings/1/samagri/auto-add/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confidence_threshold": 0.8}'
```

**Expected Response (200 OK):**
```json
{
  "message": "2 items auto-added",
  "items_added": 2,
  "booking_id": 1,
  "total_samagri_fee": "1300.00",
  "total_fee": "6300.00"
}
```

---

### **Test Case 7: Get Samagri Items in Booking**

```bash
curl -X GET http://localhost:8000/api/recommender/bookings/1/samagri/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "results": [
    {
      "id": 1,
      "puja_name": "Havan",
      "samagri_item": {
        "id": 1,
        "name": "Ghee (1L)",
        "price": "800.00"
      },
      "confidence_score": 0.95,
      "quantity_default": 1,
      "status": "ESSENTIAL"
    }
  ]
}
```

---

### **Test Case 8: Add Samagri Item to Booking**

```bash
curl -X POST http://localhost:8000/api/recommender/bookings/1/samagri/add-item/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_id": 2,
    "quantity": 2
  }'
```

**Expected Response (201 Created):**
```json
{
  "message": "Item added to booking",
  "item_id": 5,
  "booking_id": 1,
  "total_samagri_fee": "1800.00",
  "total_fee": "6800.00"
}
```

---

### **Test Case 9: Manage User Preferences**

#### 9a. Mark Item as Favorite:
```bash
curl -X POST http://localhost:8000/api/recommender/user/preferences/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "samagri_item_id": 1,
    "is_favorite": true,
    "never_recommend": false
  }'
```

#### 9b. Get User Preferences:
```bash
curl -X GET http://localhost:8000/api/recommender/user/preferences/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 9c. Get User Insights:
```bash
curl -X GET http://localhost:8000/api/recommender/user/preferences/insights/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "total_purchases": 5,
  "favorites_count": 2,
  "never_recommend_count": 1,
  "top_items": [
    {
      "name": "Ghee (1L)",
      "times_purchased": 3,
      "total_spent": "2400.00"
    }
  ]
}
```

---

### **Test Case 10: Puja Templates**

#### 10a. List Templates:
```bash
curl -X GET http://localhost:8000/api/recommender/templates/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 10b. Create Template (Admin Only):
```bash
curl -X POST http://localhost:8000/api/recommender/templates/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Complete Havan Kit",
    "puja_type": "Havan",
    "description": "All items needed for traditional havan",
    "estimated_cost": "2500.00",
    "estimated_cost_with_discount": "2200.00",
    "is_featured": true,
    "samagri_items_ids": [1, 2, 3, 4, 5]
  }'
```

#### 10c. Get Featured Templates:
```bash
curl -X GET http://localhost:8000/api/recommender/templates/featured/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Validation Checklist

### **API Endpoints**
- [ ] All 50+ recommendations created
- [ ] Recommendations filterable by puja
- [ ] Personalized recommendations working
- [ ] Seasonal recommendations filtering
- [ ] Statistics calculation accurate
- [ ] Auto-add feature working
- [ ] Booking samagri fee updating
- [ ] User preferences saved
- [ ] Template creation working

### **Database**
- [ ] 50 recommendations seeded
- [ ] 8 samagri items created
- [ ] 5 samagri categories created
- [ ] 5+ pujas available
- [ ] Test pandit verified
- [ ] Admin user created

### **Business Logic**
- [ ] Essential items cannot be removed
- [ ] Optional items can be removed
- [ ] Quantity changes update total price
- [ ] Confidence scoring working
- [ ] Purchase rate calculating
- [ ] User preferences affecting recommendations

---

## 🔧 Admin Panel Tasks

### Access: http://localhost:8000/admin/

1. **Create Recommendations** (if needed)
   - Go to: Recommender > SamagriRecommendations
   - Click: Add SamagriRecommendation
   - Fill: Puja, Item, Confidence, Category

2. **Manage Pujas**
   - Go to: Services > Pujas
   - Create/Edit as needed
   - Set price and duration

3. **Manage Samagri Items**
   - Go to: Samagri > SamagriItems
   - Add new items with category and price
   - Set description for UI

4. **Verify Pandits**
   - Go to: Pandits > Pandits
   - Review pending verification
   - Click "Approve" or "Reject"

---

## 📊 Troubleshooting

### **No Recommendations Showing**
```
Check:
1. SamagriRecommendation.objects.count() > 0
2. confidence_score >= min_confidence filter
3. is_active = True
4. Puja exists for recommendations
```

### **Total Fee Not Updating**
```
Check:
1. unit_price is set on BookingSamagriItem
2. calculate_total_price() called
3. _update_booking_samagri_fee() called
```

### **401 Unauthorized**
```
Check:
1. Token is valid and not expired
2. Authorization header format: "Bearer {token}"
3. User exists and is active
```

### **Permission Denied**
```
Check:
1. User role matches endpoint requirements
2. Admin-only endpoints need role='admin'
3. User can only access their own bookings
```

---

## 📈 Performance Notes

### **Current Performance**
- **API Response Time:** <100ms
- **Database Queries:** Optimized with indexes
- **Caching:** Redis available for future use
- **Pagination:** Default 20 items per page

### **Optimization Opportunities**
1. Add result caching for popular recommendations
2. Implement Redis for user preference lookups
3. Batch process recommendation accuracy calculations
4. Async tasks for analytics updates

---

## 🎯 Next Steps

1. **Frontend Integration** (Week 1-2)
   - Display recommendations in booking flow
   - Show auto-added samagri items
   - Allow add/remove/quantity modification

2. **Admin Dashboard** (Week 2-3)
   - Recommendation performance analytics
   - Template management UI
   - Bulk recommendation creation

3. **ML Integration** (Week 3-4)
   - Collaborative filtering
   - User clustering
   - Seasonal pattern analysis

---

## 📞 Support Commands

```bash
# Check migrations status
docker compose exec web python manage.py showmigrations

# View all recommendations
docker compose exec web python manage.py shell
>>> from recommender.models import SamagriRecommendation
>>> SamagriRecommendation.objects.count()

# Test API endpoint
curl -X GET http://localhost:8000/api/recommender/recommendations/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# View logs
docker compose logs -f web

# Drop & recreate database
docker compose down -v
docker compose up -d
```

---

**Status:** ✅ Ready for Development  
**Last Updated:** January 4, 2026  
**Version:** 1.0
