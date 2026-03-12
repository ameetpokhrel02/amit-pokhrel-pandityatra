
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from bookings.models import Booking
from pandits.models import Pandit
from .models import PaymentErrorLog
from rest_framework import status
from django.utils import timezone
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def admin_error_logs(request):
    user = request.user
    if not (user.is_staff or user.is_superuser or getattr(user, "role", "") == "admin"):
        return Response({"detail": "Admin only"}, status=403)

    if request.method == "GET":
        logs = PaymentErrorLog.objects.all().order_by("-created_at")[:200]
        data = [
            {
                "id": log.id,
                "error_type": log.error_type,
                "user": log.user.email if log.user else None,
                "booking_id": log.booking_id,
                "payment_id": log.payment_id,
                "message": log.message,
                "context": log.context,
                "resolved": log.resolved,
                "created_at": log.created_at,
                "resolved_at": log.resolved_at,
                "admin_note": log.admin_note,
            }
            for log in logs
        ]
        return Response(data)

    # POST: Mark as resolved or add note
    log_id = request.data.get("id")
    resolved = request.data.get("resolved")
    admin_note = request.data.get("admin_note")
    try:
        log = PaymentErrorLog.objects.get(id=log_id)
        if resolved is not None:
            log.resolved = resolved
            if resolved:
                log.resolved_at = timezone.now()
        if admin_note:
            log.admin_note = admin_note
        log.save()
        return Response({"success": True})
    except PaymentErrorLog.DoesNotExist:
        return Response({"error": "Log not found"}, status=404)


User = get_user_model()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    user = request.user

    if not (user.is_staff or user.is_superuser or user.role in ("admin", "superadmin")):
        return Response({"detail": "Admin only"}, status=403)

    total_users = User.objects.count()
    total_pandits = Pandit.objects.count()
    pending_pandits = Pandit.objects.filter(verification_status="PENDING").count()
    total_bookings = Booking.objects.count()

    return Response({
        "total_users": total_users,
        "total_pandits": total_pandits,
        "pending_pandits": pending_pandits,
        "total_bookings": total_bookings,
        "system_status": "OK"
    })

from .models import ActivityLog

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_activity_logs(request):
    """
    Returns the Activity Logs for the Admin Dashboard.
    Supports filtering by user ID, pandit ID, action_type, and date.
    """
    user = request.user
    if not (user.is_staff or user.is_superuser or getattr(user, "role", "") == "admin"):
         return Response({"detail": "Admin only"}, status=403)

    queryset = ActivityLog.objects.all().select_related('user', 'pandit')
    
    # 1. Filters
    user_id = request.query_params.get("user")
    if user_id:
         queryset = queryset.filter(user_id=user_id)
         
    pandit_id = request.query_params.get("pandit")
    if pandit_id:
         queryset = queryset.filter(pandit_id=pandit_id)

    action_type = request.query_params.get("action_type")
    if action_type:
         queryset = queryset.filter(action_type__iexact=action_type)

    date = request.query_params.get("date")
    if date:
         queryset = queryset.filter(created_at__date=date)

    # Note: For CSV Export, we could check for an `export=csv` parameter. 
    # Usually easier to just do it via JSON on frontend and convert there locally or output raw CSV here.
    # Handling data here as JSON for simplicity.
    
    # Pagination / Limiting - 500 for now to keep it sane
    logs = queryset[:500] 

    data = []
    for log in logs:
        # Resolve names gracefully
        actor_name = log.user.full_name if log.user else "System"
        actor_email = log.user.email if log.user else ""
        
        pandit_name = log.pandit.user.full_name if (log.pandit and log.pandit.user) else ""

        data.append({
             "id": log.id,
             "action_type": log.action_type,
             "details": log.details,
             "ip_address": log.ip_address,
             "created_at": log.created_at,
             "actor_name": actor_name,
             "actor_email": actor_email,
             "pandit_name": pandit_name
        })

    return Response(data)
