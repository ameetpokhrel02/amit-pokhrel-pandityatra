import os
import django
import sys
from django.db import connection, transaction

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from chat.models import Message, ChatMessage

def migrate_table(table_name):
    print(f"Migrating {table_name}...")
    count = 0
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT id, content, content_ne FROM {table_name}")
        rows = cursor.fetchall()
        
        for row in rows:
            msg_id = row[0]
            raw_content_bytes = row[1]
            raw_content_ne_bytes = row[2]
            
            try:
                # Try to decode the binary as UTF-8. 
                # If it's PLAIN TEXT, this will usually work.
                # If it's ENCRYPTED (binary blobs), this will almost certainly fail.
                plain_content = bytes(raw_content_bytes).decode('utf-8')
                plain_content_ne = bytes(raw_content_ne_bytes).decode('utf-8') if raw_content_ne_bytes else None
                
                print(f"  Encrypting {table_name} ID {msg_id}...")
                
                # Use raw SQL to update so we don't trigger the Signature check on load
                # Actually, we MUST use the model to perform the encryption.
                # But we must avoid the get() if it triggers decryption.
                # We can use update()!
                if table_name == "chat_message":
                    Message.objects.filter(id=msg_id).update(content=plain_content, content_ne=plain_content_ne)
                else:
                    ChatMessage.objects.filter(id=msg_id).update(content=plain_content, content_ne=plain_content_ne)
                
                count += 1
            except UnicodeDecodeError:
                # Already encrypted!
                print(f"  Skipping {table_name} ID {msg_id} (already encrypted).")
            except Exception as e:
                print(f"  Error on ID {msg_id}: {str(e)}")
                
    print(f"Finished {table_name}. Migrated {count} items.")

if __name__ == "__main__":
    try:
        migrate_table("chat_message")
        migrate_table("chat_chatmessage")
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        sys.exit(1)
