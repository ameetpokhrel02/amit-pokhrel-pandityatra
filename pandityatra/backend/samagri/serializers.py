from rest_framework import serializers
from .models import SamagriCategory, SamagriItem, PujaSamagriRequirement, ShopOrder, ShopOrderItem, Wishlist, CartItem
from services.serializers import PujaSerializer
from payments.utils import convert_npr_to_usd

# --- 1. Category Serializer ---
class SamagriCategorySerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = SamagriCategory
        fields = ['id', 'name', 'slug', 'description', 'image', 'icon', 'order', 'is_active', 'items']
        read_only_fields = ['id', 'slug']

    def get_items(self, obj):
        # Only show approved and active items in the category view
        approved_items = obj.items.filter(is_approved=True, is_active=True)
        return SamagriItemSerializer(approved_items, many=True).data

# --- 2. Item Serializer ---
class SamagriItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    vendor_details = serializers.SerializerMethodField()

    class Meta:
        model = SamagriItem
        fields = ['id', 'name', 'category', 'category_name', 'price', 'price_usd', 'stock_quantity', 'unit', 'image', 'description', 'is_active', 'is_approved', 'vendor', 'vendor_details', 'created_at']
        read_only_fields = ['id', 'category_name', 'vendor_details', 'created_at']

    def get_vendor_details(self, obj):
        if obj.vendor:
            return {
                "id": obj.vendor.id,
                "shop_name": obj.vendor.shop_name
            }
        return {"id": 0, "shop_name": "PanditYatra Official"}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # If price_usd is not set or 0.00, calculate it on the fly
        if not data.get('price_usd') or float(data.get('price_usd')) == 0:
            data['price_usd'] = convert_npr_to_usd(instance.price)
        return data

# --- 3. Shop Order Serializers ---

class ShopOrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    item_image = serializers.SerializerMethodField()
    
    class Meta:
        model = ShopOrderItem
        fields = ['id', 'samagri_item', 'item_name', 'item_image', 'quantity', 'price_at_purchase']

    def get_item_name(self, obj):
        if obj.samagri_item:
            return obj.samagri_item.name
        return obj.item_name or "Deleted Item"

    def get_item_image(self, obj):
        if obj.samagri_item and obj.samagri_item.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.samagri_item.image.url)
            return str(obj.samagri_item.image)
        return None

class ShopOrderSerializer(serializers.ModelSerializer):
    items = ShopOrderItemSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ShopOrder
        fields = [
            'id', 'user_email', 'total_amount', 'status', 'buyer_role',
            'full_name', 'phone_number', 'shipping_address', 'city',
            'payment_method', 'transaction_id', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'user_email', 'total_amount', 'transaction_id', 'created_at']

class ShopCheckoutSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    full_name = serializers.CharField(max_length=100)
    phone_number = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    payment_method = serializers.ChoiceField(choices=['STRIPE', 'KHALTI', 'ESEWA'])

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


# --- 5. Wishlist Serializers ---

class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for reading wishlist items"""
    item = SamagriItemSerializer(source='samagri_item', read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'item', 'created_at']
        read_only_fields = ['id', 'created_at']


class WishlistAddSerializer(serializers.Serializer):
    """Serializer for adding item to wishlist"""
    item_id = serializers.IntegerField(required=True)

    def validate_item_id(self, value):
        if not SamagriItem.objects.filter(id=value).exists():
            raise serializers.ValidationError("Item not found.")
        return value

# --- 6. Cart Serializers ---

class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for reading and writing cart items"""
    item = SamagriItemSerializer(source='samagri_item', read_only=True)
    item_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = CartItem
        fields = ['id', 'item', 'item_id', 'quantity', 'created_at', 'updated_at']
        read_only_fields = ['id', 'item', 'created_at', 'updated_at']

    def validate_item_id(self, value):
        if not SamagriItem.objects.filter(id=value).exists():
            raise serializers.ValidationError("Samagri item not found.")
        return value
