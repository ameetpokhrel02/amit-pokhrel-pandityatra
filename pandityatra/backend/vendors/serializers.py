from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import VendorProfile, VendorPayout
from samagri.models import ShopOrder, ShopOrderItem

User = get_user_model()

class VendorProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = VendorProfile
        fields = [
            'id', 'email', 'full_name', 'shop_name', 'business_type', 
            'address', 'city', 'bank_account_number', 'bank_name', 
            'account_holder_name', 'is_verified', 'balance', 'bio', 'created_at'
        ]
        read_only_fields = ['is_verified', 'balance', 'created_at']

class VendorRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    full_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)

    class Meta:
        model = VendorProfile
        fields = [
            'email', 'password', 'full_name', 'phone_number',
            'shop_name', 'business_type', 'address', 'city',
            'bank_account_number', 'bank_name', 'account_holder_name', 'id_proof'
        ]

    def create(self, validated_data):
        user_data = {
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'full_name': validated_data.pop('full_name'),
            'phone_number': validated_data.pop('phone_number'),
            'username': validated_data.get('email'), # Use email as username
            'role': 'vendor'
        }
        
        user = User.objects.create_user(**user_data)
        vendor_profile = VendorProfile.objects.create(user=user, **validated_data)
        return vendor_profile

class VendorPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorPayout
        fields = '__all__'
        read_only_fields = ['status', 'requested_at', 'paid_at', 'vendor']

class VendorOrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='samagri_item.name', read_only=True)
    
    class Meta:
        model = ShopOrderItem
        fields = ['id', 'item_name', 'quantity', 'price_at_purchase']

class VendorOrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='full_name', read_only=True)
    customer_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ShopOrder
        fields = [
            'id', 'customer_name', 'customer_email', 'total_amount', 
            'status', 'shipping_address', 'city', 'phone_number', 
            'items', 'created_at'
        ]

    def get_items(self, obj):
        # Only return items belonging to the requesting vendor
        vendor = self.context['request'].user.vendor_profile
        items = obj.items.filter(vendor=vendor)
        return VendorOrderItemSerializer(items, many=True).data
