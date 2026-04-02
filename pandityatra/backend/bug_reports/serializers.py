from rest_framework import serializers
from .models import BugReport
from users.serializers import UserSerializer

class BugReportSerializer(serializers.ModelSerializer):
    reported_by_detail = UserSerializer(source="reported_by", read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = BugReport
        fields = [
            "id", "title", "description", "category", "severity", 
            "attachment", "attachment_url", "status", "reported_by", 
            "reported_by_detail", "admin_comment", "created_at", "updated_at"
        ]
        read_only_fields = ["reported_by", "status", "admin_comment", "created_at", "updated_at"]

    def get_attachment_url(self, obj):
        if obj.attachment:
            return obj.attachment.url
        return None

class AdminBugReportUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BugReport
        fields = ["status", "admin_comment"]
