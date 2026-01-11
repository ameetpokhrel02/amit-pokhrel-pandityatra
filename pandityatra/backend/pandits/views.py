from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import Pandit, PanditService
from .serializers import PanditSerializer, PanditServiceSerializer
from .pandit_serializers import PanditRegistrationSerializer
from payments.models import PanditWithdrawal
from services.models import Puja
from services.serializers import PujaSerializer


# ---------------------------
# Pandit Registration
# ---------------------------
class RegisterPanditView(generics.CreateAPIView):
    serializer_class = PanditRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        serializer.save()


# ---------------------------
# ADMIN: List pending
# ---------------------------
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_pending_pandits(request):
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    pandits = Pandit.objects.filter(verification_status="PENDING")
    serializer = PanditSerializer(pandits, many=True)
    return Response(serializer.data)


# ---------------------------
# ADMIN: Approve
# ---------------------------
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_pandit(request, pandit_id):
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    pandit = get_object_or_404(Pandit, id=pandit_id)

    pandit.verification_status = "APPROVED"
    pandit.is_verified = True
    pandit.verified_date = timezone.now()
    pandit.verification_notes = request.data.get("notes", "")
    pandit.save()

    return Response({
        "detail": f"{pandit.user.full_name} approved",
        "pandit": PanditSerializer(pandit).data
    })


# ---------------------------
# ADMIN: Reject
# ---------------------------
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_pandit(request, pandit_id):
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    pandit = get_object_or_404(Pandit, id=pandit_id)

    pandit.verification_status = "REJECTED"
    pandit.is_verified = False
    pandit.verification_notes = request.data.get("reason", "")
    pandit.save()

    return Response({
        "detail": f"{pandit.user.full_name} rejected",
        "pandit": PanditSerializer(pandit).data
    })

# ---------------------------
# PANDIT: Request Withdrawal
# ---------------------------
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def request_withdrawal(request):

    try:
        pandit = request.user.pandit_profile
    except:
        return Response({"error": "User does not have a pandit profile"}, status=400)

    amount_str = request.data.get("amount")
    if not amount_str:
        return Response({"error": "Amount is required"}, status=400)
    
    try:
        amount = Decimal(str(amount_str))
    except:
        return Response({"error": "Invalid amount format"}, status=400)

    if amount <= 0:
        return Response({"error": "Amount must be positive"}, status=400)

    wallet = pandit.wallet
    if amount > wallet.available_balance:
        return Response({"error": "Insufficient balance"}, status=400)

    PanditWithdrawal.objects.create(pandit=pandit, amount=amount)

    return Response({"success": "Withdrawal requested successfully"})


# ---------------------------
# PANDIT: Wallet & History
# ---------------------------
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_pandit_wallet(request):
    try:
        pandit = request.user.pandit_profile
        wallet = pandit.wallet
        return Response({
            "total_earned": wallet.total_earned,
            "available_balance": wallet.available_balance,
            "total_withdrawn": wallet.total_withdrawn
        })
    except Exception as e:
        return Response({"error": "Wallet not found"}, status=404)

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_pandit_withdrawals(request):
    try:
        # pandit = request.user.pandit_profile
        # Fix: ensure pandit profile exists
        if not hasattr(request.user, 'pandit_profile'):
             return Response({"error": "Pandit profile not found"}, status=404)
        
        pandit = request.user.pandit_profile
        withdrawals = PanditWithdrawal.objects.filter(pandit=pandit).order_by('-created_at')
        data = [{
            "id": w.id,
            "amount": w.amount,
            "status": w.status,
            "created_at": w.created_at
        } for w in withdrawals]
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


# ---------------------------
# PANDIT: Manage Services
# ---------------------------
class PanditServiceViewSet(viewsets.ModelViewSet):
    """
    CRUD for services offered by the logged-in Pandit.
    """
    serializer_class = PanditServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, 'pandit_profile'):
             return PanditService.objects.none()
        return PanditService.objects.filter(pandit=self.request.user.pandit_profile)

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'pandit_profile'):
            raise ValidationError("User is not a Pandit")
        
        # Check if service already exists for this puja
        puja = serializer.validated_data.get('puja')
        if PanditService.objects.filter(pandit=self.request.user.pandit_profile, puja=puja).exists():
             raise ValidationError("You already offer this service")
             
        serializer.save(pandit=self.request.user.pandit_profile)

class PujaCatalogView(generics.ListAPIView):
    """
    Publicly (or Authenticated) list of all possible Pujas.
    """
    queryset = Puja.objects.filter(is_available=True)
    serializer_class = PujaSerializer
    permission_classes = [permissions.AllowAny]

