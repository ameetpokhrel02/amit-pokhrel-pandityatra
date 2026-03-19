from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, PushTokenView, PushVapidPublicKeyView

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('push-tokens/', PushTokenView.as_view(), name='push-tokens'),
    path('push-vapid-key/', PushVapidPublicKeyView.as_view(), name='push-vapid-key'),
    path('', include(router.urls)),
]
