from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Banner
from .serializers import BannerSerializer

class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve", "active_banners"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=["get"])
    def active_banners(self, request):
        now = timezone.now()
        banners = Banner.objects.filter(
            status="ACTIVE"
        ).order_by("priority_order", "-created_at")
        
        # Filter by date if set
        banners = banners.filter(
            (Q(start_date__isnull=True) | Q(start_date__lte=now)) &
            (Q(end_date__isnull=True) | Q(end_date__gte=now))
        )
        
        serializer = self.get_serializer(banners, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def track_view(self, request, pk=None):
        banner = self.get_object()
        banner.view_count += 1
        banner.save()
        return Response({"status": "view tracked"})

    @action(detail=True, methods=["post"])
    def track_click(self, request, pk=None):
        banner = self.get_object()
        banner.click_count += 1
        banner.save()
        return Response({"status": "click tracked"})
