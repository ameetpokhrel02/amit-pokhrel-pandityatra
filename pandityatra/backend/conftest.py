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
# from django.test.db import creation (Invalid and unused)

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
    try:
        from django.test.utils import _TestState
        if hasattr(_TestState, 'saved_data'):
            teardown_test_environment()
    except Exception:
        pass


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
    import random, string
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return User.objects.create_user(
        username=f'customer_test_{suffix}',
        email=f'customer_{suffix}@test.com',
        password='SecurePass123!',
        full_name='Test Customer',
        phone_number=f'9841234{random.randint(100,999)}',
        role='user'
    )

    
@pytest.fixture
def pandit_user_with_wallet(db):
    """Fixture: Create pandit user with wallet using Multi-table Inheritance"""
    import random, string
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    
    # PanditUser INHERITS from User, so we create it directly
    pandit = PanditUser.objects.create_user(
        username=f'pandit_test_{suffix}',
        email=f'pandit_{suffix}@test.com',
        password='SecurePass123!',
        full_name='Test Pandit',
        role='pandit',
        expertise='Vivah Sanskar, Yagya',
        language='Hindi, Sanskrit',
        experience_years=5,
        is_verified=True,
        verification_status='APPROVED'
    )
    
    wallet, _ = PanditWallet.objects.get_or_create(
        pandit=pandit,
        defaults={
            'total_earned': Decimal('0'),
            'available_balance': Decimal('0'),
            'total_withdrawn': Decimal('0')
        }
    )
    return pandit, pandit, wallet # Return (user, pandit, wallet) - here user IS pandit


@pytest.fixture
def vendor_user(db):
    """Fixture: Create vendor user"""
    import random, string
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    vendor_user = User.objects.create_user(
        username=f'vendor_test_{suffix}',
        email=f'vendor_{suffix}@test.com',
        password='SecurePass123!',
        full_name='Test Vendor',
        role='vendor'
    )
    vendor = Vendor.objects.create(
        user=vendor_user,
        shop_name='Sacred Items Shop',
        business_type='samagri',
        address='123 Temple Road',
        city='Kathmandu',
        bank_name='Nepal Bank',
        bank_account_number='123456789',
        account_holder_name='Test Vendor',
        is_verified=False
    )
    return vendor_user, vendor


@pytest.fixture
def admin_user(db):
    """Fixture: Create admin user"""
    import random, string
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return User.objects.create_user(
        username=f'admin_test_{suffix}',
        email=f'admin_{suffix}@test.com',
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
        base_price=Decimal('5000'),
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
            price=Decimal('500'),
            price_usd=Decimal('5'),
            stock_quantity=100,
            is_active=True
        ),
        SamagriItem.objects.create(
            category=category,
            vendor=vendor_obj,
            name='Sandalwood Incense',
            price=Decimal('800'),
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
        data = response.data if hasattr(response, 'data') else {}
        for key in keys:
            assert key in data, \
                f"Key '{key}' not found in response. Keys: {list(data.keys())}"


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

