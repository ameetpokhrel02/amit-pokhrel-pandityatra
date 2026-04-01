import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from django.db import connection, transaction
from vendors.models import VendorProfile
from pandits.models import Pandit

@transaction.atomic
def promote():
    print("Promoting existing users to inherited roles...")
    with connection.cursor() as cursor:
        # Promote Vendors
        for profile in VendorProfile.objects.all():
            user_id = profile.user_id
            cursor.execute("""
                INSERT INTO vendors_vendor (
                    user_ptr_id, shop_name, business_type, address, city, 
                    bank_account_number, bank_name, account_holder_name, 
                    id_proof, is_verified, verification_status, balance, 
                    commission_rate, bio, is_accepting_orders, 
                    auto_approve_orders, notification_email, 
                    is_low_stock_alert_enabled, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_ptr_id) DO NOTHING
            """, [
                user_id, profile.shop_name, profile.business_type, profile.address, profile.city,
                profile.bank_account_number, profile.bank_name, profile.account_holder_name,
                profile.id_proof.name if profile.id_proof else None, profile.is_verified, 
                profile.verification_status, profile.balance, profile.commission_rate, profile.bio,
                profile.is_accepting_orders, profile.auto_approve_orders, 
                profile.notification_email, profile.is_low_stock_alert_enabled,
                profile.created_at, profile.updated_at
            ])
            print(f"Promoted Vendor ID {user_id}: {profile.shop_name}")

        # Promote Pandits
        for p in Pandit.objects.all():
            user_id = p.user_id
            cursor.execute("""
                INSERT INTO pandits_pandituser (
                    user_ptr_id, expertise, language, experience_years, 
                    rating, bio, is_available, verification_status, 
                    certification_file, is_verified, verified_date, 
                    verification_notes, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_ptr_id) DO NOTHING
            """, [
                user_id, p.expertise, p.language, p.experience_years,
                p.rating, p.bio, p.is_available, p.verification_status,
                p.certification_file.name if p.certification_file else None, 
                p.is_verified, p.verified_date, p.verification_notes, p.updated_at
            ])
            print(f"Promoted Pandit ID {user_id}")
    print("Role promotion complete.")

promote()
