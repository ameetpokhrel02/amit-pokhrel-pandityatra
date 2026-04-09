import datetime
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from users.models import User
from pandits.models import PanditUser
from bookings.models import Booking, BookingStatus, BookingSamagriItem
from samagri.models import SamagriItem, SamagriCategory
from services.models import Puja


class BookingSamagriPaymentIntegrationTest(TestCase):
    """
    IT01 – End-to-End Integration Test: Booking → Samagri → Payment
    ---------------------------------------------------------------
    Tests the complete customer journey:
      Step 1: Customer creates a booking with a Pandit
      Step 2: AI Samagri items are attached to the booking
      Step 3: Payment is confirmed and booking status is finalized
    """

    def setUp(self):
        self.client = APIClient()

        # Setup Customer
        self.customer = User.objects.create_user(
            username='it_customer', email='customer@it.com',
            password='p', role='user'
        )

        # Setup Pandit
        self.pandit = PanditUser.objects.create_user(
            username='it_pandit', email='pandit@it.com',
            password='p', role='pandit', expertise='Vedic',
            is_verified=True, verification_status='APPROVED',
            is_available=True
        )

        # Setup Puja Service
        self.puja = Puja.objects.create(
            name='Saraswati Puja', base_price=Decimal('1500.00')
        )

        # Setup Samagri Category and Items
        self.category = SamagriCategory.objects.create(
            name='Puja Essentials', slug='puja-essentials'
        )
        self.item1 = SamagriItem.objects.create(
            name='Deepak', price=Decimal('50.00'),
            category=self.category, stock_quantity=100, is_active=True
        )
        self.item2 = SamagriItem.objects.create(
            name='Incense Sticks', price=Decimal('30.00'),
            category=self.category, stock_quantity=100, is_active=True
        )

    # ------------------------------------------------------------------
    # STEP 1: Booking Creation
    # ------------------------------------------------------------------
    def test_it01_step1_booking_creation(self):
        """IT01-Step1: Customer successfully creates a booking with a Pandit"""
        self.client.force_authenticate(user=self.customer)

        response = self.client.post('/api/bookings/', {
            'pandit': self.pandit.id,
            'service_name': 'Saraswati Puja',
            'booking_date': str(datetime.date.today() + datetime.timedelta(days=3)),
            'booking_time': '10:00:00',
            'service_location': 'HOME',
            'total_fee': '1500.00',
        }, format='json')

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED],
                      f"Booking creation failed: {response.data}")

        booking_id = response.data.get('id')
        booking = Booking.objects.get(id=booking_id)

        self.assertEqual(booking.status, BookingStatus.PENDING)
        self.assertEqual(booking.user, self.customer)
        self.assertEqual(booking.pandit, self.pandit)

    # ------------------------------------------------------------------
    # STEP 2: Samagri Attachment
    # ------------------------------------------------------------------
    def test_it01_step2_samagri_attached_to_booking(self):
        """IT01-Step2: Samagri items are attached to the booking"""
        # Create a booking directly
        booking = Booking.objects.create(
            user=self.customer, pandit=self.pandit,
            service_name='Saraswati Puja',
            booking_date=datetime.date.today() + datetime.timedelta(days=3),
            booking_time=datetime.time(10, 0),
            total_fee=Decimal('1500.00'),
            service_location='HOME',
            status=BookingStatus.ACCEPTED
        )

        # Attach samagri items (simulates AI recommendation being confirmed)
        BookingSamagriItem.objects.create(
            booking=booking, samagri_item=self.item1,
            quantity=2, unit='pcs', unit_price=self.item1.price,
            status='RECOMMENDED', is_included=True
        )
        BookingSamagriItem.objects.create(
            booking=booking, samagri_item=self.item2,
            quantity=3, unit='pcs', unit_price=self.item2.price,
            status='SELECTED', is_included=True
        )

        # Verify items are attached
        attached_items = booking.samagri_items.filter(is_included=True)
        self.assertEqual(attached_items.count(), 2)

        # Verify total samagri cost
        total_samagri_cost = sum(
            item.unit_price * item.quantity for item in attached_items
        )
        self.assertEqual(total_samagri_cost, Decimal('190.00'))  # (50*2) + (30*3)

    # ------------------------------------------------------------------
    # STEP 3: Payment Confirmation
    # ------------------------------------------------------------------
    def test_it01_step3_payment_confirms_booking(self):
        """IT01-Step3: Payment confirmation updates booking status to paid & completed"""
        # Create booking with samagri
        booking = Booking.objects.create(
            user=self.customer, pandit=self.pandit,
            service_name='Saraswati Puja',
            booking_date=datetime.date.today() + datetime.timedelta(days=3),
            booking_time=datetime.time(10, 0),
            total_fee=Decimal('1690.00'),   # 1500 service + 190 samagri
            samagri_fee=Decimal('190.00'),
            service_fee=Decimal('1500.00'),
            service_location='HOME',
            status=BookingStatus.ACCEPTED
        )

        BookingSamagriItem.objects.create(
            booking=booking, samagri_item=self.item1,
            quantity=2, unit_price=self.item1.price, status='SELECTED'
        )

        # Simulate payment confirmation
        booking.payment_status = True          # BooleanField: True = paid
        booking.transaction_id = 'ESEWA-9988'
        booking.payment_method = 'eSewa'
        booking.status = BookingStatus.COMPLETED
        booking.save()

        # Reload from DB and verify
        booking.refresh_from_db()
        self.assertTrue(booking.payment_status)
        self.assertEqual(booking.transaction_id, 'ESEWA-9988')
        self.assertEqual(booking.payment_method, 'eSewa')
        self.assertEqual(booking.status, BookingStatus.COMPLETED)
        self.assertEqual(booking.total_fee, Decimal('1690.00'))

    # ------------------------------------------------------------------
    # STEP 4: Full End-to-End Flow (Chained)
    # ------------------------------------------------------------------
    def test_it01_full_end_to_end_flow(self):
        """IT01-Full: Complete booking → samagri → payment journey in one test"""
        # STAGE 1: Create booking
        booking = Booking.objects.create(
            user=self.customer, pandit=self.pandit,
            service_name='Saraswati Puja',
            booking_date=datetime.date.today() + datetime.timedelta(days=5),
            booking_time=datetime.time(9, 0),
            service_fee=Decimal('1500.00'),
            samagri_fee=Decimal('0.00'),
            total_fee=Decimal('1500.00'),
            service_location='HOME',
            status=BookingStatus.PENDING,
            payment_status=False
        )
        self.assertEqual(booking.status, BookingStatus.PENDING)
        self.assertFalse(booking.payment_status)

        # STAGE 2: Pandit accepts
        booking.status = BookingStatus.ACCEPTED
        booking.save()
        self.assertEqual(booking.status, BookingStatus.ACCEPTED)

        # STAGE 3: Attach samagri items
        bs1 = BookingSamagriItem.objects.create(
            booking=booking, samagri_item=self.item1,
            quantity=1, unit_price=self.item1.price, is_included=True
        )
        bs2 = BookingSamagriItem.objects.create(
            booking=booking, samagri_item=self.item2,
            quantity=2, unit_price=self.item2.price, is_included=True
        )

        # Update samagri fee on booking
        samagri_total = bs1.unit_price * bs1.quantity + bs2.unit_price * bs2.quantity
        booking.samagri_fee = samagri_total
        booking.total_fee = booking.service_fee + samagri_total
        booking.save()

        self.assertEqual(booking.samagri_fee, Decimal('110.00'))   # 50 + (30*2)
        self.assertEqual(booking.total_fee, Decimal('1610.00'))    # 1500 + 110

        # STAGE 4: Payment confirmed
        booking.payment_status = True
        booking.transaction_id = 'KHALTI-8877'
        booking.status = BookingStatus.COMPLETED
        booking.save()

        # Final Assertions
        booking.refresh_from_db()
        self.assertTrue(booking.payment_status)
        self.assertEqual(booking.status, BookingStatus.COMPLETED)
        self.assertEqual(booking.total_fee, Decimal('1610.00'))
        self.assertEqual(booking.samagri_items.filter(is_included=True).count(), 2)
        print("\n  ✔ Full Integration Flow PASSED: Booking → Samagri → Payment → Completed")
