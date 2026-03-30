from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Sum, Count
from django.utils import timezone
from .models import VendorProfile, VendorPayout
from samagri.models import SamagriItem, ShopOrderItem, ShopOrder
from samagri.serializers import SamagriItemSerializer
from .serializers import VendorProfileSerializer, VendorRegisterSerializer, VendorPayoutSerializer, VendorOrderSerializer
from django.shortcuts import get_object_or_404

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def ping_vendors(request):
    return Response({"message": "Vendors API is alive"})

# ---------------------------
# ADMIN: List pending
# ---------------------------
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_pending_vendors(request):
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    vendors = VendorProfile.objects.filter(is_verified=False)
    serializer = VendorProfileSerializer(vendors, many=True)
    return Response(serializer.data)


# ---------------------------
# ADMIN: All Vendors
# ---------------------------
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_all_vendors(request):
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    vendors = VendorProfile.objects.all().order_by('-created_at')
    total_count = vendors.count()
    verified_count = vendors.filter(is_verified=True).count()
    pending_count = vendors.filter(is_verified=False).count()
    
    serializer = VendorProfileSerializer(vendors, many=True)
    
    return Response({
        "vendors": serializer.data,
        "stats": {
            "total": total_count,
            "verified": verified_count,
            "pending": pending_count,
        }
    })


# ---------------------------
# ADMIN: Approve
# ---------------------------
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_vendor(request, vendor_id):
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    vendor = get_object_or_404(VendorProfile, id=vendor_id)

    vendor.is_verified = True
    # In a real world, we might log who verified it
    vendor.save()

    return Response({
        "detail": f"{vendor.shop_name} approved",
        "vendor": VendorProfileSerializer(vendor).data
    })


# ---------------------------
# ADMIN: Reject
# ---------------------------
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_vendor(request, vendor_id):
    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
        return Response({"detail": "Admin only"}, status=403)

    vendor = get_object_or_404(VendorProfile, id=vendor_id)

    # For now, we just keep is_verified=False and maybe add a field for rejection reason if needed
    # But for simplicity, we'll just return a response
    reason = request.data.get("reason", "Incomplete documentation")
    
    return Response({
        "detail": f"{vendor.shop_name} rejected. Reason: {reason}",
        "vendor": VendorProfileSerializer(vendor).data
    })


# ---------------------------
# VIEWS
# ---------------------------

class VendorRegisterView(generics.CreateAPIView):
    queryset = VendorProfile.objects.all()
    serializer_class = VendorRegisterSerializer
    permission_classes = [permissions.AllowAny]

class VendorProfileViewSet(viewsets.ModelViewSet):
    queryset = VendorProfile.objects.all()
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return VendorProfile.objects.none()
        if user.role == 'vendor':
            return VendorProfile.objects.filter(user=user)
        # Admin or support staff can see all
        if user.role in ('admin', 'superadmin') or user.is_staff:
            return VendorProfile.objects.all()
        return VendorProfile.objects.none()

    @action(detail=True, methods=['POST'])
    def toggle_status(self, request, pk=None):
        """Toggle user is_active status (Block/Unblock)"""
        if not (request.user.is_staff or getattr(request.user, 'role', '') in ('admin', 'superadmin')):
            return Response({"detail": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
            
        vendor = self.get_object()
        user = vendor.user
        user.is_active = not user.is_active
        user.save()
        
        status_str = "activated" if user.is_active else "deactivated"
        return Response({
            "detail": f"Vendor account {status_str}",
            "is_active": user.is_active
        })

    @action(detail=False, methods=['GET'])
    def stats(self, request):
        if request.user.role != 'vendor':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            vendor = request.user.vendor_profile
        except (AttributeError, VendorProfile.DoesNotExist):
            return Response({"detail": "Profile incomplete. Please complete your registration."}, status=status.HTTP_404_NOT_FOUND)
        
        # Sales Stats
        total_sales = ShopOrderItem.objects.filter(vendor=vendor, order__status='PAID').aggregate(Sum('price_at_purchase'))['price_at_purchase__sum'] or 0
        total_orders = ShopOrderItem.objects.filter(vendor=vendor, order__status='PAID').values('order').distinct().count()
        
        # Product Stats
        total_products = SamagriItem.objects.filter(vendor=vendor).count()
        low_stock_products = SamagriItem.objects.filter(vendor=vendor, stock_quantity__lte=5).count()
        
        # Payout Stats
        total_withdrawn = VendorPayout.objects.filter(vendor=vendor, status='PAID').aggregate(Sum('amount'))['amount__sum'] or 0
        
        return Response({
            "total_revenue": total_sales,
            "total_orders": total_orders,
            "total_products": total_products,
            "low_stock_count": low_stock_products,
            "current_balance": vendor.balance,
            "total_withdrawn": total_withdrawn,
            "is_verified": vendor.is_verified,
            "verification_status": vendor.verification_status
        })

class VendorProductViewSet(viewsets.ModelViewSet):
    serializer_class = SamagriItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'vendor':
            try:
                return SamagriItem.objects.filter(vendor=user.vendor_profile)
            except (AttributeError, VendorProfile.DoesNotExist):
                return SamagriItem.objects.none()
        return SamagriItem.objects.all()

    def perform_create(self, serializer):
        # Auto-assign the vendor to the product
        vendor = self.request.user.vendor_profile
        serializer.save(vendor=vendor, is_approved=False)

class VendorOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VendorOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'vendor':
            try:
                vendor = user.vendor_profile
                # Only orders that contain at least one item from this vendor
                return ShopOrder.objects.filter(items__vendor=vendor).distinct()
            except (AttributeError, VendorProfile.DoesNotExist):
                return ShopOrder.objects.none()
        return ShopOrder.objects.all()

    @action(detail=True, methods=['POST'])
    def update_status(self, request, pk=None):
        # In a real multi-vendor setup, each vendor might have their own status for their portion of the order
        # For simplicity, we'll allow the vendor to mark their items as 'shipped' which can update the overall order status if needed
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['SHIPPED', 'DELIVERED']:
            order.status = new_status
            order.save()
            return Response({"status": "updated"})
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

class VendorPayoutViewSet(viewsets.ModelViewSet):
    serializer_class = VendorPayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'vendor':
            try:
                return VendorPayout.objects.filter(vendor=user.vendor_profile)
            except (AttributeError, VendorProfile.DoesNotExist):
                return VendorPayout.objects.none()
        return VendorPayout.objects.all()

    def perform_create(self, serializer):
        vendor = self.request.user.vendor_profile
        serializer.save(vendor=vendor)
