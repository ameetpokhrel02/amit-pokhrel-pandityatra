import logging

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """
    Get client's real IP address from HTTP request.
    Handles proxies and load balancers.
    """
    if not request:
        return None
        
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_activity(user=None, action_type="", details="", request=None, pandit=None):
    """
    Helper to easily record an ActivityLog instance.
    Silently fails and logs exception if insertion fails to avoid
    disrupting the main user flow.
    """
    from .models import ActivityLog
    
    try:
        ip_address = get_client_ip(request) if request else None
        
        # If user is a pandit, try to attach their pandit profile if not explicitly provided
        if not pandit and user and getattr(user, 'role', '') == 'pandit':
            if hasattr(user, 'pandit_profile'):
                pandit = user.pandit_profile

        ActivityLog.objects.create(
            user=user if user and user.is_authenticated else None,
            pandit=pandit,
            action_type=action_type,
            details=details,
            ip_address=ip_address
        )
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
