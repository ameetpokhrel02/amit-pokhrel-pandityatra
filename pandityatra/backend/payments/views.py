"""
Payment Views - Stripe and Khalti Integration
"""
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes # 🆕 Added decorators
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import stripe
import logging

from .models import Payment, PaymentWebhook
from .serializers import PaymentSerializer # 🆕 Added Serializer
from .utils import (
    convert_npr_to_usd, 
    convert_usd_to_npr,
    get_exchange_rate,
    detect_currency_from_location,
    get_recommended_gateway,
    create_video_room,
    initiate_khalti_payment,
    verify_khalti_payment,
    refund_stripe,
    refund_khalti
)
from bookings.models import Booking

logger = logging.getLogger(__name__)

# Initialize Stripe
try:
    stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None)
except:
    stripe.api_key = None


class CreatePaymentIntentView(APIView):
    """
    Create payment intent for Stripe or initiate Khalti payment
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            booking_id = request.data.get('booking_id')
            gateway = request.data.get('gateway', 'STRIPE')  # STRIPE or KHALTI
            currency = request.data.get('currency', 'USD')  # USD or NPR
            
            # Get booking
            try:
                booking = Booking.objects.get(id=booking_id, user=request.user)
            except Booking.DoesNotExist:
                return Response(
                    {"error": "Booking not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if already paid
            if booking.payment_status:
                return Response(
                    {"error": "Booking already paid"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get amounts
            amount_npr = booking.total_fee
            amount_usd = convert_npr_to_usd(amount_npr) if not booking.total_fee_usd else booking.total_fee_usd
            exchange_rate = get_exchange_rate()
            
            # Create or get payment record
            payment, created = Payment.objects.get_or_create(
                booking=booking,
                user=request.user,
                defaults={
                    'payment_method': gateway,
                    'amount_npr': amount_npr,
                    'amount_usd': amount_usd,
                    'exchange_rate': exchange_rate,
                    'amount': amount_npr if currency == 'NPR' else amount_usd,
                    'currency': currency,
                    'status': 'PENDING'
                }
            )
            
            if gateway == 'STRIPE':
                return self._create_stripe_session(payment, booking, amount_usd, request)
            elif gateway == 'KHALTI':
                return self._initiate_khalti_payment(payment, booking, amount_npr, request)
            else:
                return Response(
                    {"error": "Invalid gateway"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Payment creation error: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _create_stripe_session(self, payment, booking, amount_usd, request):
        """Create Stripe Checkout Session"""
        try:
            if not stripe.api_key:
                return Response(
                    {"error": "Stripe not configured"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            # Create line items
            line_items = [
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f"{booking.service_name} - {booking.pandit.user.full_name}",
                            'description': f"Puja on {booking.booking_date}",
                        },
                        'unit_amount': int(amount_usd * 100),  # Cents
                    },
                    'quantity': 1,
                },
            ]
            
            # Success and cancel URLs
            success_url = f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{settings.FRONTEND_URL}/payment/cancel"
            
            # Create Checkout Session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=str(booking.id),
                metadata={
                    'booking_id': booking.id,
                    'payment_id': payment.id,
                    'user_id': request.user.id,
                }
            )
            
            # Update payment with session ID
            payment.transaction_id = checkout_session.id
            payment.gateway_response = checkout_session.to_dict()
            payment.status = 'PROCESSING'
            payment.save()
            
            return Response({
                'success': True,
                'gateway': 'STRIPE',
                'session_id': checkout_session.id,
                'checkout_url': checkout_session.url,
                'payment_id': payment.id
            })
            
        except Exception as e:
            logger.error(f"Stripe session creation error: {e}")
            return Response(
                {"error": f"Stripe error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _initiate_khalti_payment(self, payment, booking, amount_npr, request):
        """Initiate Khalti Payment"""
        try:
            return_url = f"{settings.FRONTEND_URL}/payment/khalti/verify"
            website_url = settings.FRONTEND_URL
            purchase_order_id = f"BOOKING-{booking.id}"
            
            success, pidx, payment_url = initiate_khalti_payment(
                amount_npr=amount_npr,
                purchase_order_id=purchase_order_id,
                return_url=return_url,
                website_url=website_url
            )
            
            if success:
                # Update payment
                payment.transaction_id = pidx
                payment.gateway_response = {'pidx': pidx, 'payment_url': payment_url}
                payment.status = 'PROCESSING'
                payment.save()
                
                return Response({
                    'success': True,
                    'gateway': 'KHALTI',
                    'pidx': pidx,
                    'payment_url': payment_url,
                    'payment_id': payment.id
                })
            else:
                return Response(
                    {"error": "Failed to initiate Khalti payment"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Khalti initiation error: {e}")
            return Response(
                {"error": f"Khalti error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StripeWebhookView(APIView):
    """
    Handle Stripe webhooks
    """
    permission_classes = []  # No authentication for webhooks
    
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            # Log webhook
            PaymentWebhook.objects.create(
                payment_method='STRIPE',
                payload=request.data,
                headers=dict(request.META),
                processed=False
            )
            
            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            
            # Handle the event
            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']
                self._handle_successful_payment(session)
            
            return Response({'success': True})
            
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            return Response({'error': 'Invalid payload'}, status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            return Response({'error': 'Invalid signature'}, status=400)
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return Response({'error': str(e)}, status=500)
    
    def _handle_successful_payment(self, session):
        """Process successful Stripe payment"""
        try:
            booking_id = session['metadata']['booking_id']
            payment_id = session['metadata']['payment_id']
            
            # Update payment
            payment = Payment.objects.get(id=payment_id)
            payment.status = 'COMPLETED'
            payment.completed_at = timezone.now()
            payment.gateway_response = session
            payment.save()
            
            # Update booking
            booking = Booking.objects.get(id=booking_id)
            booking.payment_status = True
            booking.payment_method = 'STRIPE'
            booking.status = 'ACCEPTED'
            
            # 🚨 Save transaction ID for refunds
            booking.transaction_id = session['id']
            
            # Create video room for online puja
            if booking.service_location == 'ONLINE':
                room_url = create_video_room(
                    booking.id,
                    booking.booking_date,
                    booking.service_name
                )
                if room_url:
                    booking.video_room_url = room_url
            
            booking.save()
            
            logger.info(f"Payment completed for booking {booking_id}")
            
        except Exception as e:
            logger.error(f"Error handling successful payment: {e}")


class KhaltiVerifyView(APIView):
    """
    Verify Khalti payment
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Handle redirect from Khalti"""
        pidx = request.query_params.get('pidx')
        
        if not pidx:
            return Response(
                {"error": "Missing pidx"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find payment by pidx
            payment = Payment.objects.get(transaction_id=pidx, user=request.user)
            booking = payment.booking
            
            # Verify with Khalti
            success, transaction_id, details = verify_khalti_payment(pidx, payment.amount_npr)
            
            if success:
                # Update payment
                payment.status = 'COMPLETED'
                payment.completed_at = timezone.now()
                payment.gateway_response = details
                payment.save()
                
                # Update booking
                booking.payment_status = True
                booking.payment_method = 'KHALTI'
                booking.status = 'ACCEPTED'
                
                # 🚨 Save transaction ID for refunds
                # pidx IS the transaction id for khalti refunds
                booking.transaction_id = pidx
                
                # Create video room for online puja
                if booking.service_location == 'ONLINE':
                    room_url = create_video_room(
                        booking.id,
                        booking.booking_date,
                        booking.service_name
                    )
                    if room_url:
                        booking.video_room_url = room_url
                
                booking.save()
                
                return Response({
                    'success': True,
                    'booking_id': booking.id,
                    'transaction_id': transaction_id
                })
            else:
                payment.status = 'FAILED'
                payment.save()
                
                return Response(
                    {"error": "Payment verification failed"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Khalti verification error: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetPaymentStatusView(APIView):
    """
    Get payment status for a booking
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
            
            try:
                payment = Payment.objects.get(booking=booking)
                return Response({
                    'payment_status': payment.status,
                    'payment_method': payment.payment_method,
                    'amount_npr': float(payment.amount_npr),
                    'amount_usd': float(payment.amount_usd),
                    'currency': payment.currency,
                    'transaction_id': payment.transaction_id,
                    'completed_at': payment.completed_at
                })
            except Payment.DoesNotExist:
                return Response({
                    'payment_status': 'NOT_INITIATED',
                    'booking_paid': booking.payment_status
                })
                
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class ExchangeRateView(APIView):
    """
    Get current NPR to USD exchange rate
    """
    permission_classes = []  # Public endpoint
    
    def get(self, request):
        rate = get_exchange_rate()
        npr_amount = request.query_params.get('npr')
        
        response_data = {
            'rate': float(rate),
            'base': 'NPR',
            'target': 'USD'
        }
        
        if npr_amount:
            try:
                npr = Decimal(npr_amount)
                usd = convert_npr_to_usd(npr)
                response_data['converted'] = {
                    'npr': float(npr),
                    'usd': float(usd)
                }
            except:
                pass
        
        return Response(response_data)


