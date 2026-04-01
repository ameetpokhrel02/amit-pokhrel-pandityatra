from vendors.serializers import VendorRegisterSerializer
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory

factory = RequestFactory()
request = factory.post('/api/vendors/register/')

data = {
    'email': 'test_vendor_new@example.com',
    'password': 'Password123!',
    'full_name': 'Test Vendor',
    'phone_number': '9800000000',
    'shop_name': 'Test Shop',
    'business_type': 'Samagri Store',
    'address': 'Test Address',
    'city': 'Kathmandu',
    'bank_name': 'Nabil',
    'account_holder_name': 'Test Vendor',
    'bank_account_number': '1234567890',
}

# Add a dummy file
file_data = b'dummy content'
id_proof = SimpleUploadedFile('id_proof.jpg', file_data, content_type='image/jpeg')
data['id_proof'] = id_proof

serializer = VendorRegisterSerializer(data=data, context={'request': request})
if serializer.is_valid():
    print("Valid")
    try:
        serializer.save()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"Invalid: {serializer.errors}")
