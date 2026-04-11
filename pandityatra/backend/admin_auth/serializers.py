from rest_framework import serializers
from django.contrib.auth import authenticate
from users.models import User

class AdminLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get('identifier')
        password = data.get('password')

        # Find user by username or email
        user = User.objects.filter(username=identifier).first() or \
               User.objects.filter(email__iexact=identifier).first()

        if not user:
            raise serializers.ValidationError("Invalid credentials.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials.")

        if user.role not in ['admin', 'superadmin', 'audit']:
            raise serializers.ValidationError("Access denied. Admin portal only.")

        if not user.is_active:
            raise serializers.ValidationError("Account is inactive.")

        data['user'] = user
        return data

class TOTPVerifySerializer(serializers.Serializer):
    token = serializers.CharField(max_length=6, min_length=6)
    pre_auth_id = serializers.CharField()
