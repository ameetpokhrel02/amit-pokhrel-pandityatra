from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'pandit', 'rating', 'created_at', 'is_verified']
    list_filter = ['rating', 'is_verified', 'created_at']
    search_fields = ['customer__username', 'pandit__user__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Booking Info', {
            'fields': ('booking', 'pandit', 'customer')
        }),
        ('Rating', {
            'fields': ('rating', 'professionalism', 'knowledge', 'punctuality')
        }),
        ('Comment', {
            'fields': ('comment', 'comment_ne')
        }),
        ('Verification', {
            'fields': ('is_verified',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
