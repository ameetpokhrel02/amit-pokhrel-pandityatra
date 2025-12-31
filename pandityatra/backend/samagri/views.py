from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAdminUser
from .models import SamagriCategory, SamagriItem, PujaSamagriRequirement
from .serializers import (
    SamagriCategorySerializer, 
    SamagriItemSerializer, 
    WritablePujaSamagriRequirementSerializer,
    PujaSamagriRequirementSerializer
)

# --- 1. Samagri Category Management (Admin Only) ---
class SamagriCategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for Samagri Categories. Restricted to Admin/Staff.
    """
    queryset = SamagriCategory.objects.all()
    serializer_class = SamagriCategorySerializer
    permission_classes = [IsAdminUser]

# --- 2. Samagri Item Management (Admin Only) ---
class SamagriItemViewSet(viewsets.ModelViewSet):
    """
    CRUD for individual Samagri Items. Restricted to Admin/Staff.
    """
    queryset = SamagriItem.objects.all().select_related('category')
    serializer_class = SamagriItemSerializer
    permission_classes = [IsAdminUser]

# --- 3. Puja Samagri Requirement Management (Admin Only) ---
class PujaSamagriRequirementViewSet(viewsets.ModelViewSet):
    """
    CRUD for defining how much Samagri is required for a specific Puja.
    """
    queryset = PujaSamagriRequirement.objects.all().select_related('puja', 'samagri_item')
    serializer_class = WritablePujaSamagriRequirementSerializer
    permission_classes = [IsAdminUser]