from urllib import request
from django.shortcuts import render
import json
import logging

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import VideoRoom, VideoParticipant
from notifications.email_utils import send_recording_ready_email
from bookings.models import Booking
from .utils import daily_service
from .services.room_creator import ensure_video_room_for_booking

logger = logging.getLogger(__name__)

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
                        from notifications.models import Notification
                        Notification.objects.create(
                            user=booking.user,
                            notification_type='BOOKING_COMPLETED',
                            title="Puja Recording Ready",
                            message=f"Your {booking.service_name} recording is now available in 'My Bookings'.",
                            booking=booking
                        )
                        
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
