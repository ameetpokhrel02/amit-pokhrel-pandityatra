"""
Payment URLs
"""
from django.urls import path
from . import views

urlpatterns = [
    # Payment initiation
    path('create/', views.CreatePaymentIntentView.as_view(), name='create-payment'),
    
    # Webhooks
    path('webhook/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    
    # Khalti verification
    path('khalti/verify/', views.KhaltiVerifyView.as_view(), name='khalti-verify'),
    
    # Payment status
    path('status/<int:booking_id>/', views.GetPaymentStatusView.as_view(), name='payment-status'),
    
    # Exchange rate
    path('exchange-rate/', views.ExchangeRateView.as_view(), name='exchange-rate'),
]
