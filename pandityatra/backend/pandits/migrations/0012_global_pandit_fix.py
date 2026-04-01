from django.db import migrations

def migrate_pandit_ids_globally(apps, schema_editor):
    """
    Update all foreign keys in dependent apps to point to the new PanditUser IDs.
    This must be done BEFORE the AlterField migrations to avoid FK check failures.
    """
    Pandit = apps.get_model('pandits', 'Pandit')
    PanditUser = apps.get_model('pandits', 'PanditUser')
    
    # Tables to update and their apps
    # table_name, column_name
    dependent_tables = [
        ('adminpanel_activitylog', 'pandit_id'),
        ('bookings_booking', 'pandit_id'),
        ('chat_chatroom', 'pandit_id'),
        ('reviews_review', 'pandit_id'),
        ('payments_panditwithdrawal', 'pandit_id'),
    ]

    with schema_editor.connection.cursor() as cursor:
        for p in Pandit.objects.all():
            # Old ID is p.id, new ID (PanditUser) is p.user_id
            user_id = p.user_id
            
            for table, column in dependent_tables:
                try:
                    # Drop constraint temporarily if it exists
                    # This is tricky because constraint names are auto-generated.
                    # We rely on our previous 0011_data_migration having dropped some,
                    # but these are in DIFFERENT apps.
                    
                    # Introspect constraints for this table
                    constraints = schema_editor.connection.introspection.get_constraints(cursor, table)
                    for name, info in constraints.items():
                        if info['foreign_key'] is not None and info['columns'] == [column]:
                            schema_editor.execute(f"ALTER TABLE {table} DROP CONSTRAINT {name}")
                    
                    # Update values
                    cursor.execute(f"UPDATE {table} SET {column} = %s WHERE {column} = %s", [user_id, p.id])
                except Exception as e:
                    print(f"Warning: Could not update {table}.{column}: {e}")
                    continue

class Migration(migrations.Migration):

    dependencies = [
        ('pandits', '0012_remove_pandit_verification_notes_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_pandit_ids_globally),
    ]
