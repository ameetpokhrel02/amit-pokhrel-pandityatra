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
        Returns a recommended list of samagri items for a given puja/service using AI/rule-based logic.
        Expects: { "puja_id": int, "user_notes": str (optional) }
        """
        puja_id = request.data.get("puja_id")
        user_notes = request.data.get("user_notes", "")
        if not puja_id:
            return Response({"error": "puja_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            puja = Puja.objects.get(id=puja_id)
        except Puja.DoesNotExist:
            return Response({"error": "Puja not found"}, status=status.HTTP_404_NOT_FOUND)

        # Compose prompt for AI
        prompt = f"""
You are a Vedic ritual expert. Given the puja: '{puja.name}' and the following user notes: '{user_notes}', recommend a list of samagri items (with quantity and unit) needed for this puja. Respond as a JSON array of objects with fields: name, quantity, unit. Example: [{{"name": "Rice", "quantity": 1, "unit": "kg"}}, ...]
"""
        try:
            ai_response = ask_pandityatra_ai(prompt)
        except Exception as e:
            return Response({"error": f"AI error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Try to parse AI response as JSON
        import json
        try:
            items = json.loads(ai_response)
        except Exception:
            return Response({"error": "AI did not return valid JSON", "raw": ai_response}, status=status.HTTP_502_BAD_GATEWAY)

        # Optionally, match names to SamagriItem DB for price/unit
        results = []
        for item in items:
            name = item.get("name")
            quantity = item.get("quantity", 1)
            unit = item.get("unit", "pcs")
            db_item = SamagriItem.objects.filter(name__iexact=name).first()
            results.append({
                "name": name,
                "quantity": quantity,
                "unit": unit,
                "price": float(db_item.price) if db_item else None,
                "id": db_item.id if db_item else None
            })
        return Response({"recommendations": results})
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
                    return_url = f"{settings.FRONTEND_URL}/shop/payment/verify"
                    website_url = settings.FRONTEND_URL
                    success, pidx, payment_url = initiate_khalti_payment(
                        total_amount, 
                        f"SHOP-{order.id}", 
                        return_url, 
                        website_url
                    )
                    if success:
                        order.transaction_id = pidx
                        order.save()
                        return Response({"payment_url": payment_url, "order_id": order.id})
                    else:
                        raise Exception("Khalti initiation failed")

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