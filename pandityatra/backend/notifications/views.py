from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from django.conf import settings
from .models import Notification, PushNotificationToken, EmailTemplate, EmailNotification
from .serializers import (
    NotificationSerializer, PushTokenSerializer,
    EmailTemplateSerializer, EmailNotificationSerializer, SendEmailSerializer
)

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
    serializer_class = PushTokenSerializer

    @extend_schema(summary="Get Push Tokens")
    def get(self, request):
        tokens = PushNotificationToken.objects.filter(user=request.user, is_active=True)
        serializer = PushTokenSerializer(tokens, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(summary="Register Push Token")
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

    @extend_schema(summary="Get VAPID Public Key")
    def get(self, request):
        return Response(
            {'vapid_public_key': getattr(settings, 'VAPID_PUBLIC_KEY', '')},
            status=status.HTTP_200_OK
        )


class EmailTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admin sees all, Others see nothing or specific public templates
        if self.request.user.role == 'admin' or self.request.user.is_superuser:
            return EmailTemplate.objects.all()
        return EmailTemplate.objects.filter(template_type__in=['BOOKING_CONFIRMATION', 'PUJA_REMINDER'])


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EmailNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin' or self.request.user.is_superuser:
            return EmailNotification.objects.all()
        return EmailNotification.objects.filter(sender=self.request.user)


class SendEmailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Send Role-Based Email")
    def post(self, request):
        serializer = SendEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        role = user.role
        
        # Role-based validation
        if role == 'user':
            return Response({'detail': 'Users are not authorized to send emails.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check permissions
        if data.get('bulk') and role != 'admin' and not user.is_superuser:
            return Response({'detail': 'Only admins can send bulk emails.'}, status=status.HTTP_403_FORBIDDEN)

        # Implementation of sending logic
        template = None
        if data.get('template_id'):
            template = EmailTemplate.objects.filter(id=data['template_id']).first()

        from .tasks import send_email_task
        
        if data.get('bulk'):
            # Bulk logic for admin
            from users.models import User as AppUser
            target_roles = data.get('target_roles', ['user'])
            recipients = AppUser.objects.filter(role__in=target_roles, is_active=True)
            
            for recipient in recipients:
                notif = EmailNotification.objects.create(
                    sender=user,
                    sender_role='ADMIN',
                    recipient_email=recipient.email,
                    recipient_user=recipient,
                    template=template,
                    subject=data['subject'],
                    message=data.get('content'),
                    status='PENDING'
                )
                send_email_task.delay(notif.id)
            
            return Response({'detail': f'Bulk email queued for {recipients.count()} recipients.'})
        
        else:
            # Single email logic
            # Verify if vendor/pandit can send to this recipient
            # (In production, you'd check booking/order relations here)
            
            notif = EmailNotification.objects.create(
                sender=user,
                sender_role=role.upper(),
                recipient_email=data['recipient_email'],
                template=template,
                subject=data['subject'],
                message=data.get('content'),
                status='PENDING'
            )
            send_email_task.delay(notif.id)
            
            return Response({'detail': 'Email queued successfully.'})
