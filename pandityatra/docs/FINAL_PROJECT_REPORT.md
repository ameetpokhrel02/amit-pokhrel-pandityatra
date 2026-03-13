# PanditYatra Final Project Report

## 1) Introduction
PanditYatra is a full-stack spiritual services platform that connects users with verified pandits for puja booking, online consultation, kundali generation, e-commerce (samagri/books), and secure payment flows. The platform is designed for real-world deployment with role-based administration, payment verification, notification workflows, and mobile/PWA readiness.

This report summarizes project goals, completed features, technical architecture, how the system works end-to-end, operational status, and final delivery readiness.

---

## 2) Project Objectives
1. Build a reliable marketplace for spiritual services with customer and pandit workflows.
2. Provide secure booking lifecycle management from request to completion.
3. Integrate multiple payment options with callback verification and status reconciliation.
4. Deliver offline-first Kundali generation as a key differentiator (including PWA use).
5. Enable robust admin/superadmin governance and platform operations.
6. Support scalable API-first architecture for web and React Native reuse.
7. Ensure maintainability through structured modules and documentation.

---

## 3) Scope Delivered (Final)
### Core Product Areas
- Authentication and role management (user, pandit, admin, superadmin)
- Pandit onboarding, verification, profile and services
- Booking engine (create, accept, update, cancel, invoice)
- Payment system (eSewa, Khalti, Stripe paths and verification)
- Shop (samagri categories/items, cart, checkout, orders, invoices)
- Reviews and ratings (pandit reviews + site reviews)
- Notifications and activity logging
- Kundali generation (online + offline fallback)
- PWA installation and offline-capable usage flows
- Admin analytics and moderation surfaces

### Delivery Model
- Backend: Django + Django REST Framework
- Frontend: React + TypeScript + Vite
- Infra: Docker-based local environment
- Data: PostgreSQL
- Real-time/async support where applicable

---

## 4) Key Features (Final List)

## 4.1 Authentication & Access Control
- OTP/password/social login support paths
- JWT-based API security
- Role-based route protection on frontend and backend
- Superadmin-admin separation for governance

## 4.2 Pandit Management
- Pandit registration and profile maintenance
- Verification workflow (pending/approved/rejected)
- Service metadata (expertise, language, pricing, online/offline mode)
- Dashboard and booking visibility for pandits

## 4.3 Booking Lifecycle
- Customer booking creation and tracking
- Pandit and admin status updates
- Cancellation handling (including admin cancellation flows)
- Booking invoice generation and download

## 4.4 Payments (Hardened)
- eSewa sandbox-compatible transaction flow
  - Initiate → redirect → callback verify → mark paid
- Verification hardening and callback reliability
- Payment status visibility (admin/pandit/customer)
- Shop and booking payment path support

## 4.5 Shop / Samagri
- Product catalog, category handling, and checkout
- User order history and detail view
- Shop invoice generation
- Payment method integration in checkout pipeline

## 4.6 Reviews & Ratings
- Booking-linked pandit reviews
- Site review submission and approval model
- Rating aggregation for landing and dashboards

## 4.7 Offline-First Kundali (Flagship)
- Online mode: server-assisted generation and persistence
- Offline mode: local computation fallback when internet fails/unavailable
- PWA-ready behavior to support offline usage on installed app
- Save-to-cloud when online/authenticated

## 4.8 Notifications & Reliability
- Notification retrieval and mark-read flows
- Frontend polling hardened against 401 loops
- Better stale-auth handling to avoid repeated unauthorized calls

---

## 5) How the System Works (End-to-End)

## 5.1 Booking + Payment Flow
1. Customer selects pandit/service and creates booking.
2. System creates pending booking and payable amount.
3. User chooses payment gateway.
4. Gateway callback hits verification endpoint.
5. Backend validates callback/signature/transaction context.
6. Payment status updated; booking/order marked paid.
7. Invoice and status surfaces update for customer, pandit, and admin.

## 5.2 Shop Order Flow
1. Customer adds items and checks out.
2. Order is created with payment intent.
3. Payment callback verifies transaction.
4. Order status transitions to paid and proceeds for fulfillment.

## 5.3 Offline Kundali Flow
1. User opens Kundali page (works in app/PWA route).
2. If online + authenticated, system can generate and save cloud record.
3. If offline or online call fails, local astronomy computation generates chart.
4. User still receives result and PDF-style output path.
5. If offline chart generated while online, user can save to dashboard manually.

---

## 6) Architecture Overview

