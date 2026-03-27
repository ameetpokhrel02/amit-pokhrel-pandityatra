from rest_framework import serializers
from .models import Puja, PujaCategory
from payments.utils import convert_npr_to_usd

class PujaCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PujaCategory
        fields = ('id', 'name', 'slug', 'description', 'image', 'icon', 'order')

class PujaSerializer(serializers.ModelSerializer):
    category_details = PujaCategorySerializer(source='category', read_only=True)
    
    class Meta:
        model = Puja
        fields = (
            'id',
            'name',
            'category',
            'category_details',
            'description', 
            'base_duration_minutes', 
            'base_price', 
            'base_price_usd',
            'is_available',
            'image'
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # If base_price_usd is not set or 0.00, calculate it on the fly
        if not data.get('base_price_usd') or float(data.get('base_price_usd')) == 0:
            data['base_price_usd'] = convert_npr_to_usd(instance.base_price)
        return data
