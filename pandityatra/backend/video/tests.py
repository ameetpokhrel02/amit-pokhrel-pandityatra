import asyncio
from datetime import timedelta
from unittest.mock import patch

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.core.management import call_command
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from bookings.models import Booking
from pandits.models import Pandit
from services.models import Puja, PujaCategory
from users.models import User
from video.models import VideoRoom
from video.services.room_creator import ensure_video_room_for_booking


class VideoTestDataMixin:
    def create_user(self, username: str, role: str = "user"):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="Pass@12345",
            full_name=username.title(),
            role=role,
        )

    def create_pandit(self, username: str = "pandit"):
        pandit_user = self.create_user(username=username, role="pandit")
        pandit = Pandit.objects.create(
            user=pandit_user,
            expertise="Vedic Puja",
            language="Nepali",
            experience_years=5,
            is_verified=True,
            verification_status="APPROVED",
        )
        return pandit_user, pandit

    def create_booking(self, user, pandit, *, status="ACCEPTED", payment_status=True, when_minutes=5):
        start = timezone.localtime(timezone.now()) + timedelta(minutes=when_minutes)
        category = PujaCategory.objects.create(
            name=f"Test Category {timezone.now().timestamp()}",
            slug=f"test-category-{int(timezone.now().timestamp() * 1000)}",
        )
        service = Puja.objects.create(
            name=f"Test Puja {timezone.now().timestamp()}",
            description="Test service",
            base_price=1000,
            base_duration_minutes=60,
            category=category,
        )

        return Booking.objects.create(
            user=user,
            pandit=pandit,
            service=service,
            service_name=service.name,
            service_location="ONLINE",
            booking_date=start.date(),
            booking_time=start.time().replace(second=0, microsecond=0),
            status=status,
            payment_status=payment_status,
            total_fee=1000,
        )


class VideoApiTests(VideoTestDataMixin, TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = self.create_user("customer", role="user")
        self.pandit_user, self.pandit = self.create_pandit("pandit_main")
        self.other_user = self.create_user("intruder", role="user")
        self.booking = self.create_booking(self.customer, self.pandit)

    def test_create_room_and_get_room_details(self):
        self.client.force_authenticate(self.customer)

        create_resp = self.client.post(
            "/api/video/rooms/create/",
            {"booking_id": self.booking.id},
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        self.assertIn("room_id", create_resp.data)

        room_id = create_resp.data["room_id"]
        detail_resp = self.client.get(f"/api/video/rooms/{room_id}/")
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.data["booking_id"], self.booking.id)

    def test_room_access_denied_for_non_participant(self):
        room = ensure_video_room_for_booking(self.booking)
        self.client.force_authenticate(self.other_user)

        resp = self.client.get(f"/api/video/rooms/{room.room_name}/")
        self.assertEqual(resp.status_code, 403)

    def test_patch_start_end_and_validate(self):
        room = ensure_video_room_for_booking(self.booking)
        self.client.force_authenticate(self.customer)

        patch_resp = self.client.patch(
            f"/api/video/rooms/{room.room_name}/",
            {"status": "live"},
            format="json",
        )
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.data["status"], "live")

        start_resp = self.client.post(f"/api/video/rooms/{room.room_name}/start/")
        self.assertEqual(start_resp.status_code, 200)

        validate_resp = self.client.get(f"/api/video/{room.room_name}/validate/")
        self.assertEqual(validate_resp.status_code, 200)
        self.assertTrue(validate_resp.data["valid"])

        end_resp = self.client.post(f"/api/video/rooms/{room.room_name}/end/")
        self.assertEqual(end_resp.status_code, 200)
        self.assertEqual(end_resp.data["room_status"], "ended")


