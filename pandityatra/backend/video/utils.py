"""
Video Call Integration with Daily.co
"""
import requests
import logging
from django.conf import settings
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class DailyVideoService:
    """
    Service class for Daily.co video room management
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'DAILY_API_KEY', None)
        self.base_url = 'https://api.daily.co/v1'
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_room(self, booking_id: int, puja_name: str, booking_date: str, 
                   duration_minutes: int = 120) -> Optional[Dict[str, Any]]:
        """
        Create a Daily.co room for a puja session
        
        Args:
            booking_id: Unique booking identifier
            puja_name: Name of the puja
            booking_date: Date of the booking (YYYY-MM-DD)
            duration_minutes: Duration of the room in minutes
            
        Returns:
            Dict with room details or None if failed
        """
        if not self.api_key:
            logger.error("Daily.co API key not configured")
            return None
            
        try:
            # Calculate room expiry (booking date + duration + 1 hour buffer)
            booking_datetime = datetime.strptime(booking_date, '%Y-%m-%d')
            expiry_time = booking_datetime + timedelta(minutes=duration_minutes + 60)
            
            room_data = {
                'name': f'puja-{booking_id}-{datetime.now().strftime("%Y%m%d")}',
                'properties': {
                    'max_participants': 10,  # Pandit + customer + family members
                    'enable_chat': True,
                    'enable_screenshare': True,
                    'enable_recording': 'cloud',  # Enable cloud recording
                    'start_cloud_recording': False,  # Manual start
                    'exp': int(expiry_time.timestamp()),
                    'eject_at_room_exp': True,
                    'lang': 'en',
                    'geo': 'in-mumbai',  # Closest to Nepal
                    'privacy': 'private',
                    'enable_knocking': True,
                    'enable_prejoin_ui': True,
                    'enable_network_ui': True,
                    'enable_people_ui': True,
                    'theme': {
                        'accent': '#f97316',  # Orange theme matching PanditYatra
                        'accentText': '#ffffff',
                        'background': '#ffffff',
                        'backgroundAccent': '#fef3e2',
                        'baseText': '#1f2937',
                        'border': '#e5e7eb',
                        'mainAreaBg': '#ffffff',
                        'mainAreaBgAccent': '#f9fafb',
                        'mainAreaText': '#1f2937',
                        'supportiveText': '#6b7280'
                    }
                }
            }
            
            response = requests.post(
                f'{self.base_url}/rooms',
                json=room_data,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                room_info = response.json()
                logger.info(f"Created Daily.co room for booking {booking_id}: {room_info['url']}")
                
                return {
                    'room_name': room_info['name'],
                    'room_url': room_info['url'],
                    'room_id': room_info['id'],
                    'expires_at': expiry_time.isoformat(),
                    'max_participants': 10,
                    'recording_enabled': True
                }
            else:
                logger.error(f"Failed to create Daily.co room: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating Daily.co room: {str(e)}")
            return None
    
    def get_room_info(self, room_name: str) -> Optional[Dict[str, Any]]:
        """Get information about an existing room"""
        try:
            response = requests.get(
                f'{self.base_url}/rooms/{room_name}',
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get room info: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting room info: {str(e)}")
            return None
    
    def delete_room(self, room_name: str) -> bool:
        """Delete a room"""
        try:
            response = requests.delete(
                f'{self.base_url}/rooms/{room_name}',
                headers=self.headers,
                timeout=30
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Error deleting room: {str(e)}")
            return False
    
    def create_meeting_token(self, room_name: str, user_name: str, 
                           is_owner: bool = False) -> Optional[str]:
        """
        Create a meeting token for a user to join a room
        
        Args:
            room_name: Name of the room
            user_name: Display name for the user
            is_owner: Whether user has owner privileges (for pandit)
            
        Returns:
            Meeting token string or None if failed
        """
        try:
            token_data = {
                'properties': {
                    'room_name': room_name,
                    'user_name': user_name,
                    'is_owner': is_owner,
                    'enable_screenshare': is_owner,  # Only pandit can screenshare
                    'enable_recording': is_owner,    # Only pandit can record
                    'enable_chat': True,
                    'exp': int((datetime.now() + timedelta(hours=4)).timestamp())
                }
            }
            
            response = requests.post(
                f'{self.base_url}/meeting-tokens',
                json=token_data,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()['token']
            else:
                logger.error(f"Failed to create meeting token: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating meeting token: {str(e)}")
            return None
    
    def start_recording(self, room_name: str) -> bool:
        """Start cloud recording for a room"""
        try:
            response = requests.post(
                f'{self.base_url}/rooms/{room_name}/recordings/start',
                headers=self.headers,
                timeout=30
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Error starting recording: {str(e)}")
            return False
    
    def stop_recording(self, room_name: str) -> Optional[Dict[str, Any]]:
        """Stop recording and get recording info"""
        try:
            response = requests.post(
                f'{self.base_url}/rooms/{room_name}/recordings/stop',
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error stopping recording: {str(e)}")
            return None
    
    def get_recordings(self, room_name: str) -> Optional[list]:
        """Get list of recordings for a room"""
        try:
            response = requests.get(
                f'{self.base_url}/recordings',
                params={'room_name': room_name},
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error getting recordings: {str(e)}")
            return None


# Convenience functions
daily_service = DailyVideoService()

def create_video_room(booking_id: int, booking_date: str, puja_name: str, 
                     duration_minutes: int = 120) -> Optional[str]:
    """
    Create a video room and return the URL
    
    Returns:
        Room URL string or None if failed
    """
    room_info = daily_service.create_room(
        booking_id=booking_id,
        puja_name=puja_name,
        booking_date=booking_date,
        duration_minutes=duration_minutes
    )
    
    return room_info['room_url'] if room_info else None

def create_join_token(room_url: str, user_name: str, is_pandit: bool = False) -> Optional[str]:
    """
    Create a token for joining a video room
    
    Args:
        room_url: Full Daily.co room URL
        user_name: Display name for the user
        is_pandit: Whether this is the pandit (gets owner privileges)
        
    Returns:
        Meeting token or None if failed
    """
    # Extract room name from URL
    room_name = room_url.split('/')[-1]
    
    return daily_service.create_meeting_token(
        room_name=room_name,
        user_name=user_name,
        is_owner=is_pandit
    )

def get_room_recordings(room_url: str) -> Optional[list]:
    """Get recordings for a room"""
    room_name = room_url.split('/')[-1]
    return daily_service.get_recordings(room_name)