from rest_framework import serializers
from .models import Payment
from bookings.models import Booking
from users.serializers import UserSerializer
from pandits.serializers import PanditSerializer

class PaymentSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_method', 'amount_npr', 'amount_usd', 'amount', 'currency',
            'transaction_id', 'status', 'created_at', 'booking', 'booking_details', 'user_details'
        ]

    def get_booking_details(self, obj):
        if not obj.booking:
            return None
        return {
            "id": obj.booking.id,
            "pandit_name": obj.booking.pandit.user.full_name if obj.booking.pandit and obj.booking.pandit.user else "Unknown"
        }

    def get_user_details(self, obj):
        if not obj.user:
            return None
        return {
            "full_name": obj.user.full_name,
            "email": obj.user.email
        }
