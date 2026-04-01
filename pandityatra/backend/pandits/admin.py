from django.contrib import admin
from .models import PanditUser, PanditWallet, PanditService

@admin.register(PanditUser)
class PanditAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'expertise', 'verification_status', 'is_verified', 'is_available')
    list_filter = ('verification_status', 'is_verified', 'is_available')
    search_fields = ('email', 'full_name')

@admin.register(PanditWallet)
class PanditWalletAdmin(admin.ModelAdmin):
    list_display = ('pandit', 'available_balance', 'total_earned')

@admin.register(PanditService)
class PanditServiceAdmin(admin.ModelAdmin):
    list_display = ('pandit', 'puja', 'custom_price', 'is_active')
    list_filter = ('is_active', 'puja')
