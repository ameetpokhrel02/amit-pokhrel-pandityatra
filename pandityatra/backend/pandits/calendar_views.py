# Backend Calendar Views for PanditYatra
# This file contains the API views for pandit calendar management

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Q
from datetime import datetime, timedelta, date
import json

# Import your models (adjust imports based on your project structure)
# from .models import Booking, PanditProfile
# from .calendar_models import PanditAvailability, PanditWorkingHours

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pandit_calendar_events(request):
    """
    Get calendar events for a pandit (bookings + availability blocks)
    """
    try:
        pandit = request.user
        start_date = request.GET.get('start', date.today().strftime('%Y-%m-%d'))
        end_date = request.GET.get('end', (date.today() + timedelta(days=30)).strftime('%Y-%m-%d'))
        
        events = []
        
        # Get bookings for the date range
        # bookings = Booking.objects.filter(
        #     pandit=pandit,
        #     date__range=[start_date, end_date]
        # ).select_related('customer', 'service')
        
        # Mock bookings data
        mock_bookings = [
            {
                'id': 1,
                'title': 'Ganesh Puja - Raj Sharma',
                'start': '2024-01-28T10:00:00',
                'end': '2024-01-28T11:30:00',
                'type': 'booking',
                'backgroundColor': 'hsl(222.2 47.4% 11.2%)',
                'borderColor': 'hsl(222.2 47.4% 11.2%)',
                'textColor': 'white',
                'extendedProps': {
                    'customerName': 'Raj Sharma',
                    'pujaType': 'Ganesh Puja',
                    'status': 'confirmed',
                    'price': 2500
                }
            },
            {
                'id': 2,
                'title': 'Lakshmi Puja - Priya Patel',
                'start': '2024-01-29T14:00:00',
                'end': '2024-01-29T15:30:00',
                'type': 'booking',
                'backgroundColor': 'hsl(222.2 47.4% 11.2%)',
                'borderColor': 'hsl(222.2 47.4% 11.2%)',
                'textColor': 'white',
                'extendedProps': {
                    'customerName': 'Priya Patel',
                    'pujaType': 'Lakshmi Puja',
                    'status': 'confirmed',
                    'price': 3000
                }
            }
        ]
        
        events.extend(mock_bookings)
        
        # Get availability blocks
        # availability_blocks = PanditAvailability.objects.filter(
        #     pandit=pandit,
        #     date__range=[start_date, end_date],
        #     availability_type__in=['unavailable', 'blocked']
        # )
        
        # Mock availability blocks
        mock_blocks = [
            {
                'id': 'block-1',
                'title': 'Unavailable - Personal Work',
                'start': '2024-01-30T09:00:00',
                'end': '2024-01-30T17:00:00',
                'type': 'blocked',
                'backgroundColor': '#ef4444',
                'borderColor': '#dc2626',
                'textColor': 'white',
                'extendedProps': {
                    'description': 'Personal work - Not available for bookings'
                }
            }
        ]
        
        events.extend(mock_blocks)
        
        return Response({
            'success': True,
            'events': events
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_time_slot(request):
    """
    Block a time slot for a pandit
    """
    try:
        pandit = request.user
        data = request.data
        
        # Validate required fields
        required_fields = ['date', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return Response({
                    'success': False,
                    'error': f'{field} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create availability block
        # availability_block = PanditAvailability.objects.create(
        #     pandit=pandit,
        #     date=data['date'],
        #     start_time=data['start_time'],
        #     end_time=data['end_time'],
        #     availability_type='blocked',
        #     reason=data.get('reason', 'Blocked by pandit')
        # )
        
        # Mock response
        return Response({
            'success': True,
            'message': 'Time slot blocked successfully',
            'event': {
                'id': f'block-{datetime.now().timestamp()}',
                'title': f'Unavailable - {data.get("reason", "Blocked")}',
                'start': f'{data["date"]}T{data["start_time"]}:00',
                'end': f'{data["date"]}T{data["end_time"]}:00',
                'type': 'blocked',
                'backgroundColor': '#ef4444',
                'borderColor': '#dc2626',
                'textColor': 'white',
                'extendedProps': {
                    'description': data.get('reason', 'Blocked by pandit')
                }
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_schedule(request):
    """
    Get today's schedule for a pandit
    """
    try:
        pandit = request.user
        today = date.today()
        
        # Get today's bookings
        # bookings = Booking.objects.filter(
        #     pandit=pandit,
        #     date=today
        # ).select_related('customer', 'service').order_by('time')
        
        # Mock today's schedule
        mock_schedule = [
            {
                'id': 1,
                'time': '10:00:00',
                'title': 'Ganesh Puja',
                'customer': 'Raj Sharma',
                'status': 'ACCEPTED',
                'video_link': 'https://meet.google.com/abc-def-ghi'
            },
            {
                'id': 2,
                'time': '14:00:00',
                'title': 'Lakshmi Puja',
                'customer': 'Priya Patel',
                'status': 'ACCEPTED',
                'video_link': 'https://meet.google.com/xyz-uvw-rst'
            }
        ]
        
        return Response({
            'success': True,
            'schedule': mock_schedule
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pandit_dashboard_stats(request):
    """
    Get dashboard statistics for a pandit
    """
    try:
        pandit = request.user
        today = date.today()
        
        # Calculate stats (replace with actual database queries)
        stats = {
            'todays_bookings': 2,
            'pending_requests': 1,
            'todays_earnings': 5500,
            'available_balance': 25000,
            'week_earnings': 15000,
            'month_earnings': 45000,
            'total_earned': 125000,
            'is_online': True
        }
        
        # Get next puja
        next_puja = {
            'id': 1,
            'pujaName': 'Ganesh Puja',
            'customerName': 'Raj Sharma',
            'date': today.strftime('%Y-%m-%d'),
            'time': '10:00:00',
            'location': 'ONLINE',
            'status': 'ACCEPTED',
            'videoLink': 'https://meet.google.com/abc-def-ghi'
        }
        
        # Get booking queue
        queue = [
            {
                'id': 3,
                'customer': 'Amit Kumar',
                'service': 'Durga Puja',
                'date': '2024-01-30',
                'time': '16:00:00',
                'status': 'PENDING'
            }
        ]
        
        # Get today's schedule
        schedule = [
            {
                'id': 1,
                'time': '10:00:00',
                'title': 'Ganesh Puja',
                'customer': 'Raj Sharma',
                'status': 'ACCEPTED',
                'video_link': 'https://meet.google.com/abc-def-ghi'
            },
            {
                'id': 2,
                'time': '14:00:00',
                'title': 'Lakshmi Puja',
                'customer': 'Priya Patel',
                'status': 'ACCEPTED',
                'video_link': 'https://meet.google.com/xyz-uvw-rst'
            }
        ]
        
        return Response({
            'success': True,
            'stats': stats,
            'next_puja': next_puja,
            'queue': queue,
            'schedule': schedule
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_availability(request):
    """
    Toggle pandit online/offline status
    """
    try:
        pandit = request.user
        
        # Toggle availability logic here
        # pandit_profile = PanditProfile.objects.get(user=pandit)
        # pandit_profile.is_online = not pandit_profile.is_online
        # pandit_profile.save()
        
        return Response({
            'success': True,
            'message': 'Availability status updated',
            'is_online': True  # Mock response
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)