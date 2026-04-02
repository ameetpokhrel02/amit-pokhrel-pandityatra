from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import BugReport
from .serializers import BugReportSerializer, AdminBugReportUpdateSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class BugReportViewSet(viewsets.ModelViewSet):
    queryset = BugReport.objects.all()
    serializer_class = BugReportSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admins can see all, users see their own
        if self.request.user.role == "admin" or self.request.user.is_superuser:
            return BugReport.objects.all()
        return BugReport.objects.filter(reported_by=self.request.user)

    def perform_create(self, serializer):
        bug = serializer.save(reported_by=self.request.user)
        
        # Real-time Notification to Admins
        self.notify_admins(bug)

    def notify_admins(self, bug):
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "admin_notifications",
                {
                    "type": "bug_report_message",
                    "data": {
                        "id": bug.id,
                        "title": bug.title,
                        "reporter": bug.reported_by.full_name or bug.reported_by.username,
                        "severity": bug.severity,
                        "category": bug.category,
                        "created_at": str(bug.created_at),
                        "message": f"New Bug Report: {bug.title} by {bug.reported_by.full_name or bug.reported_by.username}"
                    }
                }
            )
        except Exception as e:
            print(f"Error sending websocket notification: {e}")

    @action(detail=True, methods=["patch"], permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        bug = self.get_object()
        serializer = AdminBugReportUpdateSerializer(bug, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminBugReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BugReport.objects.all()
    serializer_class = BugReportSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            return BugReport.objects.filter(status=status_filter)
        return BugReport.objects.all()
