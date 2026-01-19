from django.contrib import admin
from .models import Booking, BookingStatus

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_link', 'pandit_link', 'service_name', 'booking_date', 'status', 'total_fee')
    list_filter = ('status', 'booking_date', 'payment_status')
    search_fields = ('user__full_name', 'pandit__user__full_name', 'id')
    readonly_fields = ('created_at',)
    actions = ['cancel_booking']

    def user_link(self, obj):
        return obj.user.full_name
    user_link.short_description = 'User'

    def pandit_link(self, obj):
        return obj.pandit.user.full_name
    pandit_link.short_description = 'Pandit'

    @admin.action(description='Cancel Selected Bookings & Initiate Refund')
    def cancel_booking(self, request, queryset):
        # This is a simplified action. In prod, you'd trigger the refund logic here.
        updated = queryset.update(status=BookingStatus.CANCELLED)
        self.message_user(request, f"{updated} bookings marked as CANCELLED.")