# ---------------------------
# PANDIT: Dashboard Stats
# ---------------------------
from bookings.models import Booking, BookingStatus
from django.db.models import Sum
from .models import PanditWallet
import datetime

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pandit_dashboard_stats(request):
    try:
        pandit = request.user.pandit_profile
    except:
        # Auto-create profile if user has pandit role (Self-healing for Dev/Test)
        if getattr(request.user, 'role', '') == 'pandit':
             pandit = Pandit.objects.create(
                 user=request.user, 
                 expertise="General", 
                 language="Hindi",
                 experience_years=0,
                 is_verified=True,  # Auto-verify in dev if needed, or keep False
                 verification_status="APPROVED" 
             )
             PanditWallet.objects.create(pandit=pandit)
        else:
             return Response({"error": "User is not a pandit"}, status=403)
        
    today = timezone.localtime().date()
    
    # 1. Stats
    todays_bookings_count = Booking.objects.filter(pandit=pandit, booking_date=today).count()
    pending_requests_count = Booking.objects.filter(pandit=pandit, status=BookingStatus.PENDING).count()
    
    todays_earnings = Booking.objects.filter(
        pandit=pandit, 
        booking_date=today, 
        status=BookingStatus.COMPLETED
    ).aggregate(total=Sum('total_fee'))['total'] or 0

    wallet, created = PanditWallet.objects.get_or_create(pandit=pandit)
    
    # 2. Next Puja
    # Get the soonest ACCEPTED booking that is in the future (or today)
    now = timezone.localtime()
    
    next_puja = Booking.objects.filter(
        pandit=pandit,
        status=BookingStatus.ACCEPTED,
        booking_date__gte=today
    ).order_by('booking_date', 'booking_time').first()
    
    next_puja_data = None
    if next_puja:
        next_puja_data = {
            "id": next_puja.id,
            "customerName": next_puja.user.full_name,
            "pujaName": next_puja.service_name,
            "date": next_puja.booking_date,
            "time": next_puja.booking_time,
            "location": next_puja.service_location,
            "status": next_puja.status,
            "videoLink": next_puja.video_room_url
        }

    # 3. Booking Queue (Top 5 pending/upcoming)
    queue = Booking.objects.filter(
        pandit=pandit,
        booking_date__gte=today
    ).exclude(status=BookingStatus.COMPLETED).exclude(status=BookingStatus.CANCELLED).exclude(status=BookingStatus.FAILED).order_by('booking_date', 'booking_time')[:10]
    
    queue_data = []
    for b in queue:
        queue_data.append({
            "id": b.id,
            "customer": b.user.full_name,
            "service": b.service_name,
            "date": b.booking_date,
            "time": b.booking_time,
            "status": b.status
        })
        
    # 4. Earnings Snapshot
    # Week
    week_start = today - datetime.timedelta(days=today.weekday())
    week_earnings = Booking.objects.filter(
        pandit=pandit,
        booking_date__gte=week_start,
        status=BookingStatus.COMPLETED
    ).aggregate(total=Sum('total_fee'))['total'] or 0
    
    # Month
    month_earnings = Booking.objects.filter(
        pandit=pandit,
        booking_date__month=today.month,
        booking_date__year=today.year,
        status=BookingStatus.COMPLETED
    ).aggregate(total=Sum('total_fee'))['total'] or 0
    
    stats_data = {
        "todays_bookings": todays_bookings_count,
        "pending_requests": pending_requests_count,
        "todays_earnings": todays_earnings,
        "available_balance": wallet.available_balance,
        "total_earned": wallet.total_earned,
        "week_earnings": week_earnings,
        "month_earnings": month_earnings,
        "is_online": pandit.is_available
    }

    return Response({
        "stats": stats_data,
        "next_puja": next_puja_data,
        "queue": queue_data
    })


# ---------------------------
# PANDIT: Toggle Availability
# ---------------------------
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_availability(request):
    try:
        pandit = request.user.pandit_profile
    except:
         if getattr(request.user, 'role', '') == 'pandit':
             pandit = Pandit.objects.create(
                 user=request.user, 
                 expertise="General", 
                 language="Hindi",
                 experience_years=0,
                 is_verified=True,
                 verification_status="APPROVED"
             )
             PanditWallet.objects.create(pandit=pandit)
         else:
             return Response({"error": "User is not a pandit"}, status=403)
        
    pandit.is_available = not pandit.is_available
    pandit.save()
    
    return Response({"is_available": pandit.is_available})
