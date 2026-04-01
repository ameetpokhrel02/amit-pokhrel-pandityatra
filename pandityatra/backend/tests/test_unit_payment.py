from django.test import SimpleTestCase
from unittest.mock import MagicMock
from payments.services import initiate_payment_logic


class PaymentUnitTests(SimpleTestCase):
    """
    Pure unit tests for payment logic
    - No database
    - No APIClient
    - No real external calls
    """

    def setUp(self):
        # Fake booking object (no DB)
        self.fake_booking = MagicMock()
        self.fake_booking.id = 1
        self.fake_booking.total_fee = 100

    def test_initiate_payment_esewa_success(self):
        """Unit test: successful eSewa payment initiation"""

        # Mock eSewa function
        mock_esewa = MagicMock()
        mock_esewa.return_value = (
            True,
            'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
            {'amount': '100', 'product_code': 'EPAYTEST'},
            'test-uuid-123'
        )

        result = initiate_payment_logic(
            booking=self.fake_booking,
            gateway='ESEWA',
            esewa_func=mock_esewa
        )

        # Assertions
        self.assertTrue(result['success'])
        self.assertEqual(result['gateway'], 'ESEWA')
        self.assertEqual(result['uuid'], 'test-uuid-123')
        self.assertIn('url', result)
        self.assertIn('data', result)

        # Ensure mock was called
        mock_esewa.assert_called_once_with(self.fake_booking)

    def test_initiate_payment_invalid_gateway(self):
        """Unit test: unsupported gateway should fail"""

        mock_esewa = MagicMock()

        with self.assertRaises(ValueError):
            initiate_payment_logic(
                booking=self.fake_booking,
                gateway='INVALID',
                esewa_func=mock_esewa
            )