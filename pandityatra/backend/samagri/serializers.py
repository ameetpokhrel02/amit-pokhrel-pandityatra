from rest_framework import serializers
from .models import SamagriCategory, SamagriItem, PujaSamagriRequirement, ShopOrder, ShopOrderItem
from services.serializers import PujaSerializer

# --- 1. Category Serializer ---
class SamagriCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SamagriCategory
        fields = ['id', 'name', 'slug', 'description', 'image', 'icon', 'order', 'is_active']
        read_only_fields = ['id', 'slug']

# --- 2. Item Serializer ---
class SamagriItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = SamagriItem
        fields = ['id', 'name', 'category', 'category_name', 'price', 'stock_quantity', 'unit', 'image', 'description', 'is_active', 'created_at']
        read_only_fields = ['id', 'category_name', 'created_at']

# --- 3. Shop Order Serializers ---

class ShopOrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ShopOrderItem
        fields = ['id', 'samagri_item', 'item_name', 'quantity', 'price_at_purchase']

    def get_item_name(self, obj):
        if obj.samagri_item:
            return obj.samagri_item.name
        # Fallback to the snapshot name if item is deleted
        return obj.item_name or "Deleted Item"

class ShopOrderSerializer(serializers.ModelSerializer):
    items = ShopOrderItemSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ShopOrder
        fields = [
            'id', 'user_email', 'total_amount', 'status', 
            'full_name', 'phone_number', 'shipping_address', 'city',
            'payment_method', 'transaction_id', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'user_email', 'status', 'total_amount', 'transaction_id', 'created_at']

class ShopCheckoutSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    full_name = serializers.CharField(max_length=100)
    phone_number = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    payment_method = serializers.ChoiceField(choices=['STRIPE', 'KHALTI'])

# --- 4. Puja Requirement Serializer ---
class PujaSamagriRequirementSerializer(serializers.ModelSerializer):
    samagri_name = serializers.CharField(source='samagri_item.name', read_only=True)
    samagri_unit = serializers.CharField(source='samagri_item.unit', read_only=True)
    samagri_price = serializers.DecimalField(source='samagri_item.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PujaSamagriRequirement
        fields = ['samagri_name', 'samagri_unit', 'quantity', 'samagri_price']
        read_only_fields = fields

class WritablePujaSamagriRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PujaSamagriRequirement
        fields = ['puja', 'samagri_item', 'quantity']