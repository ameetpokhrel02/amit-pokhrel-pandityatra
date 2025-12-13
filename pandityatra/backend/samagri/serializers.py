from rest_framework import serializers
from .models import SamagriCategory, SamagriItem, PujaSamagriRequirement
from services.serializers import PujaSerializer # Assuming PujaSerializer is defined here

# --- 1. Category Serializer ---
class SamagriCategorySerializer(serializers.ModelSerializer):
    """Serializer for reading and writing Samagri categories."""
    class Meta:
        model = SamagriCategory
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

# --- 2. Item Serializer ---
class SamagriItemSerializer(serializers.ModelSerializer):
    """Serializer for reading and writing individual Samagri items."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = SamagriItem
        fields = ['id', 'name', 'category', 'category_name', 'price', 'unit', 'is_active', 'created_at']
        read_only_fields = ['id', 'category_name', 'created_at']

# --- 3. Puja Requirement Serializer (Nested Read-Only) ---
class PujaSamagriRequirementSerializer(serializers.ModelSerializer):
    """
    Serializer used to show what Samagri an item requires when viewing a Puja.
    """
    samagri_name = serializers.CharField(source='samagri_item.name', read_only=True)
    samagri_unit = serializers.CharField(source='samagri_item.unit', read_only=True)
    samagri_price = serializers.DecimalField(source='samagri_item.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PujaSamagriRequirement
        fields = ['samagri_name', 'samagri_unit', 'quantity_required', 'samagri_price']
        read_only_fields = fields

# --- 4. Writable Requirement Serializer (For creating/updating links) ---
class WritablePujaSamagriRequirementSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating the link between a Puja and a Samagri item.
    Used in a dedicated Requirement ViewSet.
    """
    class Meta:
        model = PujaSamagriRequirement
        fields = ['puja', 'samagri_item', 'quantity_required']