from django.contrib import admin
from .models import Pandit, PanditWallet, PanditService

@admin.register(Pandit)
class PanditAdmin(admin.ModelAdmin):
    list_display = ('user', 'expertise', 'verification_status', 'is_verified', 'is_available')
    list_filter = ('verification_status', 'is_verified', 'is_available')
    search_fields = ('user__email', 'user__full_name')

@admin.register(PanditWallet)
class PanditWalletAdmin(admin.ModelAdmin):
    list_display = ('pandit', 'available_balance', 'total_earned')

@admin.register(PanditService)
class PanditServiceAdmin(admin.ModelAdmin):
    list_display = ('pandit', 'puja', 'custom_price', 'is_active')
    list_filter = ('is_active', 'puja')
