from rest_framework import generics, permissions, status
from rest_framework import serializers  
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Pandit
from .serializers import PanditSerializer
from .pandit_serializers import PanditRegistrationSerializer
from users.models import User
from users.otp_utils import send_local_otp


# ============================================
# PANDIT REGISTRATION & VERIFICATION VIEWS
# ============================================

class RegisterPanditView(generics.CreateAPIView):
    """
    Separate endpoint for Pandit registration with document upload.
    Creates a User with role='pandit' and Pandit profile with PENDING status.
    No authentication required - public registration.
    """
    serializer_class = PanditRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pandit = serializer.save()
        
        # Send OTP to phone for verification
        send_local_otp(pandit.user.phone_number)
        
        return Response({
            'detail': 'Pandit registration successful. Please verify your phone number with OTP.',
            'phone_number': pandit.user.phone_number,
            'status': 'pending_verification'
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_pending_pandits(request):
    """
    Admin only: List all pending pandit registrations awaiting verification.
    """
    if not (request.user.is_superuser or request.user.is_staff or request.user.role == 'admin'):
        return Response(
            {'detail': 'Only admins can view pending pandits'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    pending_pandits = Pandit.objects.filter(verification_status='PENDING').order_by('-date_joined')
    serializer = PanditSerializer(pending_pandits, many=True, context={'request': request})
    
    return Response({
        'count': pending_pandits.count(),
        'results': serializer.data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_pandit(request, pandit_id):
    """
    Admin only: Approve a pandit's registration.
    """
    if not (request.user.is_superuser or request.user.is_staff or request.user.role == 'admin'):
        return Response(
            {'detail': 'Only admins can verify pandits'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        pandit = Pandit.objects.get(id=pandit_id)
    except Pandit.DoesNotExist:
        return Response(
            {'detail': 'Pandit not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update verification status
    pandit.verification_status = 'APPROVED'
    pandit.is_verified = True
    pandit.verified_date = timezone.now()
    pandit.verification_notes = request.data.get('notes', '')
    pandit.save()
    
    serializer = PanditSerializer(pandit, context={'request': request})
    
    return Response({
        'detail': f'Pandit {pandit.user.full_name} has been approved!',
        'pandit': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_pandit(request, pandit_id):
    """
    Admin only: Reject a pandit's registration.
    """
    if not (request.user.is_superuser or request.user.is_staff or request.user.role == 'admin'):
        return Response(
            {'detail': 'Only admins can reject pandits'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        pandit = Pandit.objects.get(id=pandit_id)
    except Pandit.DoesNotExist:
        return Response(
            {'detail': 'Pandit not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update verification status
    pandit.verification_status = 'REJECTED'
    pandit.is_verified = False
    pandit.verification_notes = request.data.get('reason', 'No reason provided')
    pandit.save()
    
    serializer = PanditSerializer(pandit, context={'request': request})
    
    return Response({
        'detail': f'Pandit {pandit.user.full_name} has been rejected.',
        'reason': pandit.verification_notes,
        'pandit': serializer.data
    }, status=status.HTTP_200_OK)


# ============================================
# EXISTING PANDIT VIEWS (KEEP AS IS)
# ============================================


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