# ---------------------------
# ADMIN: Payment Ledger
# ---------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_payments(request):
    """
    List all payments for Admin Ledger
    """
    # Check permissions
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)
    
    payments = Payment.objects.all().select_related('booking', 'booking__pandit', 'booking__pandit__user', 'user').order_by('-created_at')
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)

# ---------------------------
# ADMIN: Refund Payment
# ---------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_payment(request, payment_id):
    """
    Process refund for a specific payment
    """
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)
        
    try:
        payment = Payment.objects.get(id=payment_id)
        
        if payment.status == 'REFUNDED':
            return Response({"detail": "Payment already refunded"}, status=400)
            
        # Call refund logic
        success = False
        if payment.payment_method == 'STRIPE':
             success = refund_stripe(payment.transaction_id)
        elif payment.payment_method == 'KHALTI':
             success = refund_khalti(payment.transaction_id)
        else:
             return Response({"detail": "Refund not supported for this method"}, status=400)
             
        if success:
            payment.status = 'REFUNDED'
            payment.refunded_at = timezone.now()
            payment.save()
            return Response({"detail": "Refund successful"})
        else:
             return Response({"detail": "Refund failed at gateway"}, status=400)
             
    except Payment.DoesNotExist:
        return Response({"detail": "Payment not found"}, status=404)


