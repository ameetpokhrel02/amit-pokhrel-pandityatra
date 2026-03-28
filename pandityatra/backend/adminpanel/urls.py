from django.urls import path
from .views import admin_dashboard, admin_error_logs, admin_activity_logs, admin_analytics_deep

urlpatterns = [
    path("dashboard/", admin_dashboard),
    path("error-logs/", admin_error_logs),
    path("activity-logs/", admin_activity_logs),
    path("analytics/deep/", admin_analytics_deep),
]
