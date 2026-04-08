import base64
import json
import uuid
from datetime import date, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import Client

from bookings.models import Booking, BookingStatus, LocationChoices
from pandits.models import PanditUser
from payments.models import Payment
from payments.utils import (
    initiate_esewa_payment,
    verify_esewa_payment,
    generate_esewa_signature,
)
from samagri.models import ShopOrder, ShopOrderStatus


def build_encoded_esewa_callback(total_amount, transaction_uuid):
    transaction_code = f"TEST-{uuid.uuid4().hex[:10].upper()}"
    status = "COMPLETE"
    product_code = "EPAYTEST"
    signed_field_names = "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names"

    from django.conf import settings
    secret_key = settings.ESEWA_SECRET_KEY

    message = (
        f"transaction_code={transaction_code},"
        f"status={status},"
        f"total_amount={int(total_amount)},"
        f"transaction_uuid={transaction_uuid},"
        f"product_code={product_code},"
        f"signed_field_names={signed_field_names}"
    )
    signature = generate_esewa_signature(message, secret_key)

    payload = {
        "transaction_code": transaction_code,
        "status": status,
        "total_amount": int(total_amount),
        "transaction_uuid": transaction_uuid,
        "product_code": product_code,
        "signed_field_names": signed_field_names,
        "signature": signature,
    }
    encoded = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
    return encoded, payload


def get_or_create_booking(user, pandit):
    booking = Booking.objects.filter(payment_status=False).order_by("id").first()
    if booking:
        return booking, False

    booking = Booking.objects.create(
        user=user,
        pandit=pandit,
        service=None,
        service_name="eSewa Test Puja",
        service_location=LocationChoices.ONLINE,
        booking_date=date.today(),
        booking_time=time(10, 0),
        status=BookingStatus.PENDING,
        service_fee=Decimal("100.00"),
        samagri_fee=Decimal("0.00"),
        total_fee=Decimal("100.00"),
        total_fee_usd=Decimal("1.00"),
        payment_status=False,
    )
    return booking, True


def run_booking_path(client, user, pandit):
    print("\n=== BOOKING eSewa PATH ===")
    booking, created = get_or_create_booking(user, pandit)
    print(f"Booking used: id={booking.id}, created_now={created}, current_paid={booking.payment_status}")

    payment, _ = Payment.objects.get_or_create(
        booking=booking,
        defaults={
            "user": booking.user,
            "payment_method": "ESEWA",
            "amount_npr": booking.total_fee,
            "amount_usd": booking.total_fee_usd or Decimal("0.00"),
            "amount": booking.total_fee,
            "currency": "NPR",
            "exchange_rate": Decimal("1.0000"),
            "status": "PENDING",
        },
    )

    success, payment_url, form_data, tx_uuid = initiate_esewa_payment(
        amount_npr=booking.total_fee,
        order_id=f"BOOKING-{booking.id}",
        return_url="http://localhost:5173/payment/esewa/verify",
        failure_url="http://localhost:5173/payment/failure",
    )
    print(f"Initiate success={success}, has_form_data={bool(form_data)}, has_url={bool(payment_url)}")

    if not success:
        print(f"Initiate failed message: {payment_url}")
        return

    payment.transaction_id = tx_uuid
    payment.status = "PROCESSING"
    payment.payment_method = "ESEWA"
    payment.save(update_fields=["transaction_id", "status", "payment_method", "updated_at"])

    encoded, payload = build_encoded_esewa_callback(booking.total_fee, tx_uuid)
    util_ok, util_tx, util_details = verify_esewa_payment(encoded)
    print(f"Utility verify success={util_ok}, transaction_code={util_tx}")

    resp = client.get("/api/payments/esewa/verify/", {"data": encoded})
    try:
        body = resp.json()
    except Exception:
        body = resp.content.decode("utf-8")

    booking.refresh_from_db()
    payment.refresh_from_db()

    print(f"API status={resp.status_code}")
    print(f"API body={body}")
    print(
        "Post-state: "
        f"booking.payment_status={booking.payment_status}, "
        f"booking.payment_method={booking.payment_method}, "
        f"payment.status={payment.status}"
    )


def get_or_create_shop_order(user):
    order = ShopOrder.objects.filter(status=ShopOrderStatus.PENDING).order_by("id").first()
    if order:
        return order, False

    order = ShopOrder.objects.create(
        user=user,
        total_amount=Decimal("77.00"),
        status=ShopOrderStatus.PENDING,
        full_name=user.full_name or user.username,
        phone_number="9800000000",
        shipping_address="Kathmandu",
        city="Kathmandu",
        payment_method="ESEWA",
    )
    return order, True


def run_shop_path(client, user):
    print("\n=== SHOP ORDER eSewa PATH ===")
    order, created = get_or_create_shop_order(user)
    print(f"Shop order used: id={order.id}, created_now={created}, current_status={order.status}")

    success, payment_url, form_data, tx_uuid = initiate_esewa_payment(
        amount_npr=order.total_amount,
        order_id=f"SHOP-{order.id}",
        return_url="http://localhost:5173/shop/payment/esewa/verify",
        failure_url=f"http://localhost:5173/shop/payment/cancel?order_id={order.id}",
    )
    print(f"Initiate success={success}, has_form_data={bool(form_data)}, has_url={bool(payment_url)}")

    if not success:
        print(f"Initiate failed message: {payment_url}")
        return

    order.transaction_id = tx_uuid
    order.payment_method = "ESEWA"
    order.save(update_fields=["transaction_id", "payment_method", "updated_at"])

    encoded, payload = build_encoded_esewa_callback(order.total_amount, tx_uuid)
    util_ok, util_tx, util_details = verify_esewa_payment(encoded)
    print(f"Utility verify success={util_ok}, transaction_code={util_tx}")

    resp = client.get("/api/payments/esewa/verify/", {"data": encoded})
    try:
        body = resp.json()
    except Exception:
        body = resp.content.decode("utf-8")

    order.refresh_from_db()

    print(f"API status={resp.status_code}")
    print(f"API body={body}")
    print(f"Post-state: order.status={order.status}, order.transaction_id={order.transaction_id}")


def main():
    User = get_user_model()
    user = User.objects.order_by("id").first()
    pandit = PanditUser.objects.order_by("id").first()

    if not user:
        print("No user exists in DB. Cannot run test.")
        raise SystemExit(1)

    if not pandit:
        print("No pandit exists in DB. Cannot run booking path test.")
        raise SystemExit(1)

    client = Client()

    run_booking_path(client, user, pandit)
    run_shop_path(client, user)

    print("\n=== eSewa path check completed ===")


main()
