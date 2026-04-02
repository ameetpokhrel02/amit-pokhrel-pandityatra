from django.contrib import admin
from .models import BugReport

@admin.register(BugReport)
class BugReportAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "severity", "status", "reported_by", "created_at")
    list_filter = ("status", "severity", "category")
    search_fields = ("title", "description")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
