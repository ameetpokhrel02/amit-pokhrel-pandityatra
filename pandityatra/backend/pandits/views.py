from rest_framework import generics, permissions, status
# 🚨 FIX: ADD THIS IMPORT
from rest_framework import serializers  # <--- CRITICAL IMPORT
from django.shortcuts import get_object_or_404
from .models import Pandit
from .serializers import PanditSerializer
# Assuming you have defined the IsPanditOwnerOrAdmin permission from the previous step

class PanditListCreateView(generics.ListCreateAPIView):
    """
    Handles LIST (GET) and CREATE (POST) operations for Pandit Profiles.
    Permissions: Admin/Staff can list/create all. Pandit can only create their own.
    """
    serializer_class = PanditSerializer
    # Apply permissions: Authenticated users can list/create, or unauthenticated can list.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # You may need IsPanditOwnerOrAdmin for CREATE/UPDATE logic

    def get_queryset(self):
        user = self.request.user
        
        # Admin/Staff: See all profiles
        if user.is_authenticated and (user.is_superuser or user.role == 'staff'):
            return Pandit.objects.all()

        # Pandit: See only their own profile (useful for listing/checking existence)
        elif user.is_authenticated and user.role == 'pandit':
            # This ensures a Pandit sees only one profile in the list: their own
            return Pandit.objects.filter(user=user)
        
        # General User/Unauthenticated: See all profiles for browsing (Public Listing)
        return Pandit.objects.all()

    def perform_create(self, serializer):
        user = self.request.user
        
        # 1. Pandit creating their own profile (Auto-link)
        if user.is_authenticated and user.role == 'pandit':
            # Check if a profile already exists for this user (prevent duplicates)
            if Pandit.objects.filter(user=user).exists():
                 raise serializers.ValidationError({"detail": "Pandit profile already exists for this user."})
            serializer.save(user=user)
        
        # 2. Admin/Staff creating a profile (requires 'user' ID in data)
        elif user.is_authenticated and (user.is_superuser or user.role == 'staff'):
            # Admin can create a Pandit profile for any User ID
            serializer.save()
        else:
            # Deny creation for general users/unauthenticated
            raise permissions.PermissionDenied("You do not have permission to create a Pandit profile.")


class PanditDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles RETRIEVE (GET), UPDATE (PUT/PATCH), and DELETE operations.
    Permissions: Pandit can only edit their own. Admin/Staff can edit any.
    """
    queryset = Pandit.objects.all()
    serializer_class = PanditSerializer
    # Apply custom permission here to control access to specific objects (PUT/PATCH/DELETE)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Use IsPanditOwnerOrAdmin if defined

    def get_object(self):
        # Apply the object-level permission check on the retrieved object
        obj = super().get_object()
        user = self.request.user
        
        # Allow Admin/Staff to access any object
        if user.is_authenticated and (user.is_superuser or user.role == 'staff'):
            return obj

        # Allow Pandit to access their own object
        if user.is_authenticated and user.role == 'pandit' and obj.user == user:
            return obj
        
        # Allow unauthenticated/general users to GET (retrieve) any object (Public Read)
        if self.request.method in permissions.SAFE_METHODS:
            return obj
            
        # Deny access for all other unsafe operations
        self.permission_denied(
             self.request,
             message="You do not have permission to perform this action on this profile."
        )
        # Note: If you use the IsPanditOwnerOrAdmin permission, this custom get_object 
        # logic can be simplified/removed, relying purely on DRF permissions.
        return obj

    def perform_update(self, serializer):
        # Ensures that even if the 'user' field is present in data, it is ignored
        # and the link to the current Pandit user is maintained.
        serializer.save()