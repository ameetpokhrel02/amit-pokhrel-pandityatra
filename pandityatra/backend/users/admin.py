from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model"""
    list_display = ('username', 'full_name', 'phone_number', 'email', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'full_name', 'phone_number', 'email')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Information', {
            'fields': ('full_name', 'phone_number', 'profile_pic', 'role')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Information', {
            'fields': ('full_name', 'phone_number', 'email', 'role')
        }),
    )

from .models import ContactMessage
@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at', 'is_resolved')
    list_filter = ('is_resolved', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')

from .models import SiteContent
@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at', 'updated_by')
    list_filter = ('key',)
    search_fields = ('key', 'value')
    readonly_fields = ('updated_at',)
