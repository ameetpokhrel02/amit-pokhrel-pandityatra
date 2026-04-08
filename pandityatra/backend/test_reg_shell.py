from django.contrib.auth import get_user_model
from vendors.serializers import VendorRegisterSerializer
from unittest.mock import patch, MagicMock

User = get_user_model()

@patch('cloudinary.uploader.upload')
def run_test(mock_upload):
    # Setup mock return value
    mock_upload.return_value = {
        'public_id': 'test_id',
        'secure_url': 'https://test-cloudinary.com/id_proof.jpg',
        'format': 'jpg'
    }
    
    from django.core.files.uploadedfile import SimpleUploadedFile
    from django.test import RequestFactory

    factory = RequestFactory()
    request = factory.post('/api/vendors/register/')

    email1 = 'sujit.poddar@ncit.edu.np'
    email2 = 'sujit.poddar@gmail.com'
    
    # Cleanup
    User.objects.filter(email=email1).delete()
    User.objects.filter(email=email2).delete()

    data = {
        'email': email1,
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
        'id_proof': SimpleUploadedFile('id_proof.jpg', b'dummy content', content_type='image/jpeg')
    }

    serializer = VendorRegisterSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        profile = serializer.save()
        print(f"Vendor 1 Registered: Success ({profile.user.username})")
        
        # Test duplicate username prefix
        data2 = data.copy()
        data2['email'] = email2
        data2['phone_number'] = '9822222222'
        data2['id_proof'] = SimpleUploadedFile('id_proof2.jpg', b'other content', content_type='image/jpeg')

        serializer2 = VendorRegisterSerializer(data=data2, context={'request': request})
        if serializer2.is_valid():
            profile2 = serializer2.save()
            print(f"Vendor 2 Registered: Success ({profile2.user.username})")
            if profile.user.username != profile2.user.username:
                print("Uniqueness Check: PASS")
            else:
                print("Uniqueness Check: FAIL")
        else:
            print(f"Vendor 2 Validation FAILED: {serializer2.errors}")
    else:
        print(f"Vendor 1 Validation FAILED: {serializer.errors}")

run_test()
