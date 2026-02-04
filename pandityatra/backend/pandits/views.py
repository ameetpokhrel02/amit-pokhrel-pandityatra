from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import Pandit, PanditService, PanditAvailability
from .serializers import PanditSerializer, PanditServiceSerializer, PanditDetailSerializer, PanditAvailabilitySerializer
from .pandit_serializers import PanditRegistrationSerializer
from payments.models import PanditWithdrawal
from services.models import Puja
from services.serializers import PujaSerializer

# ---------------------------
# Pandit Registration
# ---------------------------
class RegisterPanditView(generics.CreateAPIView):
    # We keep the serializer for structural validation, but we customize creation logic
    serializer_class = PanditRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # Case 1: User is already authenticated (e.g. via Google or existing session)
        if self.request.user.is_authenticated:
            user = self.request.user
            # Ensure the user gets the pandit role
            if user.role != 'pandit':
                user.role = 'pandit'
                user.save()
            
            # Extract Pandit specific fields from the serializer data
            # Note: The serializer create() normally handles User creation, 
            # so we bypass it and create the Pandit profile directly here.
            data = serializer.validated_data
            Pandit.objects.create(
                user=user,
                expertise=data['expertise'],
                language=data['language'],
                experience_years=data['experience_years'],
                bio=data.get('bio', ''),
                certification_file=data['certification_file'],
                verification_status='PENDING',
                is_verified=False
            )
        else:
            # Case 2: Standard guest registration (creates both User and Pandit)
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
        
        puja = serializer.validated_data.get('puja')
        if PanditService.objects.filter(pandit=self.request.user.pandit_profile, puja=puja).exists():
             raise ValidationError("You already offer this service")
             
        serializer.save(pandit=self.request.user.pandit_profile)

class PujaCatalogView(generics.ListAPIView):
    queryset = Puja.objects.filter(is_available=True)
    serializer_class = PujaSerializer
    permission_classes = [permissions.AllowAny]


# ---------------------------
# PANDIT: Calendar & Availability
# ---------------------------
class PanditCalendarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Return all events: Bookings and Availability Blocks
        """
        try:
            pandit = request.user.pandit_profile
        except:
             return Response({"error": "Not a pandit"}, status=403)

        # 1. Get Bookings
        bookings = Booking.objects.filter(
            pandit=pandit,
            status__in=[BookingStatus.ACCEPTED, BookingStatus.COMPLETED, BookingStatus.PENDING]
        )
        
        events = []
        for b in bookings:
            start_dt = datetime.datetime.combine(b.booking_date, b.booking_time)
            # Assume 1 hour default duration if service detail missing (MVP)
            # In future, use b.service.duration_minutes
            end_dt = start_dt + datetime.timedelta(hours=1) 
            
            color = "#3b82f6" # Blue for Accepted
            if b.status == BookingStatus.PENDING: color = "#eab308" # Yellow
            if b.status == BookingStatus.COMPLETED: color = "#22c55e" # Green
            
            events.append({
                "id": f"booking-{b.id}",
                "title": f"{b.service_name} ({b.user.full_name})",
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
                "backgroundColor": color,
                "extendedProps": {
                    "type": "booking",
                    "status": b.status,
                    "location": b.service_location
                }
            })

        # 2. Get Availability Blocks
        blocks = PanditAvailability.objects.filter(pandit=pandit)
        for block in blocks:
             events.append({
                "id": f"block-{block.id}",
                "title": block.title or "Unavailable",
                "start": block.start_time.isoformat(),
                "end": block.end_time.isoformat(),
                "backgroundColor": "#6b7280", # Gray
                "extendedProps": {
                    "type": "block"
                }
            })

        return Response(events)

    def post(self, request):
        """
        Create a new Availability Block (Mark as Unavailable)
        """
        try:
            pandit = request.user.pandit_profile
        except:
             return Response({"error": "Not a pandit"}, status=403)
             
        data = request.data
        serializer = PanditAvailabilitySerializer(data=data)
        if serializer.is_valid():
            serializer.save(pandit=pandit)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_availability_block(request, block_id):
    try:
        pandit = request.user.pandit_profile
        block = get_object_or_404(PanditAvailability, id=block_id, pandit=pandit)
        block.delete()
        return Response({"success": "Block removed"})
    except:
        return Response({"error": "Action failed"}, status=400)


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

    # 3. Today's Schedule (NEW)
    todays_schedule = Booking.objects.filter(
        pandit=pandit,
        booking_date=today
    ).order_by('booking_time')

    schedule_data = []
    for b in todays_schedule:
        schedule_data.append({
            "id": b.id,
            "title": b.service_name,
            "time": b.booking_time,
            "customer": b.user.full_name,
            "status": b.status,
             # Video link only if status is Accepted
            "video_link": b.video_room_url if b.status == BookingStatus.ACCEPTED else None
        })

    # 4. Booking Queue (Top 5 pending/upcoming)
    queue = Booking.objects.filter(
        pandit=pandit,
        booking_date__gte=today
    ).exclude(status__in=[BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.FAILED]).order_by('booking_date', 'booking_time')[:10]
    
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
        
    # 5. Earnings Snapshot
    week_start = today - datetime.timedelta(days=today.weekday())
    week_earnings = Booking.objects.filter(
        pandit=pandit,
        booking_date__gte=week_start,
        status=BookingStatus.COMPLETED
    ).aggregate(total=Sum('total_fee'))['total'] or 0
    
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
        "schedule": schedule_data, # Return Today's Schedule
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


# ---------------------------
# PUBLIC: Search & Profile
# ---------------------------
class PanditViewSet(viewsets.ModelViewSet):
    """
    Admins can update/delete any pandit. Public can read/list.
    """
    queryset = Pandit.objects.select_related('user').prefetch_related(
        'services', 'services__puja', 'reviews', 'reviews__customer'
    ).order_by('-rating')

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Pandit.objects.all()
        service_id = self.request.query_params.get('service_id')
        if service_id:
            queryset = queryset.filter(services__puja_id=service_id).distinct()
        return queryset

    def get_serializer_class(self):
        if self.action in ['retrieve', 'profile']:
            return PanditDetailSerializer
        return PanditSerializer

    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        pandit = self.get_object()
        serializer = PanditDetailSerializer(pandit)
        return Response(serializer.data)
