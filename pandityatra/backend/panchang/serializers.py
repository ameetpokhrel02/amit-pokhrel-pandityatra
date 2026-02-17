from rest_framework import serializers
from .models import PanchangData

class PanchangSerializer(serializers.ModelSerializer):
    class Meta:
        model = PanchangData
        fields = '__all__'
