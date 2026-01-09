from urllib import request
from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import VideoRoom, VideoParticipant
from bookings.models import Booking

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video_room(request, booking_id):
    booking = get_object_or_404 (Booking, id=booking_id, user=request.user)

    room =booking.video_room

    return Response({
        "room_name": room.room_url,
        "status": room.status,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_video_room(request, booking_id):
    booking = get_object_or_404 (Booking, id=booking_id, user=request.user)
    room =booking.video_room

    # Mark room as live if not already
    if room.status != "live":
        room.status ="live"
        room.save()

    # Add participant
    VideoParticipant.objects.get_or_create(
        video_room=room,
        user=request.user
    )

    return Response({
        "message": "Joined the video room successfully.",
        "room_url": room.room_url,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room(rrequest, booking_id):
    booking = get_object_or_404 (Booking, id=booking_id)

    room =booking.video_room

    partcipant, _ =VideoParticipant.objects.get_or_create(
        room=room,
        user=request.user,
        defaults={
            "role": "pandit" if request.user ==booking.pandit.user else "customer",
            "is_host": request.user ==booking.pandit,
        }
    )

    room.status ="live"
    room.save(update_fields=["status"] )

    return Response({
        "message": "Joined the video room successfully.",})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_video_room(request, booking_id):
    booking =get_object_or_404 (Booking,id=booking_id)
    room =booking.video_room

    participant = VideoParticipant.objects.filter(
        room=room,
        user=request.user
    ).first()

    if participant:
        participant.left_at =timezone.now()
        participant.save(update_fields=["left_at"])

    return Response({"message": "Left the video room successfully."})