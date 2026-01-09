"""
Payment URLs
"""
from django.urls import path, include
from . import views
from payments.webhooks.stripe import stripe_webhook
from payments.webhooks.khalti import khalti_webhook

urlpatterns = [
    # Payment initiation
    path("webhooks/stripe/", stripe_webhook),
    path("webhooks/khalti/", khalti_webhook),
]
