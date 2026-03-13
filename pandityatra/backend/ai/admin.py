from django.contrib import admin
from .models import AIQueryLog


@admin.register(AIQueryLog)
class AIQueryLogAdmin(admin.ModelAdmin):
	list_display = ("id", "trace_id", "user", "response_type", "latency_ms", "created_at")
	list_filter = ("response_type", "created_at")
	search_fields = ("trace_id", "user_message", "ai_reply", "error")
	readonly_fields = (
		"trace_id",
		"user",
		"mode",
		"user_message",
		"ai_reply",
		"response_type",
		"tool_log",
		"error",
		"latency_ms",
		"created_at",
	)
