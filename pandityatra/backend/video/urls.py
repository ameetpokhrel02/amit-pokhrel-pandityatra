from django.urls import path
from . import views

urlpatterns = [
    # ICE config for frontend WebRTC clients
    path("ice-servers/", views.ice_servers),
    path("history/", views.video_history),

    # Step 2 - WebRTC room REST APIs
    path("rooms/create/", views.create_room_auto),
    path("rooms/<str:room_id>/", views.room_details),
    path("rooms/<str:room_id>/upload-recording/", views.upload_recording),
    path("rooms/<str:room_id>/upload-recording-chunk/", views.upload_recording_chunk),
    path("rooms/<str:room_id>/finalize-recording/", views.finalize_recording_upload),
    path("rooms/<str:room_id>/start/", views.start_room),
    path("rooms/<str:room_id>/end/", views.end_room),
    path("<str:room_id>/validate/", views.validate_room_access),

    # Legacy/Daily endpoints kept for backward compatibility
    path("room/<int:booking_id>/", views.get_video_room),
    path("create-token/", views.create_video_token),
    path("generate-link/<int:booking_id>/", views.generate_video_link),
    path("webhook/", views.daily_webhook),
    path("room/<int:booking_id>/join/", views.join_room),
]