# ===============================
# ADMIN WALLET & PAYOUT APIS
# ===============================
from .models import PanditWithdrawal
from pandits.models import Pandit
from rest_framework.permissions import IsAdminUser

@api_view(["POST"])
@permission_classes([IsAuthenticated]) # Should be IsAdminUser in prod, but using IsAuthenticated + check
def approve_withdrawal(request, id):
    if request.user.role != 'admin':
        return Response({"error": "Admin only"}, status=403)
        
    try:
        withdrawal = PanditWithdrawal.objects.get(id=id)
    except PanditWithdrawal.DoesNotExist:
        return Response({"error": "Withdrawal not found"}, status=404)

    if withdrawal.status != "PENDING":
        return Response({"error": "Withdrawal already processed"}, status=400)

    # Deduct from wallet
    wallet = withdrawal.pandit.wallet
    if wallet.available_balance < withdrawal.amount:
        return Response({"error": "Insufficient wallet balance"}, status=400)

    wallet.available_balance -= withdrawal.amount
    wallet.total_withdrawn += withdrawal.amount
    wallet.save()

    withdrawal.status = "APPROVED"
    withdrawal.processed_at = timezone.now()
    withdrawal.save()

    return Response({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_payouts(request):
    if request.user.role != 'admin':
        return Response({"error": "Admin only"}, status=403)

    data = []
    # Get all Pandits with wallets
    for p in Pandit.objects.select_related('wallet', 'user').all():
        # Handle case where wallet might be missing (should exist via signal)
        if hasattr(p, 'wallet'):
            wallet = p.wallet
            data.append({
                "pandit_id": p.id,
                "pandit_name": p.user.full_name,
                "email": p.user.email,
                "total_earned": wallet.total_earned,
                "available": wallet.available_balance,
                "withdrawn": wallet.total_withdrawn,
                "pending_withdrawals": p.withdrawals.filter(status="PENDING").count()
            })
            
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_withdrawal_requests(request):
    """List of all withdrawal requests for Admin"""
    if request.user.role != 'admin':
        return Response({"error": "Admin only"}, status=403)
        
    withdrawals = PanditWithdrawal.objects.select_related('pandit__user').order_by('-created_at')
    data = [{
        "id": w.id,
        "pandit_name": w.pandit.user.full_name,
        "amount": w.amount,
        "status": w.status,
        "date": w.created_at
    } for w in withdrawals]
    return Response(data)
