"""
Payment URLs
"""
from django.urls import path, include
from . import views
from payments.webhooks.stripe import stripe_webhook
from payments.webhooks.khalti import khalti_webhook

urlpatterns = [
    # Payment initiation
    path("initiate/", views.CreatePaymentIntentView.as_view(), name="payment-initiate"),
    path("check-status/<int:booking_id>/", views.GetPaymentStatusView.as_view(), name="check-status"),
    
    path("webhooks/stripe/", stripe_webhook),
    path("webhooks/khalti/", khalti_webhook),
    path("admin/", views.admin_payments),
    path("admin/payouts/", views.admin_payouts), # 🆕 List Pandits & Balances
    path("admin/withdrawals/", views.admin_withdrawal_requests), # 🆕 List Requests
    path("admin/withdrawals/<int:id>/approve/", views.approve_withdrawal), # 🆕 Action
    path("<int:payment_id>/refund/", views.refund_payment),
    
    # Verify
    path("khalti/verify/", views.KhaltiVerifyView.as_view()),
]
