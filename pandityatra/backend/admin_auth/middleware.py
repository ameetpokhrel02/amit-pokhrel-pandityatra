from django.http import JsonResponse
from django.urls import resolve

class Admin2FAMiddleware:
    """
    Middleware that enforces 2FA verification for Admin and Audit roles.
    If a user is an admin/audit but not 'verified' via TOTP, they are restricted
    from accessing sensitive /api/admin/ endpoints.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Check if user is an admin/audit role
            if request.user.role in ['admin', 'superadmin', 'audit']:
                # If they are authenticated but not "is_verified", block sensitive paths
                # django-otp adds .is_verified() to the user object
                is_verified = getattr(request.user, 'is_verified', lambda: False)()
                
                # List of paths that REQUIRE 2FA
                path = request.path
                if path.startswith('/api/admin/') and not is_verified:
                    return JsonResponse({
                        "detail": "Two-factor authentication required for administrative access.",
                        "code": "2fa_required"
                    }, status=403)

        return self.get_response(request)
