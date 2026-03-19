import logging
import shutil
from datetime import datetime, timedelta, timezone as dt_timezone
from pathlib import Path

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings

from .models import VideoRoom, VideoParticipant
from .serializers import VideoRoomDetailSerializer, VideoRoomUpdateSerializer
from .permissions import can_access_booking
from notifications.email_utils import send_recording_ready_email
from notifications.services import notify_recording_ready_review
from bookings.models import Booking
from .utils import daily_service
from .services.room_creator import ensure_video_room_for_booking

logger = logging.getLogger(__name__)


def _recording_chunks_dir(room_id: int, upload_id: str) -> Path:
    base = Path(settings.MEDIA_ROOT) / "recordings" / "chunks" / str(room_id) / upload_id
    base.mkdir(parents=True, exist_ok=True)
    return base


def _safe_ext(ext: str) -> str:
    cleaned = (ext or "webm").lower().strip().replace(".", "")
    return cleaned if cleaned in {"webm", "mp4", "mkv"} else "webm"


def _resolve_room_or_404(room_id):
    if str(room_id).isdigit():
        room = VideoRoom.objects.filter(id=int(room_id)).select_related("booking", "booking__pandit", "booking__user").first()
        if room:
            return room
    return get_object_or_404(
        VideoRoom.objects.select_related("booking", "booking__pandit", "booking__user"),
        room_name=room_id,
    )


def _booking_start_dt(booking):
    if not booking.booking_date or not booking.booking_time:
        return None

    naive_dt = datetime.combine(booking.booking_date, booking.booking_time)
    return timezone.make_aware(naive_dt, timezone.get_current_timezone())


def _booking_time_window_ok(booking):
    start_dt = _booking_start_dt(booking)
    if not start_dt:
        return False, "Booking start time is not configured"

    now = timezone.now()
    early_buffer = start_dt - timedelta(minutes=30)
    late_buffer = start_dt + timedelta(hours=4)
    ok = early_buffer <= now <= late_buffer
    if ok:
        return True, "ok"
    return False, "Room can be joined only around the scheduled booking time"


