import json
from typing import Optional

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from chat.models import ChatMessage
from .models import VideoParticipant, VideoRoom


class VideoSignalingConsumer(AsyncWebsocketConsumer):
    """
    WebRTC signaling consumer.

    WebSocket endpoint:
      /ws/video/<room_id>/

    Supports message types:
      - join
      - offer
      - answer
      - ice-candidate
      - chat
      - leave
      - heartbeat
    """

    async def connect(self):
        self.user = self.scope.get("user")
        self.room_key = self.scope["url_route"]["kwargs"].get("room_id")

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        self.room = await self._get_room(self.room_key)
        if not self.room:
            await self.close(code=4404)
            return

        has_access = await self._has_room_access(self.room.id)
        if not has_access:
            await self.close(code=4403)
            return

        self.group_name = f"video_{self.room.id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self._upsert_participant(self.room.id)

        await self.send(
            text_data=json.dumps(
                {
                    "type": "connected",
                    "room_id": str(self.room_key),
                    "resolved_room_id": self.room.id,
                    "user_id": self.user.id,
                    "username": getattr(self.user, "username", ""),
                }
            )
        )

        recent_chat = await self._get_recent_chat_messages(self.room.id)
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat-history",
                    "messages": recent_chat,
                }
            )
        )

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "signal_event",
                "event": {
                    "type": "participant-joined",
                    "user_id": self.user.id,
                    "username": getattr(self.user, "username", ""),
                },
            },
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "signal_event",
                    "event": {
                        "type": "participant-left",
                        "user_id": getattr(self.user, "id", None),
                        "username": getattr(self.user, "username", ""),
                    },
                },
            )

            await self.channel_layer.group_discard(self.group_name, self.channel_name)

        if hasattr(self, "room") and self.room and self.user and self.user.is_authenticated:
            await self._mark_participant_left(self.room.id)

    async def receive(self, text_data):
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self._send_error("Invalid JSON payload")
            return

        message_type = payload.get("type")

        if message_type not in {
            "join",
            "offer",
            "answer",
            "ice-candidate",
            "chat",
            "leave",
            "heartbeat",
        }:
            await self._send_error("Unsupported signaling type")
            return

        if message_type == "heartbeat":
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "heartbeat-ack",
                        "timestamp": timezone.now().isoformat(),
                    }
                )
            )
            return

        if message_type == "leave":
            await self.close(code=1000)
            return

        if message_type == "chat":
            content = (payload.get("message") or "").strip()
            if not content:
                await self._send_error("Chat message cannot be empty")
                return

            if len(content) > 2000:
                await self._send_error("Chat message too long")
                return

            chat_payload = await self._persist_chat_message(self.room.id, content)

            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "signal_event",
                    "event": {
                        "type": "chat",
                        **chat_payload,
                    },
                },
            )
            return

        event = {
            "type": message_type,
            "user_id": self.user.id,
            "username": getattr(self.user, "username", ""),
            "target_user_id": payload.get("target_user_id"),
            "sdp": payload.get("sdp"),
            "candidate": payload.get("candidate"),
            "message": payload.get("message"),
            "timestamp": timezone.now().isoformat(),
        }

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "signal_event",
                "event": event,
            },
        )

    async def signal_event(self, event):
        await self.send(text_data=json.dumps(event["event"]))

    async def _send_error(self, message: str):
        await self.send(text_data=json.dumps({"type": "error", "message": message}))

    @database_sync_to_async
    def _get_room(self, room_key: str) -> Optional[VideoRoom]:
        """
        Resolve room by numeric PK or room_name slug.
        """
        room = None
        if str(room_key).isdigit():
            room = VideoRoom.objects.select_related("booking", "booking__pandit", "booking__user").filter(
                id=int(room_key)
            ).first()

        if room is None:
            room = VideoRoom.objects.select_related("booking", "booking__pandit", "booking__user").filter(
                room_name=room_key
            ).first()

        return room

    @database_sync_to_async
    def _has_room_access(self, room_id: int) -> bool:
        room = VideoRoom.objects.select_related("booking", "booking__pandit", "booking__user").filter(
            id=room_id
        ).first()
        if not room:
            return False

        booking = room.booking
        is_customer = booking.user_id == self.user.id
        is_pandit = booking.pandit and booking.pandit.user_id == self.user.id
        is_admin = bool(self.user.is_staff or self.user.is_superuser)

        return bool(is_customer or is_pandit or is_admin)

    @database_sync_to_async
    def _upsert_participant(self, room_id: int):
        room = VideoRoom.objects.select_related("booking", "booking__pandit").get(id=room_id)

        role = "customer"
        is_host = False
        if room.booking.pandit and room.booking.pandit.user_id == self.user.id:
            role = "pandit"
            is_host = True

        participant, _ = VideoParticipant.objects.get_or_create(
            room=room,
            user=self.user,
            defaults={"role": role, "is_host": is_host},
        )

        participant.left_at = None
        participant.save(update_fields=["left_at"])

    @database_sync_to_async
    def _mark_participant_left(self, room_id: int):
        VideoParticipant.objects.filter(room_id=room_id, user=self.user, left_at__isnull=True).update(
            left_at=timezone.now()
        )

    @database_sync_to_async
    def _persist_chat_message(self, room_id: int, content: str):
        room = VideoRoom.objects.select_related("booking", "booking__pandit").get(id=room_id)

        sender_role = "user"
        pandit = None
        if room.booking.pandit and room.booking.pandit.user_id == self.user.id:
            sender_role = "pandit"
            pandit = room.booking.pandit

        chat = ChatMessage.objects.create(
            user=self.user,
            mode="interaction",
            sender=sender_role,
            content=content,
            booking=room.booking,
            pandit=pandit,
            timestamp=timezone.now(),
        )

        return {
            "chat_id": chat.id,
            "message": chat.content,
            "user_id": self.user.id,
            "username": getattr(self.user, "username", ""),
            "sender": chat.sender,
            "booking_id": room.booking_id,
            "timestamp": chat.timestamp.isoformat(),
        }

    @database_sync_to_async
    def _get_recent_chat_messages(self, room_id: int):
        room = VideoRoom.objects.select_related("booking").get(id=room_id)

        qs = ChatMessage.objects.filter(
            mode="interaction",
            booking_id=room.booking_id,
        ).select_related("user").order_by("-timestamp")[:50]

        messages = []
        for msg in reversed(qs):
            messages.append(
                {
                    "chat_id": msg.id,
                    "message": msg.content,
                    "user_id": msg.user_id,
                    "username": msg.user.username if msg.user else "unknown",
                    "sender": msg.sender,
                    "booking_id": room.booking_id,
                    "timestamp": msg.timestamp.isoformat(),
                }
            )

        return messages
