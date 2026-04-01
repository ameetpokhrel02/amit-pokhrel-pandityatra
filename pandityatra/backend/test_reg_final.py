import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

User = get_user_model()
from vendors.serializers import VendorRegisterSerializer

def run_test():
    factory = RequestFactory()
    request = factory.post('/api/vendors/register/')

    email = 'sujit.poddar@ncit.edu.np'
    # Cleanup previous test if any
    User.objects.filter(email=email).delete()

    data = {
        'email': email,
        'password': 'Password123!',
        'full_name': 'Sujit Poddar',
        'phone_number': '9811111111',
        'shop_name': 'Sujit Shop',
        'business_type': 'Samagri Store',
        'address': 'Kathmandu 12',
        'city': 'Kathmandu',
        'bank_name': 'Nabil',
        'account_holder_name': 'Sujit Poddar',
        'bank_account_number': '0987654321',
    }

    # Add a dummy file
    file_data = b'dummy content'
    id_proof = SimpleUploadedFile('id_proof.jpg', file_data, content_type='image/jpeg')
    data['id_proof'] = id_proof

    serializer = VendorRegisterSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        print("Serializer Validated: SUCCESS")
        try:
            profile = serializer.save()
            user = profile.user
            print(f"Vendor Registered: SUCCESS")
            print(f"Created Username: {user.username}")
            print(f"Created Email: {user.email}")
            print(f"Role: {user.role}")
            
            # Test duplicate username prefix
            print("\nTesting duplicate prefix registration ('sujit.poddar@gmail.com')...")
            data2 = data.copy()
            data2['email'] = 'sujit.poddar@gmail.com'
            data2['phone_number'] = '9822222222'
            data2['id_proof'] = SimpleUploadedFile('id_proof2.jpg', b'other content', content_type='image/jpeg')
            
            # Cleanup previous test if any
            User.objects.filter(email=data2['email']).delete()

            serializer2 = VendorRegisterSerializer(data=data2, context={'request': request})
            if serializer2.is_valid():
                profile2 = serializer2.save()
                print(f"Second Vendor Registered: SUCCESS")
                print(f"Second Username (should be unique): {profile2.user.username}")
            else:
                print(f"Second Serializer FAILED: {serializer2.errors}")
        except Exception as e:
            print(f"Save ERROR: {e}")
    else:
        print(f"Validation FAILED: {serializer.errors}")

if __name__ == '__main__':
    run_test()
