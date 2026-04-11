import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from bookings.models import Booking, BookingStatus
from samagri.models import ShopOrder, ShopOrderStatus
from recommender.logic import SamagriRecommender
from recommender.models import UserSamagriPreference

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Synchronize historical purchases (Bookings & Shop Orders) into AI Samagri Preferences'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset all existing preferences before sync (Caution: deletes manually set favorites!)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Starting AI Samagri Preferences synchronization...'))
        
        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting existing preferences...'))
            UserSamagriPreference.objects.all().delete()

        with transaction.atomic():
            # 1. Sync Bookings
            completed_bookings = Booking.objects.filter(status=BookingStatus.COMPLETED).select_related('user').prefetch_related('samagri_items', 'samagri_items__samagri_item')
            self.stdout.write(f"🔍 Found {completed_bookings.count()} completed bookings...")
            
            booking_item_count = 0
            for booking in completed_bookings:
                for item in booking.samagri_items.filter(is_included=True):
                    if item.samagri_item:
                        SamagriRecommender.record_purchase(
                            user=booking.user,
                            samagri_item=item.samagri_item,
                            quantity=item.quantity,
                            spent_amount=item.total_price
                        )
                        booking_item_count += 1
            
            self.stdout.write(self.style.SUCCESS(f"✅ Synced {booking_item_count} items from bookings."))

            # 2. Sync Shop Orders
            success_states = [ShopOrderStatus.PAID, ShopOrderStatus.DELIVERED, ShopOrderStatus.SHIPPED]
            completed_orders = ShopOrder.objects.filter(status__in=success_states).select_related('user').prefetch_related('items', 'items__samagri_item')
            self.stdout.write(f"🔍 Found {completed_orders.count()} successful shop orders...")
            
            order_item_count = 0
            for order in completed_orders:
                before_count = order_item_count
                SamagriRecommender.record_shop_order(order)
                # Count how many items were actually in this order
                order_item_count += order.items.filter(samagri_item__isnull=False).count()
                
            self.stdout.write(self.style.SUCCESS(f"✅ Synced {order_item_count} items from shop orders."))

            self.stdout.write(self.style.SUCCESS(
                f"\n🎉 Total Synchronization Complete!\n"
                f"Items Processed: {booking_item_count + order_item_count}"
            ))
