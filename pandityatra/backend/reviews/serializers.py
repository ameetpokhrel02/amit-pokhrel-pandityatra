from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_avatar = serializers.CharField(source='customer.avatar.url', read_only=True, default=None)
    
    class Meta:
        model = Review
        fields = [
            'id', 
            'customer_name', 
            'customer_avatar',
            'rating', 
            'comment', 
            'created_at'
        ]
