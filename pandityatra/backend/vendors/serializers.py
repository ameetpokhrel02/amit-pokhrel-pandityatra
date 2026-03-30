from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import VendorProfile, VendorPayout
from samagri.models import ShopOrder, ShopOrderItem

User = get_user_model()

class VendorProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False)
    profile_pic = serializers.ImageField(source='user.profile_pic', required=False, allow_null=True)
    user_details = serializers.SerializerMethodField()
    user_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = VendorProfile
        fields = [
            'id', 'email', 'full_name', 'phone_number', 'profile_pic', 'user_details', 'user_active', 'shop_name', 
            'business_type', 'address', 'city', 'bank_account_number', 'bank_name', 
            'account_holder_name', 'is_verified', 'balance', 'bio', 
            'is_accepting_orders', 'auto_approve_orders', 'notification_email', 
            'is_low_stock_alert_enabled', 'created_at', 'id_proof'
        ]
        read_only_fields = ['is_verified', 'balance', 'created_at']

    def get_user_details(self, obj):
        user = obj.user
        request = self.context.get('request')
        profile_pic_url = None
        if user.profile_pic:
            if request:
                profile_pic_url = request.build_absolute_uri(user.profile_pic.url)
            else:
                profile_pic_url = user.profile_pic.url
                
        return {
            'id': user.id,
            'full_name': user.full_name,
            'phone_number': user.phone_number,
            'email': user.email,
            'profile_pic': profile_pic_url
        }

    def update(self, instance, validated_data):
        user = instance.user
        
        # Update user details if provided as flat fields
        full_name = validated_data.pop('full_name', None)
        phone_number = validated_data.pop('phone_number', None)
        user_data = validated_data.pop('user', {})
        profile_pic = user_data.get('profile_pic')
        
        user_updated = False
        if full_name and user.full_name != full_name:
            user.full_name = full_name
            user_updated = True
        if phone_number and user.phone_number != phone_number:
            user.phone_number = phone_number
            user_updated = True
        if profile_pic:
            user.profile_pic = profile_pic
            user_updated = True
            
        if user_updated:
            user.save()
            
        return super().update(instance, validated_data)

class VendorRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'}, required=False)
    full_name = serializers.CharField(write_only=True, required=False)
    phone_number = serializers.CharField(write_only=True, required=False)
    profile_pic = serializers.ImageField(required=False)

    class Meta:
        model = VendorProfile
        fields = [
            'email', 'password', 'full_name', 'phone_number', 'profile_pic',
            'shop_name', 'business_type', 'address', 'city',
            'bank_account_number', 'bank_name', 'account_holder_name', 'id_proof', 'bio'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        
        # Pop user-level fields before profile creation
        full_name = validated_data.pop('full_name', None)
        phone_number = validated_data.pop('phone_number', None)
        profile_pic = validated_data.pop('profile_pic', None)

        # If user is not authenticated, we expect email/password to create them
        if not user or user.is_anonymous:
            email = validated_data.pop('email', None)
            password = validated_data.pop('password', None)
            
            if not email or not password:
                raise serializers.ValidationError({"email": "Email and password are required for manual registration."})
                
            user_data = {
                'email': email,
                'password': password,
                'full_name': full_name or email.split('@')[0],
                'phone_number': phone_number,
                'profile_pic': profile_pic,
                'username': email.split('@')[0], # Use prefix as username
                'role': 'vendor'
            }
            user = User.objects.create_user(**user_data)
        else:
            # If user is authenticated (e.g. via Google), update user details if provided
            user_updated = False
            if full_name and user.full_name != full_name:
                user.full_name = full_name
                user_updated = True
            if phone_number and user.phone_number != phone_number:
                user.phone_number = phone_number
                user_updated = True
            if profile_pic:
                user.profile_pic = profile_pic
                user_updated = True
            
            if user.role != 'vendor':
                user.role = 'vendor'
                user_updated = True
                
            if user_updated:
                user.save()

        # Ensure verification_status is PENDING for new profiles
        vendor_profile = VendorProfile.objects.create(
            user=user, 
            verification_status='PENDING',
            is_verified=False,
            **validated_data
        )
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
