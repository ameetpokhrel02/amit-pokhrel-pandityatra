from rest_framework import serializers
from .models import Banner
from users.serializers import UserSerializer

class BannerSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Banner
        fields = [
            "id", "title", "description", "image_url", "mobile_image_url",
            "link_url", "link_text", "banner_type", "status", "priority_order",
            "background_color", "text_color", "start_date", "end_date",
            "view_count", "click_count", "created_by", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "view_count", "click_count", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["updated_by"] = request.user
        return super().update(instance, validated_data)
