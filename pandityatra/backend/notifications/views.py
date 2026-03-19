from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
from .models import Notification, PushNotificationToken
from .serializers import NotificationSerializer, PushTokenSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(
            is_read=True, 
            read_at=timezone.now()
        )
        return Response({'status': 'all notifications marked as read'}, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        if request.data.get('is_read') is True:
            instance = self.get_object()
            if not instance.is_read:
                instance.read_at = timezone.now()
                instance.save()
        return super().partial_update(request, *args, **kwargs)


class PushTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tokens = PushNotificationToken.objects.filter(user=request.user, is_active=True)
        serializer = PushTokenSerializer(tokens, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PushTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        token = data.get('token')
        defaults = {
            'device_type': data.get('device_type', 'web'),
            'endpoint': data.get('endpoint'),
            'subscription': data.get('subscription'),
            'is_active': True,
        }

        obj, _ = PushNotificationToken.objects.update_or_create(
            user=request.user,
            token=token,
            defaults=defaults
        )

        return Response(PushTokenSerializer(obj).data, status=status.HTTP_200_OK)

    def delete(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)

        updated = PushNotificationToken.objects.filter(
            user=request.user,
            token=token,
            is_active=True
        ).update(is_active=False)

        return Response({'deactivated': updated}, status=status.HTTP_200_OK)


class PushVapidPublicKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {'vapid_public_key': getattr(settings, 'VAPID_PUBLIC_KEY', '')},
            status=status.HTTP_200_OK
        )
