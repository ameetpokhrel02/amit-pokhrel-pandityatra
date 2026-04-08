import os
import django
import sys
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

# Set up Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from bookings.models import Booking, BookingStatus
from users.models import User
from pandits.models import PanditUser
from services.models import Puja

def verify_flow():
    print("--- Verifying Missed Puja & Reschedule Flow ---")
    
    # 1. Setup Data
    user = User.objects.filter(role='user').first()
    pandit = PanditUser.objects.filter(is_verified=True).first()
    service = Puja.objects.first()
    
    if not user or not pandit or not service:
        print("Error: Missing test data (User/Pandit/Service)")
        return

    # 2. Create a Mock Missed Booking
    print("\n1. Creating missed booking...")
    missed_booking = Booking.objects.create(
        user=user,
        pandit=pandit,
        service=service,
        service_name=service.name,
        booking_date=timezone.now().date() - timedelta(days=1),
        booking_time="10:00:00",
        status=BookingStatus.MISSED,
        payment_status=True,
        total_fee=Decimal('1500.00'),
        transaction_id="TXN-ORIGINAL-123"
    )
    print(f"Created Booking ID: {missed_booking.id}, Status: {missed_booking.status}")

    # 3. Simulate Reschedule Attempt (Success Case)
    print("\n2. Attempting reschedule (Success Case)...")
    from bookings.views import BookingViewSet
    from rest_framework.test import APIRequestFactory, force_authenticate
    
    factory = APIRequestFactory()
    view = BookingViewSet.as_view({'post': 'reschedule'})
    
    new_date = (timezone.now() + timedelta(days=2)).date().isoformat()
    new_time = "11:00:00"
    
    request = factory.post(f'/api/bookings/{missed_booking.id}/reschedule/', {
        'booking_date': new_date,
        'booking_time': new_time
    })
    force_authenticate(request, user=user)
    
    response = view(request, pk=missed_booking.id)
    print(f"Response Status: {response.status_code}")
    print(f"Response Data: {response.data}")
    
    if response.status_code == 200:
        new_booking_id = response.data['new_booking_id']
        new_booking = Booking.objects.get(id=new_booking_id)
        print(f"New Booking created with ID: {new_booking.id}")
        print(f"New Booking total_fee: {new_booking.total_fee} (Should be 0.00)")
        print(f"Original Booking status: {Booking.objects.get(id=missed_booking.id).status} (Should be RESCHEDULED)")
        
        # 4. Attempt Duplicate Reschedule (Failure Case)
        print("\n3. Attempting double reschedule (Failure Case)...")
        request = factory.post(f'/api/bookings/{missed_booking.id}/reschedule/', {
            'booking_date': new_date,
            'booking_time': new_time
        })
        force_authenticate(request, user=user)
        response = view(request, pk=missed_booking.id)
        print(f"Duplicate Response Status: {response.status_code} (Should be 400)")
        print(f"Duplicate Response Details: {response.data.get('detail')}")

    # 5. Cleanup
    # (Optional: delete created objects or keep for inspection)
    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    verify_flow()
