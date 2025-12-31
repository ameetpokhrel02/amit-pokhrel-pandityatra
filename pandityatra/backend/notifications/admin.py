from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Notification', {
            'fields': ('notification_type', 'title', 'title_ne', 'message', 'message_ne')
        }),
        ('Related', {
            'fields': ('booking',)
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Timezone', {
            'fields': ('user_timezone', 'created_at')
        }),
    )
