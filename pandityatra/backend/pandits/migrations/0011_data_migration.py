from django.db import migrations

def migrate_pandit_to_pandituser(apps, schema_editor):
    Pandit = apps.get_model('pandits', 'Pandit')
    PanditUser = apps.get_model('pandits', 'PanditUser')
    PanditService = apps.get_model('pandits', 'PanditService')
    PanditAvailability = apps.get_model('pandits', 'PanditAvailability')
    PanditWallet = apps.get_model('pandits', 'PanditWallet')
    User = apps.get_model('users', 'User')

    for p in Pandit.objects.all():
        # Get the User associated with this Pandit profile
        user = p.user
        
        # Create a PanditUser record for this user if it doesn't exist
        # This will link the user_ptr_id to the user's ID
        pu, created = PanditUser.objects.get_or_create(
            user_ptr=user,
            defaults={
                'expertise': p.expertise,
                'language': p.language,
                'experience_years': p.experience_years,
                'rating': p.rating,
                'bio': p.bio,
                'is_available': p.is_available,
                'verification_status': p.verification_status,
                'certification_file': p.certification_file,
                'is_verified': p.is_verified,
                'verified_date': p.verified_date,
                'updated_at': p.updated_at,
            }
        )
        
        # Now update all foreign keys that pointed to the old Pandit profile (ID p.id)
        # to point to the new PanditUser (ID user.id)
        # We use raw SQL and drop constraints to avoid integrity errors
        with schema_editor.connection.cursor() as cursor:
            # Find and drop constraints for each table
            for table in ['pandits_panditservice', 'pandits_panditavailability', 'pandits_panditwallet']:
                constraints = schema_editor.connection.introspection.get_constraints(cursor, table)
                for name, info in constraints.items():
                    if info['foreign_key'] is not None and info['columns'] == ['pandit_id']:
                        schema_editor.execute(f"ALTER TABLE {table} DROP CONSTRAINT {name}")
            
            # Update the values
            cursor.execute("UPDATE pandits_panditservice SET pandit_id = %s WHERE pandit_id = %s", [pu.id, p.id])
            cursor.execute("UPDATE pandits_panditavailability SET pandit_id = %s WHERE pandit_id = %s", [pu.id, p.id])
            cursor.execute("UPDATE pandits_panditwallet SET pandit_id = %s WHERE pandit_id = %s", [pu.id, p.id])

class Migration(migrations.Migration):

    dependencies = [
        ('pandits', '0011_pandituser'),
    ]

    operations = [
        migrations.RunPython(migrate_pandit_to_pandituser),
    ]
