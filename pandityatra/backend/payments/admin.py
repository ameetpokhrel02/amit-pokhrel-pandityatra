from django.contrib import admin
from .models import Payment, PaymentWebhook


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'transaction_id', 'user', 'amount', 'currency', 'payment_method', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['transaction_id', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'completed_at', 'refunded_at']
    
    fieldsets = (
        ('User & Booking', {
            'fields': ('user', 'booking')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'amount', 'currency', 'transaction_id')
        }),
        ('Status', {
            'fields': ('status', 'gateway_response')
        }),
        ('Refund', {
            'fields': ('refund_amount', 'refund_reason', 'refunded_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )


@admin.register(PaymentWebhook)
class PaymentWebhookAdmin(admin.ModelAdmin):
    list_display = ['id', 'payment_method', 'processed', 'created_at']
    list_filter = ['payment_method', 'processed', 'created_at']
    readonly_fields = ['created_at']
