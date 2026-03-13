from django.db import models
from django.conf import settings


class AIQueryLog(models.Model):
	"""Audit log for AI guide requests and MCP tool execution."""

	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="ai_query_logs",
	)
	trace_id = models.CharField(max_length=64, db_index=True)
	mode = models.CharField(max_length=20, default="guide")
	user_message = models.TextField()
	ai_reply = models.TextField(blank=True, default="")
	response_type = models.CharField(max_length=50, default="text")
	tool_log = models.JSONField(default=list, blank=True)
	error = models.TextField(blank=True, default="")
	latency_ms = models.IntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"AIQueryLog(trace={self.trace_id}, user={self.user_id}, type={self.response_type})"