def _validate_booking_video_state(booking):
    if booking.service_location != "ONLINE":
        return False, "Booking is not an online service"

    # Robust payment validation:
    # some historical flows may complete Payment but leave booking.payment_status stale.
    payment_ok = bool(booking.payment_status)
    if not payment_ok:
        try:
            from payments.models import Payment

            has_completed_payment = Payment.objects.filter(
                booking=booking,
                status="COMPLETED",
            ).exists()

            if has_completed_payment:
                booking.payment_status = True
                booking.save(update_fields=["payment_status"])
                payment_ok = True
        except Exception:
            payment_ok = bool(booking.payment_status)

    if not payment_ok:
        return False, "Booking payment is not completed"

    if booking.status not in {"ACCEPTED", "COMPLETED"}:
        return False, "Booking must be accepted before joining video room"
    return True, "ok"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ice_servers(request):
    """
    Return ICE server config for WebRTC clients.
    Keeps TURN credentials on backend instead of hardcoding in frontend bundles.
    """
    stun_urls = list(getattr(settings, "STUN_URLS", []) or ["stun:stun.l.google.com:19302"])
    ice_servers_payload = [{"urls": stun_urls}]

    turn_enabled = bool(getattr(settings, "TURN_ENABLED", False))
    turn_host = getattr(settings, "TURN_PUBLIC_HOST", None) or getattr(settings, "TURN_HOST", None)
    turn_port = int(getattr(settings, "TURN_PORT", 3478) or 3478)
    turn_tls_port = int(getattr(settings, "TURN_TLS_PORT", 0) or 0)
    turn_username = getattr(settings, "TURN_USERNAME", "")
    turn_password = getattr(settings, "TURN_PASSWORD", "")
    transports = list(getattr(settings, "TURN_TRANSPORTS", ["udp", "tcp"]) or ["udp", "tcp"])

    if turn_enabled and turn_host and turn_username and turn_password:
        turn_urls = []
        if "udp" in transports:
            turn_urls.append(f"turn:{turn_host}:{turn_port}?transport=udp")
        if "tcp" in transports:
            turn_urls.append(f"turn:{turn_host}:{turn_port}?transport=tcp")
        if turn_tls_port and "tcp" in transports:
            turn_urls.append(f"turns:{turn_host}:{turn_tls_port}?transport=tcp")

        ice_servers_payload.append(
            {
                "urls": turn_urls,
                "username": turn_username,
                "credential": turn_password,
            }
        )

    return Response(
        {
            "ice_servers": ice_servers_payload,
            "turn_enabled": turn_enabled,
            "issued_at": timezone.now().isoformat(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_room_auto(request):
    booking_id = request.data.get("booking_id")
    if not booking_id:
        return Response({"error": "booking_id is required"}, status=400)

    booking = get_object_or_404(Booking, id=booking_id)

    if not can_access_booking(request.user, booking):
        return Response({"error": "Not authorized"}, status=403)

    is_valid, reason = _validate_booking_video_state(booking)
    if not is_valid:
        return Response({"error": reason}, status=400)

    room = ensure_video_room_for_booking(booking)
    start_dt = _booking_start_dt(booking)

    return Response(
        {
            "room_id": room.room_name,
            "room_url": room.room_url,
            "start_time": start_dt.astimezone(dt_timezone.utc).isoformat() if start_dt else None,
        },
        status=201,
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def room_details(request, room_id):
    try:
        room = _resolve_room_or_404(room_id)
    except Exception:
        logger.exception("Failed to resolve room details for room_id=%s", room_id)
        return Response({"error": "Unable to resolve room"}, status=400)

    if not can_access_booking(request.user, room.booking):
        return Response({"error": "Not authorized"}, status=403)

    if request.method == "PATCH":
        serializer = VideoRoomUpdateSerializer(room, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

    try:
        return Response(
            VideoRoomDetailSerializer(
                room,
                context={"booking_start_time": _booking_start_dt(room.booking)},
            ).data
        )
    except Exception:
        logger.exception("Video room serialization failed for room_id=%s", room_id)
        return Response({"error": "Unable to load room details"}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_recording(request, room_id):
    room = _resolve_room_or_404(room_id)
    if not can_access_booking(request.user, room.booking):
        return Response({"error": "Not authorized"}, status=403)

    recording_url = request.data.get("recording_url")
    recording_file = request.FILES.get("recording")

    if not recording_url and not recording_file:
        return Response({"error": "recording_url or recording file is required"}, status=400)

    if recording_file:
        filename = f"recordings/video_room_{room.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}.webm"
        saved_path = default_storage.save(filename, ContentFile(recording_file.read()))
        room.recording_url = request.build_absolute_uri(default_storage.url(saved_path))
    else:
        room.recording_url = recording_url

    room.save(update_fields=["recording_url"])

    booking = room.booking
    booking.recording_url = room.recording_url
    booking.recording_available = True
    booking.save(update_fields=["recording_url", "recording_available"])
    notify_recording_ready_review(booking)

    return Response({"success": True, "recording_url": room.recording_url})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_recording_chunk(request, room_id):
    """
    Upload recording chunks from MediaRecorder.
    Expects multipart/form-data with:
      - upload_id
      - chunk_index
      - total_chunks
      - chunk (file)
    """
    room = _resolve_room_or_404(room_id)
    if not can_access_booking(request.user, room.booking):
        return Response({"error": "Not authorized"}, status=403)

    upload_id = request.data.get("upload_id")
    chunk_index = request.data.get("chunk_index")
    total_chunks = request.data.get("total_chunks")
    chunk_file = request.FILES.get("chunk")

    if not upload_id or chunk_index is None or total_chunks is None or not chunk_file:
        return Response(
            {"error": "upload_id, chunk_index, total_chunks and chunk file are required"},
            status=400,
        )

    try:
        chunk_index = int(chunk_index)
        total_chunks = int(total_chunks)
        if chunk_index < 0 or total_chunks <= 0 or chunk_index >= total_chunks:
            return Response({"error": "Invalid chunk indexes"}, status=400)
    except ValueError:
        return Response({"error": "chunk_index and total_chunks must be integers"}, status=400)

    chunks_dir = _recording_chunks_dir(room.id, str(upload_id))
    chunk_path = chunks_dir / f"{chunk_index:08d}.part"

    with chunk_path.open("wb") as f:
        for part in chunk_file.chunks():
            f.write(part)

    return Response(
        {
            "success": True,
            "upload_id": str(upload_id),
            "chunk_index": chunk_index,
            "total_chunks": total_chunks,
        },
        status=202,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def finalize_recording_upload(request, room_id):
    """
    Merge uploaded chunks into final media file and attach to room + booking.
    Expects JSON body:
      - upload_id
      - total_chunks
      - extension (optional, webm/mp4/mkv)
    """
    room = _resolve_room_or_404(room_id)
    if not can_access_booking(request.user, room.booking):
        return Response({"error": "Not authorized"}, status=403)

    upload_id = request.data.get("upload_id")
    total_chunks = request.data.get("total_chunks")
    extension = _safe_ext(request.data.get("extension", "webm"))

    if not upload_id or total_chunks is None:
        return Response({"error": "upload_id and total_chunks are required"}, status=400)

    try:
        total_chunks = int(total_chunks)
        if total_chunks <= 0:
            return Response({"error": "total_chunks must be > 0"}, status=400)
    except ValueError:
        return Response({"error": "total_chunks must be an integer"}, status=400)

    chunks_dir = _recording_chunks_dir(room.id, str(upload_id))
    expected_files = [chunks_dir / f"{i:08d}.part" for i in range(total_chunks)]
    missing = [str(p.name) for p in expected_files if not p.exists()]
    if missing:
        return Response(
            {
                "error": "Some chunks are missing",
                "missing": missing[:20],
                "missing_count": len(missing),
            },
            status=400,
        )

    final_filename = f"recordings/video_room_{room.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}.{extension}"
    final_absolute = Path(settings.MEDIA_ROOT) / final_filename
    final_absolute.parent.mkdir(parents=True, exist_ok=True)

    with final_absolute.open("wb") as out_file:
        for p in expected_files:
            with p.open("rb") as c:
                shutil.copyfileobj(c, out_file)

    room.recording_url = request.build_absolute_uri(settings.MEDIA_URL + final_filename)
    room.save(update_fields=["recording_url"])

    booking = room.booking
    booking.recording_url = room.recording_url
    booking.recording_available = True
    booking.save(update_fields=["recording_url", "recording_available"])
    notify_recording_ready_review(booking)

    # Cleanup temporary chunk files
    try:
        shutil.rmtree(chunks_dir)
        # also cleanup parent if empty
        parent_dir = chunks_dir.parent
        if parent_dir.exists() and not any(parent_dir.iterdir()):
            parent_dir.rmdir()
    except OSError:
        logger.warning("Failed to clean up recording chunks for room=%s upload_id=%s", room.id, upload_id)

    return Response({"success": True, "recording_url": room.recording_url}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def validate_room_access(request, room_id):
    try:
        room = _resolve_room_or_404(room_id)
    except Exception:
        logger.exception("Room validation resolve failed for room_id=%s", room_id)
        return Response({"valid": False, "reason": "Room not found"}, status=404)

    if not can_access_booking(request.user, room.booking):
        return Response({"valid": False, "reason": "Not authorized"}, status=403)

    state_ok, state_reason = _validate_booking_video_state(room.booking)
    if not state_ok:
        return Response({"valid": False, "reason": state_reason}, status=400)

    window_ok, window_reason = _booking_time_window_ok(room.booking)
    if not window_ok:
        return Response({"valid": False, "reason": window_reason}, status=400)

    start_dt = _booking_start_dt(room.booking)
    return Response({
        "valid": True,
        "room_id": room.room_name,
        "booking_id": room.booking.id,
        "status": room.status,
        "start_time": start_dt.isoformat() if start_dt else None,
        "timezone": str(timezone.get_current_timezone()),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_room(request, room_id):
    room = _resolve_room_or_404(room_id)
    booking = room.booking

    if not can_access_booking(request.user, booking):
        return Response({"error": "Not authorized"}, status=403)

    room.status = "live"
    room.save(update_fields=["status"])

    if not booking.puja_start_time:
        booking.puja_start_time = timezone.now()
        booking.save(update_fields=["puja_start_time"])

    return Response({"success": True, "room_status": room.status, "started_at": booking.puja_start_time})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def end_room(request, room_id):
    room = _resolve_room_or_404(room_id)
    booking = room.booking

    if not can_access_booking(request.user, booking):
        return Response({"error": "Not authorized"}, status=403)

    now = timezone.now()
    room.status = "ended"
    room.ended_at = now
    room.save(update_fields=["status", "ended_at"])

    booking.puja_end_time = now
    booking.save(update_fields=["puja_end_time"])

    return Response({"success": True, "room_status": room.status, "ended_at": now})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video_room(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    
    # Ensure user is part of booking
    if request.user != booking.user and (not hasattr(booking, 'pandit') or request.user != booking.pandit.user):
        return Response({"error": "Not authorized"}, status=403)

    # Ensure room exists
    room = ensure_video_room_for_booking(booking)

    return Response({
        "room_name": room.room_name,
        "room_url": room.room_url,
        "status": room.status,
        "recording_url": room.recording_url,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_video_token(request):
    """
    Create a Daily.co meeting token for the user
    """
    booking_id = request.data.get('booking_id')
    if not booking_id:
        return Response({"error": "Booking ID required"}, status=400)
        
    booking = get_object_or_404(Booking, id=booking_id)
    
    # Determine role and authorization
    is_pandit = False
    if hasattr(booking, 'pandit') and request.user == booking.pandit.user:
        is_pandit = True
    elif request.user == booking.user:
        is_pandit = False
    else:
        return Response({"error": "Not authorized"}, status=403)
        
    # Ensure room exists
    room = ensure_video_room_for_booking(booking)
    
    # Create token
    token = daily_service.create_meeting_token(
        room_name=room.room_name,
        user_name=request.user.full_name or request.user.email,
        is_owner=is_pandit
    )
    
    if token:
        # Log participant join intent
        VideoParticipant.objects.get_or_create(
            room=room,
            user=request.user,
            defaults={
                "role": "pandit" if is_pandit else "customer",
                "is_host": is_pandit
            }
        )
        
        # Update room status if it's the pandit joining
        if is_pandit and room.status == 'scheduled':
            room.status = 'live'
            room.save()
            
        # Log Activity
        from adminpanel.utils import log_activity
        log_activity(
            user=request.user,
            action_type="VIDEO_CALL",
            details=f"Joined video call for booking #{booking.id}",
            request=request,
            pandit=booking.pandit if hasattr(booking, 'pandit') else None
        )
            
        return Response({
            "token": token,
            "room_url": room.room_url,
            "is_owner": is_pandit
        })
    else:
        return Response({"error": "Failed to generate token"}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def daily_webhook(request):
    """
    Handle Daily.co webhooks (recording.ready)
    """
    try:
        data = request.data
        event_type = data.get('type')
        
        if event_type == 'recording.ready':
            payload = data.get('payload', {})
            room_name = payload.get('room_name')
            # Daily.co uses access_link for the public recording URL
            recording_link = payload.get('access_link') or payload.get('recording_download_link')
            
            if room_name and recording_link:
                # Find the room
                try:
                    video_room = VideoRoom.objects.get(room_name=room_name)
                    video_room.recording_url = recording_link
                    video_room.status = 'ended'
                    video_room.ended_at = timezone.now()
                    video_room.save()
                    
                    # Update booking
                    booking = video_room.booking
                    booking.recording_url = recording_link
                    booking.recording_available = True
                    booking.status = 'COMPLETED'
                    booking.completed_at = timezone.now()
                    booking.save()
                    
                    # Notify users that recording is ready
                    try:
                        notify_recording_ready_review(booking)
                        
                        # Send Email
                        send_recording_ready_email(booking)
                    except Exception as e:
                        logger.error(f"Failed to send recording ready notification: {e}")
                    
                    logger.info(f"Updated recording for room {room_name}")
                except VideoRoom.DoesNotExist:
                    logger.warning(f"VideoRoom not found for webhook: {room_name}")
                    
        return Response({"received": True})
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room(request, booking_id):
    # Deprecated/Redundant - maintained for backward compatibility or simple join
    return create_video_token(request._request) # Re-route logic potentially

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_video_link(request, booking_id):
    """
    Manually trigger video room creation if it failed previously
    """
    booking = get_object_or_404(Booking, id=booking_id)
    
    # Auth check
    if request.user != booking.user and (not hasattr(booking, 'pandit') or request.user != booking.pandit.user):
        return Response({"error": "Not authorized"}, status=403)
        
    if booking.service_location != 'ONLINE':
        return Response({"error": "Booking is not for Online service"}, status=400)
    
    try:
        room = ensure_video_room_for_booking(booking)
        return Response({
            "success": True,
            "room_url": room.room_url
        })
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return Response({"error": str(e)}, status=503)
    except Exception as e:
        logger.error(f"Manual room creation failed: {e}")
        return Response({"error": str(e)}, status=500)
