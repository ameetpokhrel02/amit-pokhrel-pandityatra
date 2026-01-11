from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response    
from pandits.models import Pandit
from payments.models import PanditWithdrawal # Updated imports: Withdrawal moved to payments app
from pandits.serializers import PanditSerializer


# ===========================
# EXISTING VERIFICATION VIEWS
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated]) # Changed to allow custom admin check
def pending_pandits(request):
    # Only Admin / Staff
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)
        
    qs = Pandit.objects.filter(is_verified=False)
    return Response(PanditSerializer(qs, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_pandit(request, pandit_id):
    # Only Admin / Staff
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    try:
        pandit = Pandit.objects.get(id=pandit_id)
    except Pandit.DoesNotExist:
        return Response({"error": "Pandit not found."}, status=404)
    
# ===========================
# NEW EARNINGS & PAYOUT SVIEWS
# ===========================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_withdrawal(request, id):
    # Only Admin / Staff
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    try:
        w = PanditWithdrawal.objects.get(id=id)
    except PanditWithdrawal.DoesNotExist:
         return Response({"error": "Withdrawal request not found"}, status=404)
        
    if w.status != "PENDING":
        return Response({"error": "Request is not pending"}, status=400)

    pandit = w.pandit
    
    # Double check balance
    if pandit.available_balance < w.amount:
         return Response({"error": "Pandit balance is insufficient now"}, status=400)

    w.status = "APPROVED"
    w.save()

    pandit.available_balance -= w.amount
    pandit.withdrawn_amount += w.amount
    pandit.save()

    return Response({"success": "Payout approved and balance deducted"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_withdrawals(request):
     # Only Admin / Staff
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)
        
    withdrawals = PanditWithdrawal.objects.all().order_by('-created_at')
    data = []
    for w in withdrawals:
        data.append({
            "id": w.id,
            "pandit_name": w.pandit.user.full_name,
            "amount": w.amount,
            "status": w.status,
            "created_at": w.created_at
        })
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_pandit_earnings(request):
    """
    List earning stats for all pandits
    """
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)
        
    pandits = Pandit.objects.all()
    serializer = PanditSerializer(pandits, many=True)
    return Response(serializer.data)

    pandit.is_verified = True
    pandit.save()

    return Response({
        "message": "Pandit approved",
        "pandit_id": pandit.id
    })

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def reject_pandit(request, pandit_id):
    try:
        pandit = Pandit.objects.get(id=pandit_id)
    except Pandit.DoesNotExist:
        return Response({"error": "Pandit not found."}, status=404)
    
    pandit.delete()

    return Response({
        "message": "Pandit rejected and removed",})