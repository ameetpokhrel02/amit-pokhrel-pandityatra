from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Sum, Count
from django.utils import timezone
from .models import Vendor, VendorPayout
from samagri.models import SamagriItem, ShopOrderItem, ShopOrder
from samagri.serializers import SamagriItemSerializer
from .serializers import VendorProfileSerializer, VendorRegisterSerializer, VendorPayoutSerializer, VendorOrderSerializer
# Note: VendorProfileSerializer was updated to work with Vendor model
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

    vendors = Vendor.objects.filter(is_verified=False)
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

    vendors = Vendor.objects.all().order_by('-created_at')
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

    vendor = get_object_or_404(Vendor, id=vendor_id)

    vendor.is_verified = True
    vendor.verification_status = 'APPROVED'
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

    vendor = get_object_or_404(Vendor, id=vendor_id)
    vendor.verification_status = 'REJECTED'
    vendor.is_verified = False
    vendor.save()

    reason = request.data.get("reason", "Incomplete documentation")
    
    return Response({
        "detail": f"{vendor.shop_name} rejected. Reason: {reason}",
        "vendor": VendorProfileSerializer(vendor).data
    })


# ---------------------------
# VIEWS
# ---------------------------

class VendorRegisterView(generics.CreateAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorRegisterSerializer
    permission_classes = [permissions.AllowAny]

class VendorProfileViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Vendor.objects.none()
        if user.role == 'vendor' or hasattr(user, 'vendor'):
            return Vendor.objects.filter(id=user.id)
        # Admin or support staff can see all
        if user.role in ('admin', 'superadmin') or user.is_staff:
            return Vendor.objects.all()
        return Vendor.objects.none()

    @action(detail=True, methods=['POST'])
    def toggle_status(self, request, pk=None):
        """Toggle user is_active status (Block/Unblock)"""
        if not (request.user.is_staff or getattr(request.user, 'role', '') in ('admin', 'superadmin')):
            return Response({"detail": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
            
        vendor = self.get_object()
        vendor.is_active = not vendor.is_active
        vendor.save()
        
        status_str = "activated" if vendor.is_active else "deactivated"
        return Response({
            "detail": f"Vendor account {status_str}",
            "is_active": vendor.is_active
        })

    @action(detail=False, methods=['GET'])
    def stats(self, request):
        user = request.user
        if not hasattr(user, 'vendor'):
            return Response({"detail": "No vendor account found."}, status=status.HTTP_404_NOT_FOUND)
        
        vendor = user.vendor
        
        # Sales Stats
        total_sales = ShopOrderItem.objects.filter(vendor=vendor, order__status='PAID').aggregate(Sum('price_at_purchase'))['price_at_purchase__sum'] or 0
        total_orders = ShopOrderItem.objects.filter(vendor=vendor, order__status='PAID').values('order').distinct().count()
        
        # Product Stats
        total_products = SamagriItem.objects.filter(vendor=vendor).count()
        low_stock_products = SamagriItem.objects.filter(vendor=vendor, stock_quantity__lte=5).count()
        
        # Payout Stats
        total_withdrawn = VendorPayout.objects.filter(vendor=vendor, status='PAID').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Low stock item details for display
        low_stock_items_qs = SamagriItem.objects.filter(vendor=vendor, stock_quantity__lte=5)
        low_stock_items = []
        for item in low_stock_items_qs:
            image_url = None
            if item.image:
                try:
                    request_obj = request
                    image_url = request_obj.build_absolute_uri(item.image.url)
                except Exception:
                    image_url = str(item.image)
            low_stock_items.append({
                "id": item.id,
                "name": item.name,
                "stock_quantity": item.stock_quantity,
                "image": image_url
            })

        return Response({
            "total_revenue": total_sales,
            "total_orders": total_orders,
            "total_products": total_products,
            "low_stock_count": low_stock_products,
            "low_stock_items": low_stock_items,
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
        if hasattr(user, 'vendor'):
            return SamagriItem.objects.filter(vendor=user.vendor)
        elif user.role in ('admin', 'superadmin') or user.is_staff:
            return SamagriItem.objects.all()
        return SamagriItem.objects.none()

    def perform_create(self, serializer):
        # Auto-assign the vendor to the product
        if hasattr(self.request.user, 'vendor'):
            vendor = self.request.user.vendor
            serializer.save(vendor=vendor, is_approved=False)
        else:
            # Maybe it's an admin adding a product
            serializer.save(is_approved=True)

class VendorOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VendorOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'vendor'):
            vendor = user.vendor
            # Only orders that contain at least one item from this vendor
            return ShopOrder.objects.filter(items__vendor=vendor).distinct()
        elif user.role in ('admin', 'superadmin') or user.is_staff:
            return ShopOrder.objects.all()
        return ShopOrder.objects.none()

    @action(detail=True, methods=['POST'])
    def update_status(self, request, pk=None):
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
        if hasattr(user, 'vendor'):
            return VendorPayout.objects.filter(vendor=user.vendor)
        elif user.role in ('admin', 'superadmin') or user.is_staff:
            return VendorPayout.objects.all()
        return VendorPayout.objects.none()

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'vendor'):
            vendor = self.request.user.vendor
            serializer.save(vendor=vendor)
        else:
            raise serializers.ValidationError("Only vendors can request payouts")
