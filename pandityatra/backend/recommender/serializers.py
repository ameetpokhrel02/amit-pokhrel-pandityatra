from rest_framework import serializers
from .models import (
    SamagriRecommendation,
    PujaTemplate,
    PujaTemplateItem,
    UserSamagriPreference,
    RecommendationLog
)
from samagri.serializers import SamagriItemSerializer
from services.serializers import PujaSerializer


class SamagriRecommendationSerializer(serializers.ModelSerializer):
    """
    Serializer for samagri recommendations.
    Includes nested item details and puja info.
    """
    samagri_item = SamagriItemSerializer(read_only=True)
    puja_name = serializers.CharField(source='puja.name', read_only=True)
    purchase_rate_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = SamagriRecommendation
        fields = [
            'id',
            'puja',
            'puja_name',
            'samagri_item',
            'confidence_score',
            'is_essential',
            'is_optional',
            'priority',
            'category',
            'quantity_min',
            'quantity_max',
            'quantity_default',
            'unit',
            'reason',
            'description',
            'times_recommended',
            'times_purchased',
            'purchase_rate',
            'purchase_rate_percentage',
            'average_rating',
            'is_active',
            'is_seasonal',
            'seasonal_months',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'times_recommended',
            'times_purchased',
            'purchase_rate',
            'created_at',
            'updated_at'
        ]
    
    def get_purchase_rate_percentage(self, obj):
        """Convert purchase rate to percentage"""
        return round(obj.purchase_rate * 100, 2)


class SamagriRecommendationDetailedSerializer(SamagriRecommendationSerializer):
    """
    Extended serializer with additional analytics data.
    """
    is_recommended = serializers.SerializerMethodField()
    recommendation_explanation = serializers.CharField(source='reason')
    
    class Meta(SamagriRecommendationSerializer.Meta):
        fields = SamagriRecommendationSerializer.Meta.fields + [
            'is_recommended',
            'recommendation_explanation'
        ]
    
    def get_is_recommended(self, obj):
        """Check if this recommendation is above confidence threshold"""
        return obj.confidence_score >= 0.5


class PujaTemplateItemSerializer(serializers.ModelSerializer):
    """
    Serializer for items in a puja template.
    """
    samagri_item = SamagriItemSerializer(read_only=True)
    samagri_item_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = PujaTemplateItem
        fields = [
            'id',
            'template',
            'samagri_item',
            'samagri_item_id',
            'quantity',
            'unit',
            'is_required'
        ]


class PujaTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for puja templates (pre-configured samagri bundles).
    """
    samagri_items = PujaTemplateItemSerializer(many=True, read_only=True)
    recommended_for_pujas = PujaSerializer(many=True, read_only=True)
    total_items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PujaTemplate
        fields = [
            'id',
            'name',
            'puja_type',
            'description',
            'recommended_for_pujas',
            'samagri_items',
            'total_items_count',
            'estimated_cost',
            'estimated_cost_with_discount',
            'is_active',
            'is_featured',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_total_items_count(self, obj):
        """Get total items in template"""
        return obj.samagri_items.count()


class PujaTemplateCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating puja templates with items.
    """
    samagri_items_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = PujaTemplate
        fields = [
            'id',
            'name',
            'puja_type',
            'description',
            'estimated_cost',
            'estimated_cost_with_discount',
            'is_active',
            'is_featured',
            'samagri_items_ids'
        ]
    
    def create(self, validated_data):
        samagri_ids = validated_data.pop('samagri_items_ids', [])
        template = PujaTemplate.objects.create(**validated_data)
        
        for samagri_id in samagri_ids:
            PujaTemplateItem.objects.create(
                template=template,
                samagri_item_id=samagri_id
            )
        
        return template


class UserSamagriPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for user's samagri preferences.
    """
    samagri_item = SamagriItemSerializer(read_only=True)
    samagri_item_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = UserSamagriPreference
        fields = [
            'id',
            'user',
            'samagri_item',
            'samagri_item_id',
            'times_purchased',
            'last_purchased',
            'average_quantity',
            'total_spent',
            'is_favorite',
            'never_recommend',
            'prefer_bulk',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'times_purchased',
            'last_purchased',
            'total_spent',
            'created_at',
            'updated_at'
        ]


class RecommendationLogSerializer(serializers.ModelSerializer):
    """
    Serializer for recommendation logs and analytics.
    """
    recommendations = SamagriRecommendationSerializer(many=True, read_only=True)
    conversion_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = RecommendationLog
        fields = [
            'id',
            'user',
            'booking',
            'recommendations',
            'shown_count',
            'clicked_count',
            'purchased_count',
            'conversion_rate',
            'user_feedback',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'shown_count',
            'clicked_count',
            'purchased_count',
            'created_at',
            'updated_at'
        ]
    
    def get_conversion_rate(self, obj):
        """Calculate and return conversion rate as percentage"""
        rate = obj.get_conversion_rate()
        return round(rate, 2)


class RecommendationStatsSerializer(serializers.Serializer):
    """
    Serializer for recommendation statistics and analytics.
    """
    total_shown = serializers.IntegerField()
    total_purchased = serializers.IntegerField()
    accuracy_percentage = serializers.FloatField()
    recommendations_count = serializers.IntegerField()


class UserPreferenceInsightsSerializer(serializers.Serializer):
    """
    Serializer for user preference insights.
    """
    total_purchases = serializers.IntegerField()
    favorites_count = serializers.IntegerField()
    never_recommend_count = serializers.IntegerField()
    top_items = serializers.ListField(
        child=serializers.DictField()
    )