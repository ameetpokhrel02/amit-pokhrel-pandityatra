from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.conf import settings
from .models import SamagriItem, ShopOrder, ShopOrderItem, ShopOrderStatus, SamagriCategory, PujaSamagriRequirement
from .serializers import (
    SamagriCategorySerializer, 
    SamagriItemSerializer, 
    ShopOrderSerializer,
    ShopCheckoutSerializer,
    PujaSamagriRequirementSerializer
)
from services.models import Puja
from services.ai_chat import ask_pandityatra_ai
from rest_framework.views import APIView

# --- AI-based Samagri Recommendation Endpoint ---
class AISamagriRecommendationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Enhanced AI-based samagri recommendation with location context and confidence scoring.
        Expects: { 
            "puja_id": int, 
            "user_notes": str (optional),
            "location": str (optional),
            "customer_timezone": str (optional),
            "customer_location": str (optional),
            "budget_preference": str (optional)
        }
        """
        puja_id = request.data.get("puja_id")
        user_notes = request.data.get("user_notes", "")
        location = request.data.get("location", "ONLINE")
        customer_timezone = request.data.get("customer_timezone", "UTC")
        customer_location = request.data.get("customer_location", "")
        budget_preference = request.data.get("budget_preference", "standard")
        
        if not puja_id:
            return Response({"error": "puja_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            puja = Puja.objects.get(id=puja_id)
        except Puja.DoesNotExist:
            return Response({"error": "Puja not found"}, status=status.HTTP_404_NOT_FOUND)

        # Enhanced AI prompt with context
        location_context = self._get_location_context(customer_timezone, customer_location)
        
        prompt = f"""
You are a Vedic ritual expert with deep knowledge of regional variations and modern adaptations.

PUJA DETAILS:
- Name: {puja.name}
- Description: {puja.description}
- Location: {location} (ONLINE/HOME/TEMPLE/PANDIT_LOCATION)

CONTEXT:
- User timezone: {customer_timezone}
- Location context: {location_context}
- User notes: {user_notes}
- Budget preference: {budget_preference}

TASK: Recommend samagri items for this puja considering:
1. Essential vs optional items
2. Location-specific adaptations (online pujas need fewer physical items)
3. Regional availability
4. Budget considerations
5. Modern alternatives where appropriate

Respond as a JSON array with objects containing:
- name: Item name
- quantity: Number needed
- unit: Measurement unit (kg, pcs, liters, etc.)
- is_essential: true/false
- confidence: 0.0-1.0 (how confident you are about this recommendation)
- reason: Brief explanation why this item is needed
- alternatives: Array of alternative items if applicable

