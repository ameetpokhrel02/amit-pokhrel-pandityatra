"""
Pytest Configuration for PanditYatra Testing
============================================
Provides fixtures, configuration, and helpers for unit tests.
"""

import os
import django
from django.conf import settings
from decimal import Decimal
import json

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

import pytest
from django.test.utils import setup_test_environment, teardown_test_environment
from django.db import connection
from django.test.db import creation

# Import models for fixtures
from users.models import User
from pandits.models import PanditUser, PanditWallet
from services.models import Puja, PujaCategory
from bookings.models import Booking
from samagri.models import SamagriItem, SamagriCategory
from vendors.models import Vendor


# ========================================
# PYTEST CONFIGURATION
# ========================================

def pytest_configure(config):
    """Configure pytest settings"""
    settings.DEBUG = True
    settings.DATABASES['default']['NAME'] = ':memory:'  # Use in-memory DB for speed
    setup_test_environment()


def pytest_unconfigure(config):
    """Cleanup after pytest"""
    teardown_test_environment()


# ========================================
# FIXTURES
# ========================================

@pytest.fixture(scope='session')
def django_db_setup():
    """Setup test database once per session"""
    pass


@pytest.fixture
def customer_user(db):
    """Fixture: Create a regular customer user"""
    return User.objects.create_user(
        username='customer_test',
        email='customer@test.com',
        password='SecurePass123!',
        full_name='Test Customer',
        phone_number='9841234567',
        role='user'
    )


@pytest.fixture
def pandit_user_with_wallet(db):
    """Fixture: Create pandit user with wallet"""
    pandit_user = User.objects.create_user(
        username='pandit_test',
        email='pandit@test.com',
        password='SecurePass123!',
        full_name='Test Pandit',
        role='pandit'
    )
    pandit = PanditUser.objects.create(
        user=pandit_user,
        experience_years=5,
        expertise='Vivah Sanskar, Yagya',
        is_verified=True
    )
    wallet = PanditWallet.objects.create(
        pandit=pandit,
        total_earned=Decimal('0'),
        available_balance=Decimal('0'),
        total_withdrawn=Decimal('0')
    )
    return pandit_user, pandit, wallet


@pytest.fixture
def vendor_user(db):
    """Fixture: Create vendor user"""
    vendor_user = User.objects.create_user(
        username='vendor_test',
        email='vendor@test.com',
        password='SecurePass123!',
        full_name='Test Vendor',
        role='vendor'
    )
    vendor = Vendor.objects.create(
        user=vendor_user,
        shop_name='Sacred Items Shop',
        business_type='samagri',
        is_verified=False
    )
    return vendor_user, vendor


@pytest.fixture
def admin_user(db):
    """Fixture: Create admin user"""
    return User.objects.create_user(
        username='admin_test',
        email='admin@test.com',
        password='SecurePass123!',
        full_name='Test Admin',
        role='admin',
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def puja_service(db):
    """Fixture: Create a puja service"""
    category = PujaCategory.objects.create(
        name='Wedding',
        slug='wedding',
        description='Wedding rituals'
    )
    puja = Puja.objects.create(
        category=category,
        name='Vivah Sanskar',
        description='Sacred marriage ritual',
        base_duration_minutes=120,
        base_price_npr=Decimal('5000'),
        base_price_usd=Decimal('50')
    )
    return puja


@pytest.fixture
def samagri_items(db, vendor_user):
    """Fixture: Create samagri items"""
    vendor_user_obj, vendor_obj = vendor_user

    category = SamagriCategory.objects.create(
        name='Incense',
        slug='incense'
    )

    items = [
        SamagriItem.objects.create(
            category=category,
            vendor=vendor_obj,
            name='Loban Incense',
            price_npr=Decimal('500'),
            price_usd=Decimal('5'),
            stock_quantity=100,
            is_active=True
        ),
        SamagriItem.objects.create(
            category=category,
            vendor=vendor_obj,
            name='Sandalwood Incense',
            price_npr=Decimal('800'),
            price_usd=Decimal('8'),
            stock_quantity=50,
            is_active=True
        ),
    ]
    return items


@pytest.fixture
def sample_booking(db, customer_user, pandit_user_with_wallet, puja_service):
    """Fixture: Create a sample booking"""
    _, pandit_obj, _ = pandit_user_with_wallet

    booking = Booking.objects.create(
        user=customer_user,
        pandit=pandit_obj,
        service=puja_service,
        booking_date='2026-04-10',
        booking_time='10:00:00',
        service_location='HOME',
        status='PENDING',
        service_fee_npr=Decimal('5000'),
        service_fee_usd=Decimal('50')
    )
    return booking


# ========================================
# MARKERS (for test categorization)
# ========================================

def pytest_configure(config):
    """Register custom markers"""
    config.addinivalue_line("markers", "fast: quick tests")
    config.addinivalue_line("markers", "slow: slow tests that require DB")
    config.addinivalue_line("markers", "unit: unit tests")
    config.addinivalue_line("markers", "integration: integration tests")
    config.addinivalue_line("markers", "api: API endpoint tests")
    config.addinivalue_line("markers", "security: security & authorization tests")
    config.addinivalue_line("markers", "payment: payment processing tests")
    config.addinivalue_line("markers", "booking: booking workflow tests")


# ========================================
# HOOKS
# ========================================

@pytest.hookimpl(tryfirst=True)
def pytest_runtest_makereport(item, call):
    """Log test execution details"""
    if call.when == "call":
        # Add custom reporting here
        pass


# ========================================
# UTILITIES
# ========================================

class APIClientHelper:
    """Helper class for API testing"""

    @staticmethod
    def create_auth_headers(user):
        """Create JWT auth headers for user"""
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        return {
            'Authorization': f'Bearer {str(refresh.access_token)}'
        }

    @staticmethod
    def assert_response_status(response, expected_status):
        """Assert response has expected status code"""
        assert response.status_code == expected_status, \
            f"Expected {expected_status}, got {response.status_code}. Response: {response.data}"

    @staticmethod
    def assert_response_contains(response, *keys):
        """Assert response contains specified keys"""
        for key in keys:
            assert key in response.data, \
                f"Key '{key}' not found in response. Keys: {list(response.data.keys())}"


@pytest.fixture
def api_helper():
    """Fixture: Provide API helper utilities"""
    return APIClientHelper()


# ========================================
# TEST GROUPS
# ========================================

@pytest.fixture(scope='session')
def test_group():
    """Group tests for reporting"""
    return {
        'authentication': [],
        'booking': [],
        'payment': [],
        'verification': [],
        'recommendations': [],
        'video': [],
        'review': [],
        'admin': [],
        'vendor': [],
        'security': []
    }

