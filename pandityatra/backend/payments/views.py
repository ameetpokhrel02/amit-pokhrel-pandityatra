"""
Payment Views - Stripe, Khalti, and eSewa Integration
"""
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes # 🆕 Added decorators
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import stripe
import logging
from adminpanel.models import PaymentErrorLog
from django.utils import timezone
from .models import Payment, PaymentWebhook
from .serializers import PaymentSerializer # 🆕 Added Serializer
from video.services.room_creator import ensure_video_room_for_booking
from .utils import (
    convert_npr_to_usd, 
    convert_usd_to_npr,
    get_exchange_rate,
    detect_currency_from_location,
    get_recommended_gateway,
    initiate_khalti_payment,
    verify_khalti_payment,
    initiate_esewa_payment,
    verify_esewa_payment,
    refund_stripe,
    refund_khalti,
    refund_esewa
)
from bookings.models import Booking
from samagri.models import ShopOrder, ShopOrderStatus
from notifications.services import notify_payment_success, notify_payment_failed

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
    serializer_class = PaymentSerializer
    
    @extend_schema(
        summary="Create Payment Intent",
        description="Initiate a payment for a booking using Stripe, Khalti, or eSewa.",
        responses={200: PaymentSerializer}
    )
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
            elif gateway == 'ESEWA':
                return self._initiate_esewa_payment(payment, booking, amount_npr, request)
            else:
                return Response(
                    {"error": "Invalid gateway"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Payment creation error: {e}")
            PaymentErrorLog.objects.create(
                error_type="PAYMENT",
                user=request.user if request.user.is_authenticated else None,
                booking_id=booking_id if 'booking_id' in locals() else None,
                message=str(e),
                context={"request_data": request.data}
            )
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
                            'name': f"{booking.service_name} - {booking.pandit.full_name}",
                            'description': f"Puja on {booking.booking_date}",
                        },
                        'unit_amount': int(amount_usd * 100),  # Cents
                    },
                    'quantity': 1,
                },
            ]
            
            # Success and cancel URLs
            success_url = f"{settings.FRONTEND_URL}/payment/success/{booking.id}?session_id={{CHECKOUT_SESSION_ID}}"
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
            PaymentErrorLog.objects.create(
                error_type="PAYMENT",
                user=payment.user if payment and payment.user_id else None,
                booking_id=booking.id if booking else None,
                payment_id=payment.id if payment else None,
                message=f"Stripe error: {str(e)}",
                context={"request_data": request.data}
            )
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
            
            # Prepare customer info
            user_info = {
                "name": request.user.full_name if hasattr(request.user, 'full_name') else request.user.username,
                "email": request.user.email,
                "phone": request.user.phone_number if hasattr(request.user, 'phone_number') else "9800000000"
            }
            
            success, pidx_or_error, payment_url = initiate_khalti_payment(
                amount_npr=amount_npr,
                order_id=purchase_order_id,
                return_url=return_url,
                website_url=website_url,
                user_info=user_info
            )
            
            if success:
                # Update payment
                payment.transaction_id = pidx_or_error
                payment.gateway_response = {'pidx': pidx_or_error, 'payment_url': payment_url}
                payment.status = 'PROCESSING'
                payment.save()
                
                return Response({
                    'success': True,
                    'gateway': 'KHALTI',
                    'pidx': pidx_or_error,
                    'payment_url': payment_url,
                    'payment_id': payment.id
                })
            else:
                error_msg = pidx_or_error if pidx_or_error else "Failed to initiate Khalti payment"
                return Response(
                    {"error": error_msg},
                    status=status.HTTP_400_BAD_REQUEST 
                )
                
        except Exception as e:
            logger.error(f"Khalti initiation error: {e}")
            PaymentErrorLog.objects.create(
                error_type="PAYMENT",
                user=payment.user if payment and payment.user_id else None,
                booking_id=booking.id if booking else None,
                payment_id=payment.id if payment else None,
                message=f"Khalti error: {str(e)}",
                context={"request_data": request.data}
            )
            return Response(
                {"error": f"Khalti error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _initiate_esewa_payment(self, payment, booking, amount_npr, request):
        """Initiate eSewa Payment"""
        try:
            success_url = f"{settings.FRONTEND_URL}/payment/esewa/verify"
            failure_url = f"{settings.FRONTEND_URL}/payment/failure"
            purchase_order_id = f"BOOKING-{booking.id}"
            
            success, payment_url, form_data, transaction_uuid = initiate_esewa_payment(
                amount_npr=amount_npr,
                order_id=purchase_order_id,
                return_url=success_url,
                failure_url=failure_url
            )
            
            if success:
                # Update payment
                payment.transaction_id = transaction_uuid
                payment.gateway_response = {'transaction_uuid': transaction_uuid, 'form_data': form_data}
                payment.status = 'PROCESSING'
                payment.save()
                
                return Response({
                    'success': True,
                    'gateway': 'ESEWA',
                    'payment_url': payment_url,
                    'form_data': form_data,
                    'transaction_uuid': transaction_uuid,
                    'payment_id': payment.id
                })
            else:
                error_msg = payment_url if payment_url else "Failed to initiate eSewa payment"
                return Response(
                    {"error": error_msg},
                    status=status.HTTP_400_BAD_REQUEST 
                )
                
        except Exception as e:
            logger.error(f"eSewa initiation error: {e}")
            PaymentErrorLog.objects.create(
                error_type="PAYMENT",
                user=payment.user if payment and payment.user_id else None,
                booking_id=booking.id if booking else None,
                payment_id=payment.id if payment else None,
                message=f"eSewa error: {str(e)}",
                context={"request_data": request.data}
            )
            return Response(
                {"error": f"eSewa error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StripeWebhookView(APIView):
    """
    Handle Stripe webhooks
    """
    permission_classes = []  # No authentication for webhooks
    
    @extend_schema(exclude=True)
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
            PaymentErrorLog.objects.create(
                error_type="WEBHOOK",
                message=f"Invalid Stripe payload: {str(e)}",
                context={"request_data": str(request.body)}
            )
            return Response({'error': 'Invalid payload'}, status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            PaymentErrorLog.objects.create(
                error_type="WEBHOOK",
                message=f"Invalid Stripe signature: {str(e)}",
                context={"request_data": str(request.body)}
            )
            return Response({'error': 'Invalid signature'}, status=400)
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            PaymentErrorLog.objects.create(
                error_type="WEBHOOK",
                message=f"Stripe webhook error: {str(e)}",
                context={"request_data": str(request.body)}
            )
            return Response({'error': str(e)}, status=500)
    
    def _handle_successful_payment(self, session):
        """Process successful Stripe payment"""
        try:
            payment_type = session['metadata'].get('type')
            
            if payment_type == 'shop_order':
                order_id = session['metadata']['order_id']
                from samagri.models import ShopOrder, ShopOrderStatus
                order = ShopOrder.objects.get(id=order_id)
                order.status = ShopOrderStatus.PAID
                order.transaction_id = session['id']
                order.save()
                logger.info(f"Payment completed for shop order {order_id}")
                return

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
                try:
                    ensure_video_room_for_booking(booking)
                except Exception as e:
                    logger.error(f"Failed to create video room: {e}")
            
            booking.save()
            
            # 🔔 Send payment success notification
            notify_payment_success(booking, payment.amount)
            
            logger.info(f"Payment completed for booking {booking_id}")
            
        except Exception as e:
            logger.error(f"Error handling successful payment: {e}")


class KhaltiVerifyView(APIView):
    """
    Verify Khalti payment
    """
    permission_classes = []
    
    @extend_schema(
        summary="Verify Khalti Payment",
        parameters=[OpenApiParameter("pidx", str, OpenApiParameter.QUERY, description="Khalti pidx")],
        responses={200: PaymentSerializer}
    )
    def get(self, request):
        """Handle redirect from Khalti"""
        pidx = request.query_params.get('pidx')
        
        if not pidx:
            return Response(
                {"error": "Missing pidx"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 1. Try finding Booking Payment
        try:
            payment = Payment.objects.filter(transaction_id=pidx).first()
            if payment:
                return self.handle_booking_verification(payment, pidx)

            # 2. Try finding Shop Order
            order = ShopOrder.objects.filter(transaction_id=pidx).first()
            if order:
                return self.handle_shop_verification(order, pidx)
                
            return Response(
                {"error": "Payment record not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        except Exception as e:
            logging.getLogger(__name__).error(f"Error handling successful payment: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def handle_booking_verification(self, payment, pidx):
        booking = payment.booking
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
            booking.transaction_id = transaction_id
            booking.save()

            # 🚨 CHECK FOR FIRST TIME BOOKING (New User for Puja)
            from payments.models import Payment
            is_first_booking = not Payment.objects.filter(
                user=payment.user, 
                status='COMPLETED', 
                booking__isnull=False
            ).exclude(id=payment.id).exists()

            if is_first_booking:
                from adminpanel.utils import log_activity
                log_activity(
                    user=payment.user,
                    action_type="NEW_USER_PUJA",
                    details=f"First time booking Pandit Puja: {booking.service_name}",
                    request=self.request
                )
            
            # 🔔 Send payment success notification
            notify_payment_success(booking, payment.amount)
            
            return Response({
                'success': True,
                'booking_id': booking.id,
                'transaction_id': transaction_id,
                'payment_method': 'KHALTI',
                'is_first_booking': is_first_booking,
                'type': 'BOOKING'
            })
        else:
            payment.status = 'FAILED'
            payment.save()
            
            # Log exact failure reason
            PaymentErrorLog.objects.create(
                error_type="PAYMENT",
                message=f"Khalti Booking verification failed: {details}",
                context={"payment_id": payment.id, "pidx": pidx}
            )
            
            # 🔔 Send payment failed notification
            notify_payment_failed(booking, "Khalti payment verification failed")
            
            return Response(
                {"error": f"Payment verification failed: {details}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def handle_shop_verification(self, order, pidx):
        success, transaction_id, details = verify_khalti_payment(pidx, order.total_amount)
        
        if success:
            order.status = ShopOrderStatus.PAID
            order.payment_method = 'KHALTI'
            order.transaction_id = transaction_id
            order.save()
            
            return Response({
                'success': True,
                'order_id': order.id,
                'transaction_id': transaction_id,
                'payment_method': 'KHALTI',
                'type': 'SHOP_ORDER'
            })
        else:
            PaymentErrorLog.objects.create(
                error_type="PAYMENT",
                message=f"Khalti Shop verification failed: {details}",
                context={"order_id": order.id, "pidx": pidx}
            )
            return Response(
                {"error": f"Payment verification failed: {details}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class EsewaVerifyView(APIView):
    """
    Verify eSewa payment
    """
    permission_classes = []
    
    @extend_schema(
        summary="Verify eSewa Payment",
        parameters=[
            OpenApiParameter("data", str, OpenApiParameter.QUERY, description="Base64 encoded eSewa data"),
            OpenApiParameter("order_id", str, OpenApiParameter.QUERY, description="Optional order ID")
        ],
        responses={200: PaymentSerializer}
    )
    def get(self, request):
        """Handle redirect from eSewa"""
        # eSewa sends data as base64 encoded JSON in 'data' parameter
        encoded_data = request.query_params.get('data')
        order_id = request.query_params.get('order_id')
        
        if not encoded_data:
            return Response(
                {"error": "Missing payment data"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            import json
            import base64
            
            # Decode the data (handle urlsafe base64 and missing padding)
            padded = encoded_data + '=' * (-len(encoded_data) % 4)
            try:
                decoded_data = base64.b64decode(padded).decode('utf-8')
            except Exception:
                decoded_data = base64.urlsafe_b64decode(padded).decode('utf-8')
            payment_data = json.loads(decoded_data)
            
            transaction_uuid = payment_data.get('transaction_uuid')
            
            # Find payment by transaction_uuid
            payment = Payment.objects.filter(transaction_id=transaction_uuid).first()
            
            if payment:
                return self.handle_booking_verification(payment, encoded_data)
            
            # Try finding Shop Order
            order = ShopOrder.objects.filter(transaction_id=transaction_uuid).first()

            # Fallback for shop flow if transaction_id was updated after a previous verify
            if not order and order_id:
                try:
                    order = ShopOrder.objects.filter(id=int(order_id)).first()
                except (TypeError, ValueError):
                    order = None
            
            if order:
                return self.handle_shop_verification(order, encoded_data)
                
            return Response(
                {"error": "Payment record not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        except Exception as e:
            logger.error(f"Error handling eSewa payment: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def handle_booking_verification(self, payment, encoded_data):
        booking = payment.booking
        success, transaction_code, details = verify_esewa_payment(encoded_data)
        
        if success:
            # Strict Amount Validation
            import decimal
            esewa_amount = str(details.get('total_amount', '0')).replace(',', '')
            try:
                if float(payment.amount_npr) != float(esewa_amount):
                    PaymentErrorLog.objects.create(
                        error_type="PAYMENT",
                        message=f"Booking eSewa Amount mismatch. Expected {payment.amount_npr}, got {esewa_amount}",
                        context={"payment_id": payment.id, "esewa_data": details}
                    )
                    return Response({"error": "Payment amount mismatch"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Error checking eSewa amount: {e}")
                pass
                
            # Update payment
            payment.status = 'COMPLETED'
            payment.completed_at = timezone.now()
            payment.gateway_response = details
            payment.save()
            
            # Update booking
            booking.payment_status = True
            booking.payment_method = 'ESEWA'
            booking.status = 'ACCEPTED'
            booking.transaction_id = transaction_code
            booking.save()

            # 🚨 CHECK FOR FIRST TIME BOOKING (New User for Puja)
            from payments.models import Payment
            is_first_booking = not Payment.objects.filter(
                user=payment.user, 
                status='COMPLETED', 
                booking__isnull=False
            ).exclude(id=payment.id).exists()

            if is_first_booking:
                from adminpanel.utils import log_activity
                log_activity(
                    user=payment.user,
                    action_type="NEW_USER_PUJA",
                    details=f"First time booking Pandit Puja: {booking.service_name}",
                    request=self.request
                )
            
            # 🔔 Send payment success notification
            notify_payment_success(booking, payment.amount)
            
            return Response({
                'success': True,
                'booking_id': booking.id,
                'transaction_id': transaction_code,
                'payment_method': 'ESEWA',
                'is_first_booking': is_first_booking,
                'type': 'BOOKING'
            })
        else:
            payment.status = 'FAILED'
            payment.save()
            
            # Log the exact failure reason from eSewa verify
            PaymentErrorLog.objects.create(
                error_type="PAYMENT",
                message=f"eSewa Booking verification failed: {details}",
                context={"payment_id": payment.id, "encoded_data": encoded_data}
            )
            
            # 🔔 Send payment failed notification
            notify_payment_failed(booking, "eSewa payment verification failed")
            
            return Response(
                {"error": f"Payment verification failed: {details}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def handle_shop_verification(self, order, encoded_data):
        success, transaction_code, details = verify_esewa_payment(encoded_data)
        
        if success:
            # Strict Amount Validation
            import decimal
            esewa_amount = str(details.get('total_amount', '0')).replace(',', '')
            try:
                if float(order.total_amount) != float(esewa_amount):
                    PaymentErrorLog.objects.create(
                        error_type="PAYMENT",
                        message=f"Shop eSewa Amount mismatch. Expected {order.total_amount}, got {esewa_amount}",
                        context={"order_id": order.id, "esewa_data": details}
                    )
                    return Response({"error": "Payment amount mismatch"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Error checking eSewa amount: {e}")
                pass
                
            order.status = ShopOrderStatus.PAID
            order.payment_method = 'ESEWA'
            
            # Keep original transaction UUID for idempotent callback re-verification.
            # Only set transaction_id if it was empty.
            if not order.transaction_id:
                order.transaction_id = transaction_code
            order.save()
            
            return Response({
                'success': True,
                'order_id': order.id,
                'transaction_id': transaction_code,
                'payment_method': 'ESEWA',
                'type': 'SHOP_ORDER'
            })
        else:
            # Log the exact failure reason from eSewa verify
            PaymentErrorLog.objects.create(
                error_type="PAYMENT",
                message=f"eSewa Shop verification failed: {details}",
                context={"order_id": order.id, "encoded_data": encoded_data}
            )
            return Response(
                {"error": f"Payment verification failed: {details}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class GetPaymentStatusView(APIView):
    """
    Get payment status for a booking
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(summary="Get Payment Status", responses={200: PaymentSerializer})
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
    
    @extend_schema(summary="Get Exchange Rate")
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
@extend_schema(
    summary="Admin: List Payments",
    responses={200: PaymentSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_payments(request):
    """
    List all payments for Admin Ledger
    """
    # Check permissions
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)
    
    payments = Payment.objects.all().select_related('booking', 'booking__pandit', 'user').order_by('-created_at')
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)

# ---------------------------
# ADMIN: Refund Payment
# ---------------------------
@extend_schema(
    summary="Admin: Refund Payment",
    responses={200: PaymentSerializer}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_payment(request, payment_id):
    """
    Process refund for a specific payment
    """
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
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


# ---------------------------
# ADMIN: Manual Verification (For exceptions)
# ---------------------------
class VerifyStripePaymentView(APIView):
    """
    Verify Stripe Checkout Session status (Frontend landing page check)
    """
    permission_classes = [AllowAny]

    @extend_schema(summary="Verify Stripe Payment Status")
    def get(self, request):
        session_id = request.query_params.get('session_id')
        order_id = request.query_params.get('order_id')
        
        if not session_id:
            return Response({"error": "Missing session_id"}, status=400)
            
        try:
            # 1. Fetch the session from Stripe
            session = stripe.checkout.Session.retrieve(session_id)
            
            if session.payment_status == 'paid':
                # 2. Update the order if order_id is provided
                amount_npr = 0
                if order_id:
                    from samagri.models import ShopOrder, ShopOrderStatus
                    try:
                        # Use select_for_update to handle race conditions with webhooks
                        order = ShopOrder.objects.select_for_update().get(id=order_id)
                        amount_npr = float(order.total_amount)
                        
                        if order.status == ShopOrderStatus.PENDING:
                            order.status = ShopOrderStatus.PAID
                            order.transaction_id = session.id
                            order.save()
                            logger.info(f"Verified Stripe payment for ShopOrder #{order_id}")
                        else:
                            logger.info(f"ShopOrder #{order_id} already processed (status: {order.status})")
                    except ShopOrder.DoesNotExist:
                        logger.warning(f"ShopOrder #{order_id} not found during Stripe verification")
                        pass

                return Response({
                    "success": True,
                    "status": "PAID",
                    "payment_method": "STRIPE",
                    "order_id": order_id,
                    "transaction_id": session.id,
                    "amount": amount_npr,
                    "date": session.created # Use Stripe session creation time
                })
            else:
                return Response({
                    "success": False,
                    "status": session.payment_status,
                    "message": "Payment not completed"
                })
                
        except Exception as e:
            logger.error(f"Stripe verification error: {e}")
            return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment_manual(request, payment_id):
    """
    Manually mark a pending payment as completed (Admin Only)
    """
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)
        
    try:
        payment = Payment.objects.get(id=payment_id)
        
        if payment.status == 'COMPLETED':
            return Response({"detail": "Payment is already completed"}, status=400)
            
        with transaction.atomic():
            payment.status = 'COMPLETED'
            payment.completed_at = timezone.now()
            payment.transaction_id = f"MANUAL-{timezone.now().timestamp()}"
            payment.gateway_response = {"manual_verification": True, "admin": request.user.username}
            payment.save()
            
            # Update booking if exists
            if payment.booking:
                booking = payment.booking
                booking.payment_status = True
                booking.payment_method = payment.payment_method or 'MANUAL'
                booking.transaction_id = payment.transaction_id
                
                # Update booking status to ACCEPTED if it was PENDING
                if booking.status == 'PENDING':
                    booking.status = 'ACCEPTED'
                
                # Handle video room creation for online pujas
                if booking.service_location == 'ONLINE':
                    from video.utils import create_video_room
                    try:
                        room_url = create_video_room(
                            booking.id,
                            str(booking.booking_date),
                            booking.service_name
                        )
                        if room_url:
                            booking.video_room_url = room_url
                    except Exception as e:
                        logger.error(f"Failed to create manual video room: {e}")
                
                booking.save()
            
            # Log Activity
            from adminpanel.utils import log_activity
            log_activity(
                user=request.user,
                action_type="PAYMENT_VERIFY_MANUAL",
                details=f"Manual verification for payment #{payment.id} (Booking #{payment.booking.id if payment.booking else 'N/A'})",
                request=request
            )
            
        return Response({"detail": "Payment manually verified successfully"})
        
    except Payment.DoesNotExist:
        return Response({"detail": "Payment not found"}, status=404)
    except Exception as e:
        return Response({"detail": str(e)}, status=500)


# ===============================
# ADMIN WALLET & PAYOUT APIS
# ===============================
from .models import PanditWithdrawal
from pandits.models import PanditUser
from rest_framework.permissions import IsAdminUser

@api_view(["POST"])
@permission_classes([IsAuthenticated]) # Should be IsAdminUser in prod, but using IsAuthenticated + check
def approve_withdrawal(request, id):
    if not (request.user.is_superuser or request.user.role in ('admin', 'superadmin')):
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
    """List of all Pandits and their wallet balances for Admin"""
    if not (request.user.is_superuser or request.user.role in ('admin', 'superadmin')):
        return Response({"error": "Admin only"}, status=403)

    data = []
    # Get all PanditUsers with wallets
    # Note: PanditUser inherits from User, so full_name/email are on the same object
    for p in PanditUser.objects.select_related('wallet').all():
        # Handle case where wallet might be missing
        if hasattr(p, 'wallet'):
            wallet = p.wallet
            data.append({
                "pandit_id": p.id,
                "pandit_name": p.full_name,
                "email": p.email,
                "total_earned": str(wallet.total_earned),
                "available": str(wallet.available_balance),
                "withdrawn": str(wallet.total_withdrawn),
                "pending_withdrawals": p.withdrawals.filter(status="PENDING").count()
            })
            
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_withdrawal_requests(request):
    """List of all withdrawal requests for Admin"""
    if not (request.user.is_superuser or request.user.role in ('admin', 'superadmin')):
        return Response({"error": "Admin only"}, status=403)
        
    withdrawals = PanditWithdrawal.objects.select_related('pandit').order_by('-created_at')
    data = [{
        "id": w.id,
        "pandit_name": w.pandit.full_name,
        "amount": str(w.amount),
        "status": w.status,
        "date": w.created_at.isoformat()
    } for w in withdrawals]
    return Response(data)
