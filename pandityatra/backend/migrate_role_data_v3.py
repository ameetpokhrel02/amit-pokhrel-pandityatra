import os
import django

# Setup Django environment
if not os.environ.get('DJANGO_SETTINGS_MODULE'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
    django.setup()

from vendors.models import Vendor, VendorProfile
from pandits.models import Pandit, PanditUser

def migrate():
    print("Starting Data Migration...")
    
    # Migrate Vendors
    vendors_count = 0
    for profile in VendorProfile.objects.all():
        user = profile.user
        if not Vendor.objects.filter(id=user.id).exists():
            # Use the model's constructor with user_ptr
            vendor = Vendor(
                user_ptr=user,
                shop_name=profile.shop_name,
                business_type=profile.business_type,
                address=profile.address,
                city=profile.city,
                bank_account_number=profile.bank_account_number,
                bank_name=profile.bank_name,
                account_holder_name=profile.account_holder_name,
                balance=profile.balance,
                commission_rate=profile.commission_rate,
                bio=profile.bio,
                is_accepting_orders=profile.is_accepting_orders,
                auto_approve_orders=profile.auto_approve_orders,
                notification_email=profile.notification_email,
                is_low_stock_alert_enabled=profile.is_low_stock_alert_enabled,
                is_verified=profile.is_verified,
                verification_status=profile.verification_status
            )
            # Need to manually copy the PK to match the User
            vendor.id = user.id
            vendor.save()
            vendors_count += 1
            print(f"Migrated Vendor: {vendor.shop_name}")

    # Migrate Pandits
    pandits_count = 0
    for profile in Pandit.objects.all():
        user = profile.user
        if not PanditUser.objects.filter(id=user.id).exists():
            pandit_user = PanditUser(
                user_ptr=user,
                expertise=profile.expertise,
                language=profile.language,
                experience_years=profile.experience_years,
                rating=profile.rating,
                bio=profile.bio,
                is_available=profile.is_available,
                verification_status=profile.verification_status,
                is_verified=profile.is_verified,
                verified_date=profile.verified_date,
                verification_notes=profile.verification_notes
            )
            pandit_user.id = user.id
            pandit_user.save()
            pandits_count += 1
            print(f"Migrated Pandit: {user.full_name}")

    print(f"Finished. Migrated {vendors_count} Vendors and {pandits_count} Pandits.")

if __name__ == "__main__":
    migrate()
