from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Vendor, VendorPayout
from samagri.models import ShopOrder, ShopOrderItem

User = get_user_model()

class VendorProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Vendor Account management (replaces old Profile system).
    Now inherits directly from User.
    """
    email = serializers.EmailField(read_only=True)
    full_name = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False)
    profile_pic = serializers.ImageField(required=False, allow_null=True)
    user_active = serializers.BooleanField(source='is_active', read_only=True)

    user_details = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = [
            'id', 'user_details', 'email', 'full_name', 'phone_number', 'profile_pic', 'user_active', 'shop_name', 
            'business_type', 'address', 'city', 'bank_account_number', 'bank_name', 
            'account_holder_name', 'is_verified', 'balance', 'bio', 
            'is_accepting_orders', 'auto_approve_orders', 'notification_email', 
            'is_low_stock_alert_enabled', 'created_at', 'id_proof'
        ]
        read_only_fields = ['is_verified', 'balance', 'created_at']

    def update(self, instance, validated_data):
        # Fields like full_name, phone_number, profile_pic are now directly on the instance (Vendor is User)
        return super().update(instance, validated_data)

    def get_user_details(self, obj):
        request = self.context.get('request')
        profile_pic_url = None
        if obj.profile_pic:
            profile_pic_url = request.build_absolute_uri(obj.profile_pic.url) if request else obj.profile_pic.url
        return {
            'email': obj.email,
            'full_name': obj.full_name,
            'phone_number': obj.phone_number,
            'profile_pic': profile_pic_url,
            'is_active': obj.is_active,
        }

class VendorRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'}, required=False)
    full_name = serializers.CharField(write_only=True, required=False)
    phone_number = serializers.CharField(write_only=True, required=False)
    profile_pic = serializers.ImageField(required=False)

    class Meta:
        model = Vendor
        fields = [
            'email', 'password', 'full_name', 'phone_number', 'profile_pic',
            'shop_name', 'business_type', 'address', 'city',
            'bank_account_number', 'bank_name', 'account_holder_name', 'id_proof', 'bio'
        ]

    def create(self, validated_data):
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)
        full_name = validated_data.pop('full_name', None)
        phone_number = validated_data.pop('phone_number', None)
        profile_pic = validated_data.pop('profile_pic', None)

        if not email:
             raise serializers.ValidationError({"email": "Email is required."})

        # Check if user already exists (MTI upgrade logic)
        existing_user = User.objects.filter(email__iexact=email).first()
        
        # Phone number uniqueness check
        if phone_number:
            phone_user = User.objects.filter(phone_number=phone_number).first()
            if phone_user:
                # If it's the same user as the existing email user, that's fine for an upgrade
                if not (existing_user and phone_user.id == existing_user.id):
                    raise serializers.ValidationError({"phone_number": "An account with this phone number already exists."})

        if existing_user:
            # Check if already a vendor
            if hasattr(existing_user, 'vendor') and existing_user.vendor:
                raise serializers.ValidationError({"email": "A vendor account with this email already exists."})
            
            from django.utils import timezone
            # Upgrade existing User to Vendor
            # We create specific Vendor record linked to the existing User ID
            vendor = Vendor(
                user_ptr=existing_user,
                shop_name=validated_data.get('shop_name'),
                business_type=validated_data.get('business_type'),
                address=validated_data.get('address'),
                city=validated_data.get('city'),
                bank_account_number=validated_data.get('bank_account_number'),
                bank_name=validated_data.get('bank_name'),
                account_holder_name=validated_data.get('account_holder_name'),
                bio=validated_data.get('bio'),
                created_at=timezone.now(),
                updated_at=timezone.now(),
                role='vendor'
            )
            # Ensure the user's role is updated in the base table too
            existing_user.role = 'vendor'
            if full_name: existing_user.full_name = full_name
            if phone_number: existing_user.phone_number = phone_number
            if profile_pic: existing_user.profile_pic = profile_pic
            existing_user.save()
            
            vendor.save() 
            return vendor

        # Standard new registration
        if not password:
            raise serializers.ValidationError({"password": "Password is required for new accounts."})

        # Unique Username Generation
        base_username = email.split('@')[0]
        username = base_username
        import random, string
        while User.objects.filter(username=username).exists():
            suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
            username = f"{base_username}_{suffix}"

        vendor = Vendor(
            email=email,
            username=username,
            full_name=full_name or email.split('@')[0],
            phone_number=phone_number,
            profile_pic=profile_pic,
            role='vendor',
            **validated_data
        )
        vendor.set_password(password)
        vendor.save()
        
        return vendor

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
            'id', 'customer_name', 'customer_email', 'buyer_role', 'total_amount', 
            'status', 'shipping_address', 'city', 'phone_number', 
            'items', 'created_at'
        ]

    def get_items(self, obj):
        # Access the vendor account directly from the user
        user = self.context['request'].user
        if hasattr(user, 'vendor'):
            items = obj.items.filter(vendor=user.vendor)
            return VendorOrderItemSerializer(items, many=True).data
        return []
