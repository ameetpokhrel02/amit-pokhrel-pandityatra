
from django.urls import path
from .views import admin_dashboard, admin_error_logs

urlpatterns = [
    path("dashboard/", admin_dashboard),
    path("error-logs/", admin_error_logs),
]
