from django.db import migrations

def migrate_vendor_ids_globally(apps, schema_editor):
    """
    Update all foreign keys in dependent apps to point to the new Vendor IDs.
    This must be done BEFORE the AlterField migrations to avoid FK check failures.
    """
    VendorProfile = apps.get_model('vendors', 'VendorProfile')
    Vendor = apps.get_model('vendors', 'Vendor')
    
    # Tables to update and their apps
    # table_name, column_name
    dependent_tables = [
        ('chat_chatroom', 'vendor_id'),
        ('samagri_samagriitem', 'vendor_id'),
        ('samagri_shoporderitem', 'vendor_id'),
        ('vendors_vendorpayout', 'vendor_id'),
    ]

    with schema_editor.connection.cursor() as cursor:
        for vp in VendorProfile.objects.all():
            # Old ID is vp.id, new ID (Vendor) is vp.user_id
            user_id = vp.user_id
            
            # Create Vendor record if it doesn't exist
            v, created = Vendor.objects.get_or_create(
                user_ptr_id=user_id,
                defaults={
                    'shop_name': vp.shop_name,
                    'business_type': vp.business_type,
                    'address': vp.address,
                    'city': vp.city,
                    'bank_account_number': vp.bank_account_number,
                    'bank_name': vp.bank_name,
                    'account_holder_name': vp.account_holder_name,
                    'id_proof': vp.id_proof,
                    'is_verified': vp.is_verified,
                    'verification_status': vp.verification_status,
                    'balance': vp.balance,
                    'commission_rate': vp.commission_rate,
                    'bio': vp.bio,
                    'is_accepting_orders': vp.is_accepting_orders,
                    'auto_approve_orders': vp.auto_approve_orders,
                    'notification_email': vp.notification_email,
                    'is_low_stock_alert_enabled': vp.is_low_stock_alert_enabled,
                    'updated_at': vp.updated_at,
                }
            )
            
            for table, column in dependent_tables:
                try:
                    # Introspect constraints
                    constraints = schema_editor.connection.introspection.get_constraints(cursor, table)
                    for name, info in constraints.items():
                        if info['foreign_key'] is not None and info['columns'] == [column]:
                            schema_editor.execute(f"ALTER TABLE {table} DROP CONSTRAINT {name}")
                    
                    # Update values
                    cursor.execute(f"UPDATE {table} SET {column} = %s WHERE {column} = %s", [user_id, vp.id])
                except Exception as e:
                    print(f"Warning: Could not update {table}.{column}: {e}")
                    continue

class Migration(migrations.Migration):

    dependencies = [
        ('vendors', '0004_vendor'),
    ]

    operations = [
        migrations.RunPython(migrate_vendor_ids_globally),
    ]
