from rest_framework import serializers
from .models import Review, SiteReview

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_avatar = serializers.SerializerMethodField()
    
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
    
    def get_customer_avatar(self, obj):
        if obj.customer.profile_pic:
            try:
                return obj.customer.profile_pic.url
            except Exception:
                return None
        return None


class SiteReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = SiteReview
        fields = [
            'id',
            'user_name',
            'user_avatar',
            'role',
            'rating',
            'comment',
            'created_at',
        ]
        read_only_fields = ['id', 'user_name', 'user_avatar', 'role', 'created_at']
    
    def get_user_avatar(self, obj):
        if obj.user.profile_pic:
            try:
                return obj.user.profile_pic.url
            except Exception:
                return None
        return None
