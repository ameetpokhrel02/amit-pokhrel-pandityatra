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

from .models import PanditWithdrawal

@admin.register(PanditWithdrawal)
class PanditWithdrawalAdmin(admin.ModelAdmin):
    list_display = ('pandit', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    actions = ['approve_withdrawal', 'reject_withdrawal']

    @admin.action(description='Approve Withdrawal')
    def approve_withdrawal(self, request, queryset):
        # Add logic to actually process bank transfer here (manual or auto)
        queryset.update(status='APPROVED')
        self.message_user(request, "Withdrawals approved.")

    @admin.action(description='Reject Withdrawal')
    def reject_withdrawal(self, request, queryset):
        queryset.update(status='REJECTED')
        # Logic to refund money back to wallet would go here
        self.message_user(request, "Withdrawals rejected.")
