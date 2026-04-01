from django.db import connection
def check():
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'vendors_vendor'")
        print([row[0] for row in cursor.fetchall()])
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'pandits_pandituser'")
        print([row[0] for row in cursor.fetchall()])
check()
