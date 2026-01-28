from django.contrib import admin
from .models import VideoRoom, VideoParticipant

@admin.register(VideoRoom)
class VideoRoomAdmin(admin.ModelAdmin):
	list_display = ("id", "room_name", "room_url", "status", "created_at", "booking")
	search_fields = ("room_name", "room_url", "status")
	list_filter = ("status", "created_at")

@admin.register(VideoParticipant)
class VideoParticipantAdmin(admin.ModelAdmin):
	list_display = ("id", "room", "user", "role", "is_host", "joined_at", "left_at")
	search_fields = ("user__username", "role")
	list_filter = ("role", "is_host")
