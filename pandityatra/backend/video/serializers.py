from rest_framework import serializers

from .models import VideoParticipant, VideoRoom


class VideoParticipantSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = VideoParticipant
        fields = [
            "user_id",
            "username",
            "role",
            "is_host",
            "joined_at",
            "left_at",
        ]


class VideoRoomDetailSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source="booking.id", read_only=True)
    room_id = serializers.CharField(source="room_name", read_only=True)
    participants = VideoParticipantSerializer(many=True, read_only=True)
    start_time = serializers.SerializerMethodField()

    class Meta:
        model = VideoRoom
        fields = [
            "room_id",
            "booking_id",
            "room_url",
            "status",
            "provider",
            "start_time",
            "created_at",
            "ended_at",
            "recording_url",
            "participants",
        ]

    def get_start_time(self, obj):
        booking_start_time = self.context.get("booking_start_time")
        if not booking_start_time:
            return None
        dt = serializers.DateTimeField()
        return dt.to_representation(booking_start_time)


class VideoRoomUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoRoom
        fields = ["status", "recording_url", "ended_at"]


class VideoHistorySerializer(serializers.ModelSerializer):
    puja_name = serializers.CharField(source="booking.service_name", read_only=True)
    date = serializers.DateField(source="booking.booking_date", read_only=True)
    start_time = serializers.TimeField(source="booking.booking_time", read_only=True)
    partner_name = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()
    status = serializers.CharField(source="booking.status", read_only=True)

    class Meta:
        model = VideoRoom
        fields = [
            "id",
            "booking_id",
            "puja_name",
            "date",
            "start_time",
            "partner_name",
            "duration_seconds",
            "status",
            "recording_url",
            "created_at",
            "ended_at",
        ]

    def get_partner_name(self, obj):
        user = self.context.get("request").user
        booking = obj.booking
        if user.role == "pandit":
            return booking.user.full_name
        return booking.pandit.full_name if booking.pandit else "Pandit"

    def get_duration_seconds(self, obj):
        if obj.created_at and obj.ended_at:
            delta = obj.ended_at - obj.created_at
            return int(delta.total_seconds())
        return None
