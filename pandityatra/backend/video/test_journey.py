import asyncio
from datetime import timedelta
from unittest.mock import patch, MagicMock

from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase, override_settings
from django.utils import timezone
from django.core.management import call_command
from rest_framework_simplejwt.tokens import AccessToken

from bookings.models import Booking
from pandits.models import PanditUser
from users.models import User
from services.models import Puja, PujaCategory
from video.models import VideoRoom, VideoParticipant
from video.services.room_creator import ensure_video_room_for_booking
from notifications.models import Notification

@override_settings(
    CHANNEL_LAYERS={
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    },
    DAILY_ENABLE_RECORDING=True
)
class VideoJourneyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        from pandityatra_backend.asgi import application
        self.application = application
        
        # 1. Create Anita (Customer)
        self.anita = User.objects.create_user(
            username="anita",
            email="anita@example.com",
            password="Pass@12345",
            full_name="Anita Sharma",
            role="user"
        )
        
        # 2. Create Ramesh (Pandit)
        self.ramesh = PanditUser.objects.create_user(
            username="ramesh",
            email="ramesh@example.com",
            password="Pass@12345",
            full_name="Ramesh Pandit",
            role="pandit",
            expertise="Vedic Puja",
            language="Nepali",
            is_verified=True,
            verification_status="APPROVED"
        )
        self.ramesh_user = self.ramesh
        
        # 3. Create Booking for tomorrow
        cat = PujaCategory.objects.create(name="Ceremony", slug="ceremony")
        service = Puja.objects.create(name="Naming Ceremony", category=cat, base_price=5000)
        
        tomorrow = timezone.now().date() + timedelta(days=1)
        self.booking = Booking.objects.create(
            user=self.anita,
            pandit=self.ramesh,
            service=service,
            service_name=service.name,
            service_location="ONLINE",
            booking_date=tomorrow,
            booking_time="10:00:00",
            status="ACCEPTED",
            payment_status=True
        )
        
        self.room = ensure_video_room_for_booking(self.booking)
        self.anita_token = str(AccessToken.for_user(self.anita))
        self.ramesh_token = str(AccessToken.for_user(self.ramesh_user))

    async def _recv_until(self, communicator, wanted_type, timeout=3):
        for _ in range(15):
            msg = await asyncio.wait_for(communicator.receive_json_from(), timeout=timeout)
            if msg.get("type") == wanted_type:
                return msg
        return None

    @patch("video.utils.daily_service.start_recording")
    def test_full_successful_journey(self, mock_start_rec):
        """Test Case: Anita joins, waits, Ramesh joins, recording starts."""
        
        async def run_flow():
            # Anita joins 9:55 AM (simulated)
            c1 = WebsocketCommunicator(
                self.application,
                f"/ws/video/{self.room.room_name}/?token={self.anita_token}"
            )
            connected1, _ = await c1.connect()
            self.assertTrue(connected1)
            
            # 1. Anita sees 'connected' with is_waiting=True
            conn_msg = await self._recv_until(c1, "connected")
            self.assertTrue(conn_msg["is_waiting"])
            self.assertEqual(conn_msg["peer_name"], "Ramesh Pandit")
            
            # Recording should NOT have started yet
            mock_start_rec.assert_not_called()
            
            # 2. Ramesh joins
            c2 = WebsocketCommunicator(
                self.application,
                f"/ws/video/{self.room.room_name}/?token={self.ramesh_token}"
            )
            connected2, _ = await c2.connect()
            self.assertTrue(connected2)
            
            # 3. Ramesh sees call-started or both joined
            # Recording SHOULD start now
            await asyncio.sleep(0.5)
            mock_start_rec.assert_called_once_with(self.room.room_name)
            
            # 4. Both see 'call-started' broadcast
            started_msg1 = await self._recv_until(c1, "call-started")
            started_msg2 = await self._recv_until(c2, "call-started")
            self.assertIsNotNone(started_msg1)
            self.assertIsNotNone(started_msg2)
            
            # 5. Interaction: Anita chats
            await c1.send_json_to({"type": "chat", "message": "Namaste Ramesh Ji"})
            chat_msg = await self._recv_until(c2, "chat")
            self.assertEqual(chat_msg["message"], "Namaste Ramesh Ji")
            
            await c1.disconnect()
            await c2.disconnect()
            
        async_to_sync(run_flow)()

    @patch("notifications.services.create_notification")
    def test_journey_anita_misses_call(self, mock_notify):
        """Test Case: Ramesh joins and waits 5 mins. Anita doesn't join."""
        
        async def run_flow():
            # Ramesh joins
            c = WebsocketCommunicator(
                self.application,
                f"/ws/video/{self.room.room_name}/?token={self.ramesh_token}"
            )
            await c.connect()
            
            # Simulate time travel: Ramesh has been waiting for 6 mins
            # We manually update joined_at for the participant
            def update_participant():
                participant = VideoParticipant.objects.get(room=self.room, user=self.ramesh_user)
                participant.joined_at = timezone.now() - timedelta(minutes=6)
                participant.save()
                
            await sync_to_async(update_participant)()
            
            # Mock the booking time to be 10 mins ago to pass start_dt check
            def update_booking():
                self.booking.booking_date = timezone.now().date()
                self.booking.booking_time = (timezone.now() - timedelta(minutes=10)).time()
                self.booking.save()
                
            await sync_to_async(update_booking)()
            
            # Trigger the timeout command
            await sync_to_async(call_command)("check_video_timeouts")
            
            # Check Room status
            def check_ended():
                self.room.refresh_from_db()
                return self.room.status
            
            final_status = await sync_to_async(check_ended)()
            self.assertEqual(final_status, "ended")
            
            # Check Notifications
            # Ramesh should get "Anita did not join"
            # Anita should get "You missed..."
            roles_notified = [call.kwargs.get('user').role for call in mock_notify.call_args_list]
            self.assertIn('user', roles_notified) # Customer
            self.assertIn('pandit', roles_notified) # Pandit
            
            await c.disconnect()

        async_to_sync(run_flow)()

    @patch("video.utils.daily_service.start_recording")
    def test_journey_late_join_within_grace(self, mock_start_rec):
        """Test Case: Both join 9 mins late (within 10 min window). Call should proceed."""
        
        # Set booking to 9 mins ago
        def update_booking_late():
            self.booking.booking_date = timezone.now().date()
            self.booking.booking_time = (timezone.now() - timedelta(minutes=9)).time()
            self.booking.save()
        
        async_to_sync(sync_to_async(update_booking_late))()
        
        async def run_flow():
            # 1. Anita joins late
            c1 = WebsocketCommunicator(
                self.application,
                f"/ws/video/{self.room.room_name}/?token={self.anita_token}"
            )
            await c1.connect()
            
            # 2. Command runs at 9.5 mins (should NOT end it yet because count is 1 but waiting time is tiny)
            await sync_to_async(call_command)("check_video_timeouts")
            
            def check_room():
                self.room.refresh_from_db()
                return self.room.status
                
            room_status = await sync_to_async(check_room)()
            self.assertNotEqual(room_status, "ended")
            
            # 3. Ramesh joins late (still at 9.5 mins)
            c2 = WebsocketCommunicator(
                self.application,
                f"/ws/video/{self.room.room_name}/?token={self.ramesh_token}"
            )
            await c2.connect()
            
            # Recording should start
            await asyncio.sleep(0.5)
            mock_start_rec.assert_called_once()
            
            await c1.disconnect()
            await c2.disconnect()
            
        async_to_sync(run_flow)()
