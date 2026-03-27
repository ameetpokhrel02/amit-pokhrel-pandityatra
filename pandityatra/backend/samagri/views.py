import json
import io
import stripe
from groq import Groq

from django.db import transaction
from django.conf import settings
from django.http import HttpResponse
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from users.permissions import IsAdminOrReadOnly
from services.models import Puja
from payments.utils import initiate_khalti_payment, initiate_esewa_payment, convert_npr_to_usd
from adminpanel.utils import log_activity

from .models import (
    SamagriItem, ShopOrder, ShopOrderItem, ShopOrderStatus, 
    SamagriCategory, PujaSamagriRequirement, Wishlist
)
from .serializers import (
    SamagriCategorySerializer, 
    SamagriItemSerializer, 
    ShopOrderSerializer,
    ShopCheckoutSerializer,
    PujaSamagriRequirementSerializer,
    WishlistSerializer,
    WishlistAddSerializer
)

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
  {{
    "name": "Rice",
    "quantity": 1,
    "unit": "kg",
    "is_essential": true,
    "confidence": 0.95,
    "reason": "Essential offering for all Hindu pujas",
    "alternatives": ["Basmati rice", "Brown rice"]
  }}
]
"""

        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a Vedic ritual expert."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
            )
            ai_response = chat_completion.choices[0].message.content
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
            name = str(item.get("name", ""))
            quantity = item.get("quantity", 1)
            unit = str(item.get("unit", "pcs"))
            is_essential = bool(item.get("is_essential", False))
            
            try:
                confidence = float(item.get("confidence", 0.7))
            except (ValueError, TypeError):
                confidence = 0.7
                
            reason = str(item.get("reason", f"Recommended for {puja.name}"))
            alternatives = item.get("alternatives", [])
            if not isinstance(alternatives, list):
                if isinstance(alternatives, str):
                    alternatives = [alternatives]
                else:
                    alternatives = []
            
            # Try to find matching database item
            db_item = None
            if name and len(name.split()) > 0:
                db_item = SamagriItem.objects.filter(
                    name__icontains=name.split()[0]  # Match first word
                ).first()
            
            # If not found, try alternatives
            if not db_item and alternatives:
                for alt in alternatives:
                    alt_str = str(alt)
                    if alt_str and len(alt_str.split()) > 0:
                        db_item = SamagriItem.objects.filter(
                            name__icontains=alt_str.split()[0]
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


class SamagriCategoryViewSet(viewsets.ModelViewSet):
    queryset = SamagriCategory.objects.all()
    serializer_class = SamagriCategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class SamagriItemViewSet(viewsets.ModelViewSet):
    queryset = SamagriItem.objects.all()
    serializer_class = SamagriItemSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = SamagriItem.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # If not an admin, only show approved items (for the shop)
        if not self.request.user.is_staff and self.request.user.role != 'admin':
            queryset = queryset.filter(is_approved=True)
            
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        item = self.get_object()
        item.is_approved = True
        item.save()
        log_activity(user=request.user, action_type="SAMAGRI_APPROVE", details=f"Approved item {item.name}", request=request)
        return Response({"status": "approved"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        item = self.get_object()
        item.is_approved = False
        item.save()
        log_activity(user=request.user, action_type="SAMAGRI_REJECT", details=f"Rejected/Disabled item {item.name}", request=request)
        return Response({"status": "rejected"})

class PujaSamagriRequirementViewSet(viewsets.ModelViewSet):
    queryset = PujaSamagriRequirement.objects.all()
    serializer_class = PujaSamagriRequirementSerializer
    permission_classes = [IsAdminOrReadOnly]

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
                        item_name=samagri_item.name,
                        quantity=item['quantity'],
                        price_at_purchase=samagri_item.price
                    )
                    total_amount += samagri_item.price * item['quantity']

                order.total_amount = total_amount
                order.save()
                
                # Log Activity
                log_activity(
                    user=request.user, 
                    action_type="SHOP_ORDER", 
                    details=f"Placed order #{order.id} for {len(cart_items)} items total NPR {total_amount}", 
                    request=request
                )

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

                elif payment_method == 'ESEWA':
                    # eSewa (NPR) - Nepal's Leading Digital Wallet
                    success_url = f"{settings.FRONTEND_URL}/shop/payment/esewa/verify?order_id={order.id}"
                    failure_url = f"{settings.FRONTEND_URL}/shop/payment/cancel?order_id={order.id}"
                    
                    success, payment_url, form_data, transaction_uuid = initiate_esewa_payment(
                        total_amount,
                        f"SHOP-{order.id}",
                        success_url,
                        failure_url
                    )
                    if success:
                        order.transaction_id = transaction_uuid
                        order.save()
                        return Response({
                            "payment_url": payment_url,
                            "form_data": form_data,
                            "order_id": order.id,
                            "gateway": "ESEWA"
                        })
                    else:
                        raise Exception(f"eSewa Error: {payment_url}")

        except SamagriItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Unknown error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='my-orders')
    def my_orders(self, request):
        """GET /api/samagri/checkout/my-orders/ — List current user's shop orders"""
        orders = ShopOrder.objects.filter(user=request.user).prefetch_related(
            'items', 'items__samagri_item'
        ).order_by('-created_at')
        serializer = ShopOrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='detail')
    def order_detail(self, request, pk=None):
        """GET /api/samagri/checkout/{id}/detail/ — Single order detail"""
        try:
            order = ShopOrder.objects.prefetch_related(
                'items', 'items__samagri_item'
            ).get(id=pk, user=request.user)
            serializer = ShopOrderSerializer(order)
            return Response(serializer.data)
        except ShopOrder.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='invoice')
    def invoice(self, request, pk=None):
        """GET /api/samagri/checkout/{id}/invoice/ — Download PDF invoice for a shop order"""
        try:
            order = ShopOrder.objects.prefetch_related(
                'items', 'items__samagri_item'
            ).get(id=pk, user=request.user)
        except ShopOrder.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30*mm, bottomMargin=20*mm,
                                leftMargin=20*mm, rightMargin=20*mm)
        styles = getSampleStyleSheet()
        elements = []

        # Custom styles
        title_style = ParagraphStyle('InvoiceTitle', parent=styles['Title'],
                                     fontSize=24, textColor=colors.HexColor('#EA580C'),
                                     spaceAfter=4*mm)
        subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
                                        fontSize=10, textColor=colors.grey,
                                        spaceAfter=2*mm)
        heading_style = ParagraphStyle('SectionHead', parent=styles['Heading2'],
                                       fontSize=13, textColor=colors.HexColor('#1F2937'),
                                       spaceBefore=6*mm, spaceAfter=3*mm)
        normal = styles['Normal']
        bold_style = ParagraphStyle('BoldNormal', parent=normal, fontName='Helvetica-Bold')

        # --- Header ---
        elements.append(Paragraph("🙏 PanditYatra", title_style))
        elements.append(Paragraph("Your Spiritual Journey Partner — Shop Invoice", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#EA580C'),
                                   spaceAfter=4*mm, spaceBefore=2*mm))

        # --- Invoice Info ---
        info_data = [
            [Paragraph(f"<b>Invoice #:</b> INV-SHOP-{order.id}", normal),
             Paragraph(f"<b>Date:</b> {order.created_at.strftime('%B %d, %Y')}", normal)],
            [Paragraph(f"<b>Order ID:</b> #{order.id}", normal),
             Paragraph(f"<b>Status:</b> {order.get_status_display()}", normal)],
        ]
        info_table = Table(info_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 4*mm))

        # --- Customer Info ---
        elements.append(Paragraph("Bill To", heading_style))
        elements.append(Paragraph(f"<b>{order.full_name}</b>", normal))
        elements.append(Paragraph(f"{order.shipping_address}, {order.city}", normal))
        elements.append(Paragraph(f"Phone: {order.phone_number}", normal))
        elements.append(Paragraph(f"Email: {order.user.email}", normal))
        elements.append(Spacer(1, 4*mm))

        # --- Items Table ---
        elements.append(Paragraph("Order Items", heading_style))
        table_data = [
            [Paragraph('<b>#</b>', normal),
             Paragraph('<b>Item</b>', normal),
             Paragraph('<b>Qty</b>', normal),
             Paragraph('<b>Unit Price</b>', normal),
             Paragraph('<b>Total</b>', normal)],
        ]
        for idx, item in enumerate(order.items.all(), 1):
            name = item.samagri_item.name if item.samagri_item else (item.item_name or 'N/A')
            line_total = item.quantity * item.price_at_purchase
            table_data.append([
                str(idx),
                name,
                str(item.quantity),
                f"Rs. {item.price_at_purchase:,.2f}",
                f"Rs. {line_total:,.2f}",
            ])
        # Totals row
        table_data.append(['', '', '', Paragraph('<b>Subtotal</b>', normal),
                          Paragraph(f"<b>Rs. {order.total_amount:,.2f}</b>", normal)])
        table_data.append(['', '', '', Paragraph('<b>Shipping</b>', normal), 'Free'])
        table_data.append(['', '', '', Paragraph('<b>Grand Total</b>', bold_style),
                          Paragraph(f"<b>Rs. {order.total_amount:,.2f}</b>", bold_style)])

        item_table = Table(table_data, colWidths=[
            doc.width * 0.06, doc.width * 0.44, doc.width * 0.1,
            doc.width * 0.2, doc.width * 0.2
        ])
        item_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFF7ED')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#9A3412')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (4, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -len(table_data)+len(order.items.all())), 0.5, colors.HexColor('#E5E7EB')),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#EA580C')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -4), [colors.white, colors.HexColor('#FFFBF5')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEABOVE', (3, -3), (-1, -3), 0.5, colors.HexColor('#D1D5DB')),
            ('LINEABOVE', (3, -1), (-1, -1), 1.5, colors.HexColor('#EA580C')),
        ]))
        elements.append(item_table)
        elements.append(Spacer(1, 6*mm))

        # --- Payment Info ---
        elements.append(Paragraph("Payment Details", heading_style))
        payment_info = [
            [Paragraph('<b>Payment Method:</b>', normal),
             Paragraph(order.payment_method or 'N/A', normal)],
            [Paragraph('<b>Transaction ID:</b>', normal),
             Paragraph(order.transaction_id or 'N/A', normal)],
            [Paragraph('<b>Payment Status:</b>', normal),
             Paragraph(order.get_status_display(), normal)],
        ]
        pay_table = Table(payment_info, colWidths=[doc.width * 0.35, doc.width * 0.65])
        pay_table.setStyle(TableStyle([
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(pay_table)
        elements.append(Spacer(1, 8*mm))

        # --- Footer ---
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#D1D5DB'),
                                   spaceAfter=3*mm))
        footer_style = ParagraphStyle('Footer', parent=normal, fontSize=8,
                                      textColor=colors.grey, alignment=TA_CENTER)
        elements.append(Paragraph("Thank you for shopping with PanditYatra!", footer_style))
        elements.append(Paragraph("This is a computer-generated invoice. No signature required.", footer_style))
        elements.append(Paragraph("support@pandityatra.com | www.pandityatra.com", footer_style))

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="PanditYatra_Invoice_SHOP_{order.id}.pdf"'
        return response


# --- Wishlist/Favorites ViewSet ---

class WishlistViewSet(viewsets.ViewSet):
    """
    ViewSet for managing user's wishlist/favorites.
    
    Endpoints:
    - GET /api/wishlist/ → List all user's favorites
    - POST /api/wishlist/add/ → Add item to favorites
    - DELETE /api/wishlist/remove/{id}/ → Remove item from favorites
    - GET /api/wishlist/check/{item_id}/ → Check if item is in favorites
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """GET /api/wishlist/ - Get user's wishlist items"""
        wishlist = Wishlist.objects.filter(user=request.user).select_related('samagri_item', 'samagri_item__category')
        serializer = WishlistSerializer(wishlist, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='add')
    def add_to_wishlist(self, request):
        """POST /api/wishlist/add/ - Add item to wishlist"""
        serializer = WishlistAddSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        item_id = serializer.validated_data['item_id']
        samagri_item = SamagriItem.objects.get(id=item_id)

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            samagri_item=samagri_item
        )

        if created:
            return Response({
                "message": "Item added to favorites",
                "item": WishlistSerializer(wishlist_item).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "message": "Item already in favorites",
                "item": WishlistSerializer(wishlist_item).data
            }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='remove/(?P<item_id>[^/.]+)')
    def remove_from_wishlist(self, request, item_id=None):
        """DELETE /api/wishlist/remove/{item_id}/ - Remove item from wishlist"""
        try:
            wishlist_item = Wishlist.objects.get(
                user=request.user,
                samagri_item_id=item_id
            )
            wishlist_item.delete()
            return Response({"message": "Item removed from favorites"}, status=status.HTTP_200_OK)
        except Wishlist.DoesNotExist:
            return Response({"error": "Item not in favorites"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='check/(?P<item_id>[^/.]+)')
    def check_favorite(self, request, item_id=None):
        """GET /api/wishlist/check/{item_id}/ - Check if item is in favorites"""
        is_favorite = Wishlist.objects.filter(
            user=request.user,
            samagri_item_id=item_id
        ).exists()
        return Response({"is_favorite": is_favorite})

    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle_favorite(self, request):
        """POST /api/wishlist/toggle/ - Toggle item in wishlist (add if not exists, remove if exists)"""
        serializer = WishlistAddSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        item_id = serializer.validated_data['item_id']
        samagri_item = SamagriItem.objects.get(id=item_id)

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            samagri_item=samagri_item
        )

        if created:
            return Response({
                "action": "added",
                "message": "Item added to favorites",
                "is_favorite": True,
                "item": WishlistSerializer(wishlist_item).data
            }, status=status.HTTP_201_CREATED)
        else:
            wishlist_item.delete()
            return Response({
                "action": "removed",
                "message": "Item removed from favorites",
                "is_favorite": False
            }, status=status.HTTP_200_OK)