class BookingToVideoFlowTests(VideoTestDataMixin, TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = self.create_user("book_customer", role="user")
        self.pandit_user, self.pandit = self.create_pandit("book_pandit")
        self.booking = self.create_booking(
            self.customer,
            self.pandit,
            status="PENDING",
            payment_status=True,
        )

    def test_booking_acceptance_auto_creates_video_room(self):
        self.client.force_authenticate(self.pandit_user)

        resp = self.client.patch(
            f"/api/bookings/{self.booking.id}/update_status/",
            {"status": "ACCEPTED"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)

        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, "ACCEPTED")
        self.assertTrue(hasattr(self.booking, "video_room"))
        self.assertEqual(self.booking.video_room.provider, "webrtc")


@override_settings(
    CHANNEL_LAYERS={
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
)
class VideoWebSocketFlowTests(VideoTestDataMixin, TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        from pandityatra_backend.asgi import application

        self.application = application
        self.customer = self.create_user("ws_customer", role="user")
        self.pandit_user, self.pandit = self.create_pandit("ws_pandit")
        self.booking = self.create_booking(self.customer, self.pandit, when_minutes=10)
        self.room = ensure_video_room_for_booking(self.booking)

        self.customer_token = str(AccessToken.for_user(self.customer))
        self.pandit_token = str(AccessToken.for_user(self.pandit_user))
        self.intruder = self.create_user("ws_intruder", role="user")
        self.intruder_token = str(AccessToken.for_user(self.intruder))

    async def _recv_until(self, communicator, wanted_types, max_reads=10):
        for _ in range(max_reads):
            message = await asyncio.wait_for(communicator.receive_json_from(), timeout=2)
            if message.get("type") in wanted_types:
                return message
        self.fail(f"Did not receive expected message types: {wanted_types}")

    async def _run_ws_flow(self):
        c1 = WebsocketCommunicator(
            self.application,
            f"/ws/video/{self.room.room_name}/?token={self.customer_token}",
        )
        ok1, _ = await c1.connect()
        self.assertTrue(ok1)

        c2 = WebsocketCommunicator(
            self.application,
            f"/ws/video/{self.room.room_name}/?token={self.pandit_token}",
        )
        ok2, _ = await c2.connect()
        self.assertTrue(ok2)

        intr = WebsocketCommunicator(
            self.application,
            f"/ws/video/{self.room.room_name}/?token={self.intruder_token}",
        )
        ok3, _ = await intr.connect()
        self.assertFalse(ok3)

        await self._recv_until(c1, {"connected"})
        await self._recv_until(c1, {"chat-history"})
        await self._recv_until(c2, {"connected"})

        await c1.send_json_to(
            {
                "type": "offer",
                "sdp": {"type": "offer", "sdp": "dummy-sdp"},
                "target_user_id": self.pandit_user.id,
            }
        )
        offer_msg = await self._recv_until(c2, {"offer"})
        self.assertEqual(offer_msg.get("target_user_id"), self.pandit_user.id)

        await c1.send_json_to({"type": "chat", "message": "Namaste Pandit Ji"})
        chat_msg = await self._recv_until(c2, {"chat"})
        self.assertEqual(chat_msg.get("message"), "Namaste Pandit Ji")

        await c1.disconnect()
        await c2.disconnect()

    def test_websocket_auth_signaling_and_chat_flow(self):
        async_to_sync(self._run_ws_flow)()


class VideoReminderCommandTests(VideoTestDataMixin, TestCase):
    def setUp(self):
        self.customer = self.create_user("rem_customer", role="user")
        self.pandit_user, self.pandit = self.create_pandit("rem_pandit")
        self.booking = self.create_booking(
            self.customer,
            self.pandit,
            status="ACCEPTED",
            payment_status=True,
            when_minutes=5,
        )
        self.room = ensure_video_room_for_booking(self.booking)

    @patch("video.management.commands.send_video_reminders.send_room_reminder_email")
    @patch("video.management.commands.send_video_reminders.notify_puja_room_reminder")
    def test_reminder_command_sends_once_and_marks_room(self, notify_mock, email_mock):
        call_command("send_video_reminders")

        self.room.refresh_from_db()
        self.assertIsNotNone(self.room.reminder_sent_at)
        notify_mock.assert_called_once()
        email_mock.assert_called_once()

        notify_mock.reset_mock()
        email_mock.reset_mock()

        call_command("send_video_reminders")
        notify_mock.assert_not_called()
        email_mock.assert_not_called()