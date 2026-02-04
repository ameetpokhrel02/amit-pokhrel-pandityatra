from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admins and superusers.
    Checks for is_superuser OR is_staff OR role == 'admin'.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            request.user.is_superuser or 
            request.user.is_staff or 
            getattr(request.user, 'role', '') == 'admin'
        )

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow read-only for anyone, but only admin for modifications.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
            
        return (
            request.user.is_superuser or 
            request.user.is_staff or 
            getattr(request.user, 'role', '') == 'admin'
        )
