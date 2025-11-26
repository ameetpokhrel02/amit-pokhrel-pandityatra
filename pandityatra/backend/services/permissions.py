from rest_framework import permissions

class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Allow read access (GET) to all authenticated users.
    Allow write access (POST, PUT, DELETE) only to Staff/Admin users.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions (POST, PUT, DELETE) are only allowed to staff/admin
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.is_superuser
        )