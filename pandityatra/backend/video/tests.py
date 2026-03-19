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


class ProductionReadinessSmokeTest(VideoTestDataMixin, TestCase):
    """
    One high-value smoke test for production readiness:
    ensures critical video endpoints are stable (no 500) and payload contracts hold.
    """

    def setUp(self):
        self.client = APIClient()
        self.customer = self.create_user("prod_customer", role="user")
        self.pandit_user, self.pandit = self.create_pandit("prod_pandit")
        self.booking = self.create_booking(self.customer, self.pandit, status="ACCEPTED", payment_status=True)
        self.room = ensure_video_room_for_booking(self.booking)
        self.client.force_authenticate(self.customer)

    def test_production_video_smoke_endpoints(self):
        # 1) ICE config must be available and contain at least STUN urls
        ice = self.client.get("/api/video/ice-servers/")
        self.assertEqual(ice.status_code, 200)
        self.assertIn("ice_servers", ice.data)
        self.assertIsInstance(ice.data["ice_servers"], list)
        self.assertGreaterEqual(len(ice.data["ice_servers"]), 1)
        self.assertIn("urls", ice.data["ice_servers"][0])

        # 2) Room details must resolve via slug room id
        detail = self.client.get(f"/api/video/rooms/{self.room.room_name}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["room_id"], self.room.room_name)
        self.assertEqual(detail.data["booking_id"], self.booking.id)

        # 3) Validation endpoint must return valid=True in allowed time window
        validate = self.client.get(f"/api/video/{self.room.room_name}/validate/")
        self.assertEqual(validate.status_code, 200)
        self.assertTrue(validate.data.get("valid"))


class AsgiStartupTests(TestCase):
    def test_asgi_application_loads(self):
        from pandityatra_backend.asgi import application

        self.assertIsNotNone(application)
        self.assertTrue(callable(application))


@override_settings(
    CHANNEL_LAYERS={
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
)
class WebSocketAsgiHandshakeSmokeTests(VideoTestDataMixin, TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        from pandityatra_backend.asgi import application

        self.application = application
        self.customer = self.create_user("ws_smoke_customer", role="user")
        self.pandit_user, self.pandit = self.create_pandit("ws_smoke_pandit")
        self.booking = self.create_booking(self.customer, self.pandit, when_minutes=10)
        self.room = ensure_video_room_for_booking(self.booking)

        self.customer_token = str(AccessToken.for_user(self.customer))

    async def _run_handshake(self):
        communicator = WebsocketCommunicator(
            self.application,
            f"/ws/video/{self.room.room_name}/?token={self.customer_token}",
        )

        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.disconnect()

    def test_ws_video_asgi_handshake(self):
        async_to_sync(self._run_handshake)()


@override_settings(
    CHANNEL_LAYERS={
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
)
class VideoCallEndToEndDeploymentTests(VideoTestDataMixin, TransactionTestCase):
    """
    Complete video-call flow test for both customer and pandit:
    booking -> acceptance -> room/validate -> ws signaling -> chat -> end room.
    """

    reset_sequences = True

    def setUp(self):
        from pandityatra_backend.asgi import application

        self.application = application
        self.customer = self.create_user("e2e_customer", role="user")
        self.pandit_user, self.pandit = self.create_pandit("e2e_pandit")
        self.booking = self.create_booking(
            self.customer,
            self.pandit,
            status="PENDING",
            payment_status=True,
            when_minutes=12,
        )

        self.customer_client = APIClient()
        self.customer_client.force_authenticate(self.customer)
        self.pandit_client = APIClient()
        self.pandit_client.force_authenticate(self.pandit_user)

        self.customer_token = str(AccessToken.for_user(self.customer))
        self.pandit_token = str(AccessToken.for_user(self.pandit_user))

    async def _recv_until(self, communicator, wanted_types, max_reads=12):
        for _ in range(max_reads):
            message = await asyncio.wait_for(communicator.receive_json_from(), timeout=2)
            if message.get("type") in wanted_types:
                return message
        self.fail(f"Did not receive expected message types: {wanted_types}")

    def test_complete_video_call_flow_user_and_pandit(self):
        # 1) Pandit accepts booking
        accept = self.pandit_client.patch(
            f"/api/bookings/{self.booking.id}/update_status/",
            {"status": "ACCEPTED"},
            format="json",
        )
        self.assertEqual(accept.status_code, 200)

        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, "ACCEPTED")
        self.assertTrue(hasattr(self.booking, "video_room"))
        room = self.booking.video_room

        # 2) Both roles can access room and validate
        customer_room = self.customer_client.get(f"/api/video/rooms/{room.room_name}/")
        self.assertEqual(customer_room.status_code, 200)

        pandit_room = self.pandit_client.get(f"/api/video/rooms/{room.room_name}/")
        self.assertEqual(pandit_room.status_code, 200)

        customer_validate = self.customer_client.get(f"/api/video/{room.room_name}/validate/")
        self.assertEqual(customer_validate.status_code, 200)
        self.assertTrue(customer_validate.data.get("valid"))

        pandit_validate = self.pandit_client.get(f"/api/video/{room.room_name}/validate/")
        self.assertEqual(pandit_validate.status_code, 200)
        self.assertTrue(pandit_validate.data.get("valid"))

        # 3) Pandit can start room
        start_resp = self.pandit_client.post(f"/api/video/rooms/{room.room_name}/start/")
        self.assertEqual(start_resp.status_code, 200)

        # 4) WebSocket signaling and chat between both roles
        async def run_ws_flow():
            customer_ws = WebsocketCommunicator(
                self.application,
                f"/ws/video/{room.room_name}/?token={self.customer_token}",
            )
            c_ok, _ = await customer_ws.connect()
            self.assertTrue(c_ok)

            pandit_ws = WebsocketCommunicator(
                self.application,
                f"/ws/video/{room.room_name}/?token={self.pandit_token}",
            )
            p_ok, _ = await pandit_ws.connect()
            self.assertTrue(p_ok)

            await self._recv_until(customer_ws, {"connected"})
            await self._recv_until(customer_ws, {"chat-history"})
            await self._recv_until(pandit_ws, {"connected"})

            await customer_ws.send_json_to(
                {
                    "type": "offer",
                    "sdp": {"type": "offer", "sdp": "dummy-offer-sdp"},
                    "target_user_id": self.pandit_user.id,
                }
            )
            offer_msg = await self._recv_until(pandit_ws, {"offer"})
            self.assertEqual(offer_msg.get("target_user_id"), self.pandit_user.id)

            await pandit_ws.send_json_to(
                {
                    "type": "answer",
                    "sdp": {"type": "answer", "sdp": "dummy-answer-sdp"},
                    "target_user_id": self.customer.id,
                }
            )
            answer_msg = await self._recv_until(customer_ws, {"answer"})
            self.assertEqual(answer_msg.get("target_user_id"), self.customer.id)

            await customer_ws.send_json_to({"type": "chat", "message": "Namaste, audio/video check"})
            chat_msg = await self._recv_until(pandit_ws, {"chat"})
            self.assertEqual(chat_msg.get("message"), "Namaste, audio/video check")

            await customer_ws.disconnect()
            await pandit_ws.disconnect()

        async_to_sync(run_ws_flow)()

        # 5) Pandit ends room
        end_resp = self.pandit_client.post(f"/api/video/rooms/{room.room_name}/end/")
        self.assertEqual(end_resp.status_code, 200)
        self.assertEqual(end_resp.data.get("room_status"), "ended")


@override_settings(
    CHANNEL_LAYERS={
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
)
class FrontendWebSocketContractDiagnosticTest(VideoTestDataMixin, TransactionTestCase):
    """
    One diagnostic test to mirror browser-like websocket conditions.
    If this fails, root cause is backend ASGI/auth contract, not React rendering.
    """

    reset_sequences = True

    def setUp(self):
        from pandityatra_backend.asgi import application

        self.application = application
        self.customer = self.create_user("diag_customer", role="user")
        self.pandit_user, self.pandit = self.create_pandit("diag_pandit")
        self.booking = self.create_booking(self.customer, self.pandit, when_minutes=10)
        self.room = ensure_video_room_for_booking(self.booking)
        self.valid_token = str(AccessToken.for_user(self.customer))

    async def _connect(self, path: str, headers=None):
        communicator = WebsocketCommunicator(self.application, path, headers=headers or [])
        ok, _ = await communicator.connect()
        return communicator, ok

    async def _run_diagnostic(self):
        # 1) Missing token should be rejected
        ws_missing, ok_missing = await self._connect(f"/ws/video/{self.room.room_name}/")
        self.assertFalse(ok_missing)

        # 2) Invalid token should be rejected
        ws_invalid, ok_invalid = await self._connect(
            f"/ws/video/{self.room.room_name}/?token=invalid.jwt.token"
        )
        self.assertFalse(ok_invalid)

        # 3) Valid token with browser-like Origin header should connect
        ws_valid, ok_valid = await self._connect(
            f"/ws/video/{self.room.room_name}/?token={self.valid_token}",
            headers=[(b"origin", b"http://localhost:5173")],
        )
        self.assertTrue(ok_valid)

        first_msg = await asyncio.wait_for(ws_valid.receive_json_from(), timeout=2)
        self.assertEqual(first_msg.get("type"), "connected")

        await ws_valid.disconnect()

    def test_frontend_ws_contract_diagnostic(self):
        async_to_sync(self._run_diagnostic)()