## 6.1 Backend (Django/DRF)
- Modular apps for bookings, payments, reviews, samagri, kundali, users, pandits, notifications, adminpanel, etc.
- REST API routing under /api/* prefixes.
- Business logic split across serializers, views, and utility modules.

## 6.2 Frontend (React/Vite)
- Route-driven SPA with role-protected pages
- Shared API client with token handling and interceptors
- Dedicated pages for auth, booking, payment verify, shop, kundali, dashboards
- PWA integration via Vite plugin and service worker registration

## 6.3 Environment
- Docker-compose based runtime for backend services
- Migration-first database evolution
- Static/media handling configured in Django settings

---

## 7) Security, Validation, and Data Integrity

- JWT auth for protected APIs
- Permission classes for role-sensitive operations
- Payment verification checks and callback-safe endpoint behavior
- Idempotent-safe handling for repeated callback scenarios
- Activity logging and operational traceability in admin modules

---

## 8) Testing and Validation Summary

- Feature validation performed across booking, payment, and shop pathways
- eSewa booking and shop verify flows validated in Docker runtime
- Migration status verified and applied
- Frontend behavior fixes validated for auth/notification handling
- Endpoint inventory prepared for React Native reuse

---

## 9) Documentation Inventory (Complete)

### 9.1 Core Technical & Delivery Docs

- AI_RECOMMENDER_GUIDE.md
- AI_RECOMMENDER_TESTING.md
- AUDIT_CHECKLIST.md
- AUTHENTICATION_STATUS.md
- BOOKING_SYSTEM_COMPLETE.md
- BUILD_FIXES_SUMMARY.md
- CHATBOT_README.md
- COMPLETION_SUMMARY.md
- CUSTOMER_DASHBOARD_FIXES.md
- DATABASE_BACKEND_AUDIT.md
- DATABASE_ENHANCEMENTS.md
- DOCKER_STATUS.md
- DUAL_MODE_CHATBOT_CHECKLIST.md
- DUAL_MODE_CHATBOT_DOCUMENTATION.md
- DUAL_MODE_CHATBOT_USAGE_GUIDE.md
- ENHANCEMENT_IMPLEMENTATION_SUMMARY.md
- FEATURES_COMPLETED.md
- FULL_CHECKLIST.md
- IMPLEMENTATION_SUMMARY.md
- PANDIT_CALENDAR_README.md
- PANDIT_VERIFICATION_IMPLEMENTATION.md
- PAYMENT_SETUP.md
- PHASE1_COMPLETE_LIST.md
- PHASE1_DELIVERY.md
- PHASE2_DOCUMENTATION_INDEX.md
- PHASE2_IMPLEMENTATION_STATUS.md
- PROJECT_ANALYSIS.md
- QUICK_REFERENCE.md
- README_DOCUMENTATION_INDEX.md
- START_HERE.md
- SYSTEM_STATUS_REPORT.md
- TESTING_GUIDE.md
- VISUAL_SUMMARY.md

### 9.2 Supporting Reference Assets

- API.pdf
- FYP Screens.pdf
- PanditYatra Proposal.pdf
- PanditYatra_FYP gant chart diagram copy.pdf
- Survey Result.pdf
- auth flow.pdf
- review .pdf
- user story flow.pdf

### 9.3 Diagram/Script Directories

- diagrams/
- payment script/

This final report is the consolidated closure document that connects all above materials into one executive + technical overview.

---

## 10) Current Final Status

- Core scope implemented
- Major production blockers addressed in payment and auth polling areas
- Offline Kundali behavior aligned with dual-mode requirement
- Admin + pandit + customer visibility requirements implemented for payment state
- System is in a deployable and extensible state

---

## 11) Known Constraints / Practical Notes

- Fully offline operation depends on previously cached PWA assets and browser policy.
- Gateway integrations require correct environment credentials/origin/callback URLs.
- Some advanced analytics and scaling concerns can be enhanced in future phases.

---

## 12) Recommended Next Enhancements

1. Add local IndexedDB history for offline-generated kundali when unauthenticated.
2. Add unified metrics dashboard (payments/bookings/conversion).
3. Expand automated integration tests for callback/payment edge cases.
4. Add observability stack (central logs, tracing, alerting).
5. Extend multilingual content pipeline across all UX components.

---

## 13) Conclusion

PanditYatra has been delivered as a robust, modular platform with real operational features across booking, payments, commerce, kundali, role-based governance, and offline-capable PWA behavior. The implementation meets the stated objective of a practical, user-facing final-year product while preserving extensibility for future production-scale growth.


**Report Date:** March 13, 2026
**Project:** PanditYatra
**Document Type:** Final Consolidated Project Report
