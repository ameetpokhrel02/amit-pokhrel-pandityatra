from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    NotificationViewSet, PushTokenView, PushVapidPublicKeyView,
    EmailTemplateViewSet, EmailLogViewSet, SendEmailAPIView
)

router = SimpleRouter()
router.register(r'email-templates', EmailTemplateViewSet, basename='email-template')
router.register(r'email-logs', EmailLogViewSet, basename='email-log')

urlpatterns = [
    path('', NotificationViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<int:pk>/', NotificationViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('', include(router.urls)),
    path('push-token/', PushTokenView.as_view(), name='push-token'),
    path('vapid-key/', PushVapidPublicKeyView.as_view(), name='vapid-key'),
    path('send-email/', SendEmailAPIView.as_view(), name='send-email'),
]
