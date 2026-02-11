import os
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework import serializers 
from .models import Puja, PujaCategory
from .serializers import PujaSerializer, PujaCategorySerializer
from .permissions import IsStaffOrReadOnly
from pandits.models import Pandit # Need Pandit model for the nested view logic
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# ----------------------------------------------------
# General Puja Management (Admin/Staff only)
# Mapped to: /api/services/ and /api/services/{id}/
# ----------------------------------------------------

class PujaListCreateView(generics.ListCreateAPIView): 
    # List (GET): All users (public access) can see the list.
    # Create (POST): Only Staff/Admin can add items to the master list.
    queryset = Puja.objects.all()
    serializer_class = PujaSerializer
    permission_classes = [IsStaffOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user
        
        # Admin and Pandits can create services
        if user.is_staff or user.is_superuser or getattr(user, 'role', '') in ['admin', 'pandit']:
            serializer.save()
        else:
             raise PermissionDenied("Only staff, administrators, and pandits can create general Puja listings.")


class PujaCategoryListView(generics.ListAPIView):
    queryset = PujaCategory.objects.all()
    serializer_class = PujaCategorySerializer
    permission_classes = [AllowAny]


class PujaDetailView(generics.RetrieveUpdateDestroyAPIView):
    # Retrieve (GET): All users (public access) can see the detail.
    # Update/Destroy (PUT/PATCH/DELETE): Only Staff/Admin can modify/delete.
    queryset = Puja.objects.all()
    serializer_class = PujaSerializer
    permission_classes = [IsStaffOrReadOnly]

# ----------------------------------------------------
# Nested Pandit-Specific Puja List (Pandit Owner Only)
# Mapped to: /api/pandits/{pandit_pk}/services/
# ----------------------------------------------------

class PanditPujaListView(generics.ListCreateAPIView): 
    """
    GET: Lists all Puas offered by a specific Pandit (Public access).
    POST: Allows the logged-in Pandit to create a new Puja for their profile.
    """
    serializer_class = PujaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] 

    def get_queryset(self):
        pandit_pk = self.kwargs.get('pandit_pk')
        try:
            pandit = Pandit.objects.get(pk=pandit_pk)
        except Pandit.DoesNotExist:
            raise NotFound(detail="Pandit not found.")
        
        return Puja.objects.filter(pandit_offerings__pandit=pandit)

    def perform_create(self, serializer):
        pandit_pk = self.kwargs.get('pandit_pk')
        
        try:
            pandit = Pandit.objects.get(pk=pandit_pk)
        except Pandit.DoesNotExist:
            raise NotFound(detail="Pandit not found.")

        # Authorization Check: Ensure the logged-in user is the Pandit they are posting for
        if self.request.user.role != 'pandit' or self.request.user != pandit.user:
            raise PermissionDenied("You can only add services to your own Pandit profile.")
        
        # Save the Puja, automatically linking it to the Pandit instance
        serializer.save(pandit=pandit)

# ----------------------------------------------------
# Nested Pandit-Specific Puja Detail (The Missing View)
# ----------------------------------------------------

class PanditPujaDetailView(generics.RetrieveUpdateDestroyAPIView): # 🚨 NEW CLASS ADDED 🚨
    """
    GET: Retrieve a specific Puja for a Pandit (Public access).
    PUT/PATCH/DELETE: Allow the Pandit owner to modify or delete the Puja.
    Mapped to: /api/pandits/<pandit_pk>/services/<pk>/
    """
    serializer_class = PujaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] 

    def get_queryset(self):
        # Filter by both the Pandit ID (from kwargs) and the Puja ID (from pk).
        pandit_pk = self.kwargs.get('pandit_pk')
        pk = self.kwargs.get('pk')
        
        # Ensure the Puja belongs to the Pandit specified in the URL path.
        queryset = Puja.objects.filter(pandit__pk=pandit_pk, pk=pk)
        return queryset

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        
        # If it is a write operation (PUT, PATCH, DELETE)
        if request.method not in permissions.SAFE_METHODS:
            user = request.user
            # Check if the user is authenticated, is a pandit, AND is the owner of the puja's pandit profile
            if not (user.is_authenticated and user.role == 'pandit' and user == obj.pandit.user):
                raise PermissionDenied("You do not have permission to modify this service.")

