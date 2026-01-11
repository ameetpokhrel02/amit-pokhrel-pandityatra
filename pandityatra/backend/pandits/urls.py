from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterPanditView, list_pending_pandits, verify_pandit, reject_pandit, 
    request_withdrawal, get_pandit_wallet, get_pandit_withdrawals,
    PanditServiceViewSet, PujaCatalogView,
    pandit_dashboard_stats, toggle_availability
)
from .admin_views import approve_withdrawal, list_withdrawals, admin_pandit_earnings

router = DefaultRouter()
router.register(r'my-services', PanditServiceViewSet, basename='pandit-services')

urlpatterns = [
    # Router for services management
    path('', include(router.urls)),

    # Dashboard Stats
    path('dashboard/stats/', pandit_dashboard_stats),
    path('dashboard/toggle-availability/', toggle_availability),
    
    # Info / Catalog
    path('services/catalog/', PujaCatalogView.as_view(), name='puja-catalog'),

    # Pandit Public/User
    path("register/", RegisterPanditView.as_view()),
    # Pandit Financials
    path("wallet/", get_pandit_wallet),
    path("withdrawals/", get_pandit_withdrawals),
    path("withdrawal/request/", request_withdrawal),

    # Admin
    path("admin/pending/", list_pending_pandits),
    path("admin/verify/<int:pandit_id>/", verify_pandit),
    path("admin/reject/<int:pandit_id>/", reject_pandit),
    path("admin/withdrawals/", list_withdrawals),
    path("admin/withdrawals/<int:withdrawal_id>/approve/", approve_withdrawal),
    path("admin/earnings/<int:pandit_id>/", admin_pandit_earnings),
]
