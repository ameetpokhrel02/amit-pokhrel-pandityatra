from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BugReportViewSet, AdminBugReportViewSet

router = DefaultRouter()
router.register(r"reports", BugReportViewSet, basename="bug-report")
router.register(r"admin/reports", AdminBugReportViewSet, basename="admin-bug-report")

urlpatterns = [
    path("", include(router.urls)),
]