Example:
[
  {
    "name": "Rice",
    "quantity": 1,
    "unit": "kg",
    "is_essential": true,
    "confidence": 0.95,
    "reason": "Essential offering for all Hindu pujas",
    "alternatives": ["Basmati rice", "Brown rice"]
  }
]
"""

        try:
            ai_response = ask_pandityatra_ai(prompt)
        except Exception as e:
            return Response({"error": f"AI error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Parse and enhance AI response
        try:
            items = json.loads(ai_response)
        except Exception:
            # Fallback to rule-based recommendations
            items = self._get_fallback_recommendations(puja, location)

        # Match with database items and add pricing
        results = []
        for item in items:
            name = item.get("name", "")
            quantity = item.get("quantity", 1)
            unit = item.get("unit", "pcs")
            is_essential = item.get("is_essential", False)
            confidence = item.get("confidence", 0.7)
            reason = item.get("reason", f"Recommended for {puja.name}")
            alternatives = item.get("alternatives", [])
            
            # Try to find matching database item
            db_item = SamagriItem.objects.filter(
                name__icontains=name.split()[0]  # Match first word
            ).first()
            
            # If not found, try alternatives
            if not db_item and alternatives:
                for alt in alternatives:
                    db_item = SamagriItem.objects.filter(
                        name__icontains=alt.split()[0]
                    ).first()
                    if db_item:
                        break
            
            results.append({
                "name": name,
                "quantity": quantity,
                "unit": unit,
                "is_essential": is_essential,
                "confidence": confidence,
                "reason": reason,
                "alternatives": alternatives,
                "price": float(db_item.price) if db_item else self._estimate_price(name, quantity),
                "id": db_item.id if db_item else None,
                "in_stock": db_item.stock_quantity > 0 if db_item else True,
                "category": db_item.category.name if db_item and db_item.category else "General"
            })
        
        # Sort by confidence and essentiality
        results.sort(key=lambda x: (x["is_essential"], x["confidence"]), reverse=True)
        
        return Response({
            "recommendations": results,
            "context": {
                "puja_name": puja.name,
                "location": location,
                "total_items": len(results),
                "essential_items": len([r for r in results if r["is_essential"]]),
                "estimated_total": sum(r["price"] * r["quantity"] for r in results)
            }
        })

    def _get_location_context(self, timezone, location_coords):
        """Extract location context from timezone and coordinates"""
        context = []
        
        if "Kathmandu" in timezone or "Nepal" in timezone:
            context.append("Nepal - traditional items readily available")
        elif "Australia" in timezone:
            context.append("Australia - may need alternatives for some traditional items")
        elif "America" in timezone or "US" in timezone:
            context.append("USA - focus on easily available items")
        else:
            context.append("International - consider item availability")
            
        return ", ".join(context)

    def _get_fallback_recommendations(self, puja, location):
        """Rule-based fallback recommendations when AI fails"""
        base_items = [
            {"name": "Rice", "quantity": 1, "unit": "kg", "is_essential": True, "confidence": 0.9},
            {"name": "Ghee", "quantity": 250, "unit": "ml", "is_essential": True, "confidence": 0.9},
            {"name": "Incense Sticks", "quantity": 1, "unit": "pack", "is_essential": True, "confidence": 0.8},
            {"name": "Flowers", "quantity": 1, "unit": "garland", "is_essential": False, "confidence": 0.7},
        ]
        
        # Adjust for online pujas
        if location == "ONLINE":
            # Remove physical items that can't be used online
            base_items = [item for item in base_items if item["name"] not in ["Flowers"]]
            
        return base_items

    def _estimate_price(self, item_name, quantity):
        """Estimate price for items not in database"""
        price_estimates = {
            "rice": 100,
            "ghee": 200,
            "incense": 50,
            "flowers": 100,
            "coconut": 30,
            "banana": 20,
            "milk": 60,
            "sugar": 80,
        }
        
        for key, price in price_estimates.items():
            if key.lower() in item_name.lower():
                return price * quantity
                
        return 50 * quantity  # Default estimate
from payments.utils import initiate_khalti_payment, convert_npr_to_usd
import stripe

class SamagriCategoryViewSet(viewsets.ModelViewSet):
    queryset = SamagriCategory.objects.all()
    serializer_class = SamagriCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class SamagriItemViewSet(viewsets.ModelViewSet):
    queryset = SamagriItem.objects.all()
    serializer_class = SamagriItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = SamagriItem.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

class PujaSamagriRequirementViewSet(viewsets.ModelViewSet):
    queryset = PujaSamagriRequirement.objects.all()
    serializer_class = PujaSamagriRequirementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = PujaSamagriRequirement.objects.all()
        puja_id = self.request.query_params.get('puja')
        if puja_id:
            queryset = queryset.filter(puja_id=puja_id)
        return queryset

class ShopCheckoutViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def initiate(self, request):
        serializer = ShopCheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        cart_items = data['items']
        payment_method = data['payment_method']

        try:
            with transaction.atomic():
                # 1. Create the Order
                order = ShopOrder.objects.create(
                    user=request.user,
                    full_name=data['full_name'],
                    phone_number=data['phone_number'],
                    shipping_address=data['shipping_address'],
                    city=data['city'],
                    payment_method=payment_method
                )

                total_amount = 0
                for item in cart_items:
                    samagri_item = SamagriItem.objects.select_for_update().get(id=item['id'])
                    
                    # Stock Check
                    if samagri_item.stock_quantity < item['quantity']:
                        raise Exception(f"Insufficient stock for {samagri_item.name}")

                    # Deduct Stock
                    samagri_item.stock_quantity -= item['quantity']
                    samagri_item.save()

                    # Create Order Item
                    ShopOrderItem.objects.create(
                        order=order,
                        samagri_item=samagri_item,
                        quantity=item['quantity'],
                        price_at_purchase=samagri_item.price
                    )
                    total_amount += samagri_item.price * item['quantity']

                order.total_amount = total_amount
                order.save()

                # 2. Payment Gateway Integration
                if payment_method == 'KHALTI':
                    # Khalti (NPR)
                    return_url = f"{settings.FRONTEND_URL}/payment/khalti/verify"
                    website_url = settings.FRONTEND_URL
                    
                    user_info = {
                        "name": data['full_name'],
                        "email": request.user.email,
                        "phone": data['phone_number']
                    }

                    success, pidx_or_error, payment_url = initiate_khalti_payment(
                        total_amount, 
                        f"SHOP-{order.id}", 
                        return_url, 
                        website_url,
                        user_info
                    )
                    if success:
                        order.transaction_id = pidx_or_error
                        order.save()
                        return Response({"payment_url": payment_url, "order_id": order.id})
                    else:
                        raise Exception(f"Khalti Error: {pidx_or_error}")

                elif payment_method == 'STRIPE':
                    # Stripe (USD)
                    stripe.api_key = settings.STRIPE_SECRET_KEY
                    amount_usd = convert_npr_to_usd(total_amount)
                    
                    checkout_session = stripe.checkout.Session.create(
                        payment_method_types=['card'],
                        line_items=[{
                            'price_data': {
                                'currency': 'usd',
                                'product_data': {'name': f'PanditYatra Order #{order.id}'},
                                'unit_amount': int(amount_usd * 100),
                            },
                            'quantity': 1,
                        }],
                        mode='payment',
                        success_url=f"{settings.FRONTEND_URL}/shop/payment/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order.id}",
                        cancel_url=f"{settings.FRONTEND_URL}/shop/payment/cancel?order_id={order.id}",
                        metadata={'order_id': order.id, 'type': 'shop_order'}
                    )
                    order.transaction_id = checkout_session.id
                    order.save()
                    return Response({"payment_url": checkout_session.url, "order_id": order.id})

        except SamagriItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Unknown error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)