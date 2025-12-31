from rest_framework import permissions

class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Allow read access (GET) to all users (authenticated or not).
    Allow write access (POST, PUT, DELETE) only to Staff/Admin users.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any user (public access)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions (POST, PUT, DELETE) are only allowed to staff/admin
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.is_superuser
        )