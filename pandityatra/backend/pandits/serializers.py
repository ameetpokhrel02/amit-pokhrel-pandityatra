from rest_framework import serializers
from .models import Pandit, PanditService
from users.serializers import UserSerializer
from services.serializers import PujaSerializer
from services.models import Puja

class PanditSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Pandit
        fields = (
            'id', 
            'user',
            'user_details',
            'expertise', 
            'experience_years',
            'language',
            'bio',
            'rating',
            'is_available',
            'is_verified', 
            'verification_status',
            'certification_file',
            'date_joined'
        )
        read_only_fields = ('id', 'user_details', 'date_joined', 'user') 

class PanditSimpleSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Pandit
        fields = ['id', 'full_name', 'email']

class PanditServiceSerializer(serializers.ModelSerializer):
    puja_details = PujaSerializer(source='puja', read_only=True)
    puja_id = serializers.PrimaryKeyRelatedField(
        queryset=Puja.objects.all(), source='puja', write_only=True
    )

    class Meta:
        model = PanditService
        fields = [
            'id', 'pandit', 'puja_id', 'puja_details', 
            'custom_price', 'duration_minutes', 'is_active', 
            'is_online', 'is_offline'
        ]
        read_only_fields = ['id', 'pandit']
