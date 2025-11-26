from rest_framework import permissions

class IsPanditOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow only the Pandit owner to edit their profile.
    Admin/Staff can do anything.
    """

    def has_permission(self, request, view):
        # Allow read actions (GET, HEAD, OPTIONS) for any authenticated user 
        # (or even unauthenticated if you want public listing)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Allow all actions for Superuser/Staff
        if request.user and request.user.is_authenticated and (request.user.is_superuser or request.user.role == 'staff'):
            return True
        
        # Deny all other unsafe actions if the user is not a Pandit
        if request.user.role != 'pandit':
            return False
        
        # For Creation (POST): Pandits can only create their own profile (handled in viewset)
        if view.action == 'create' and request.user.role == 'pandit':
            return True

        # Allow authenticated Pandits to view the list (list action handled in viewset)
        if view.action == 'list' and request.user.role == 'pandit':
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Allow read actions (GET) for everyone (if desired)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Allow Admin/Staff to edit/delete any object
        if request.user.is_superuser or request.user.role == 'staff':
            return True

        # Allow the Pandit owner to edit their object
        return obj.user == request.user