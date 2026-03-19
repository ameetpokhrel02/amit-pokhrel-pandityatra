# PanditYatra — Final Unified Project Documentation

_Last updated: 2026-03-19_

## 1) Project Overview
PanditYatra is a full-stack spiritual services platform that connects devotees (customers) with verified pandits for puja services, online consultations, samagri shopping, AI guidance, real-time messaging, and live video sessions.

It is built as an API-first system with role-based access for:
- Customer (`user`)
- Pandit (`pandit`)
- Admin (`admin`)
- Superadmin (`superadmin`)

---

## 2) Core Product Features (Complete)

### A. Authentication & User Management
- Customer registration/login (OTP and password)
- Google login
- Forgot password with OTP verification
- JWT access + refresh token flow
- Profile view/update/delete
- Contact form support
- Role-based route and API access

### B. Pandit Onboarding & Operations
- Pandit registration with profile/certification
- Verification workflow (pending/approved/rejected)
- Pandit dashboard with live stats
- Availability toggle (online/offline for accepting bookings)
- Personal service catalog with custom pricing and duration
- Calendar availability block management
- Wallet, withdrawal request, and payout visibility

### C. Booking Lifecycle
- Customer creates booking for selected pandit/service
- Date/time and location mode (`ONLINE`, `HOME`, `TEMPLE`, `PANDIT_LOCATION`)
- Booking statuses: `PENDING`, `ACCEPTED`, `COMPLETED`, `CANCELLED`, `FAILED`
- Booking cancellation and status updates
- Invoice generation and download
- Booking-linked samagri recommendation workflow

### D. Payments (Multi-Gateway)
- Stripe integration
- Khalti integration
- eSewa integration
- Payment initiation + verification callbacks
- Booking payment-status synchronization
- Admin payment and payout monitoring
- Refund path support

### E. Samagri / Shop / Wishlist
- Samagri categories, items, and puja requirements
- AI-assisted recommendation endpoint
- Wishlist add/remove/check/toggle
- Checkout initiation and order history
- Order detail and invoice download

### F. AI Features
- AI guide chat endpoint (`/api/ai/chat/`)
- Tool-augmented orchestration (search samagri, recommend puja samagri, find pandits, booking status, how-to-book guidance, switch-to-realtime action)
- Dedicated puja-samagri AI endpoint (`/api/ai/puja-samagri/`)
- AI query logging and trace IDs
- Legacy quick-chat fallback endpoint in chat module

### G. Real-Time Chat
Two real-time chat styles exist:

1. **Pandit-Customer room chat**
   - WebSocket: `/ws/chat/{room_id}/`
   - DB models: `ChatRoom` + `Message`
   - Access control: only room customer and assigned pandit
   - Message history and read states

2. **Live interaction message stream for puja sessions**
   - WebSocket: `/ws/puja/{booking_id}/`
   - DB model: `ChatMessage` (`mode=interaction`)
   - Message history and join/leave events

### H. Video Calling (WebRTC + Signaling)
- WebRTC-based video room experience in frontend
- Signaling WebSocket: `/ws/video/{room_id}/`
- SDP/ICE exchange (`offer`, `answer`, `ice-candidate`)
- Participant join/leave events
- In-room text chat over same signaling channel (`type: chat`)
- Recording start/stop/upload flow
- Access validation by booking relationship and payment/time window rules
- Daily compatibility endpoints retained for backward support

### I. Kundali + Panchang
- Kundali generation endpoint (`/api/kundali/generate/`)
- Kundali list/history and public stats
- Offline-first kundali fallback in frontend
- Panchang daily data endpoint (`/api/panchang/data/`)

### J. Reviews & Ratings
- Booking-linked review creation
- Pandit review feed
- Site review list/create
- Customer own reviews and pandit-received review list
- Admin review moderation view

### K. Notifications
- Notification CRUD/list via API
- Mark-read flows and read-state patterns
- Real-time notification consumer support in chat consumers

### L. Admin & Superadmin Governance
- Admin dashboard and system monitoring views
- User management (list, toggle status, delete)
- Pandit verification and all pandit listing
- Payment/payout/withdrawal control
- Activity and error log views
- Site content management (CMS blocks)
- Superadmin-level admin account management

### M. PWA & Frontend Platform
- Installable PWA support
- Service worker registration in production
- Offline UX considerations for kundali and selected modules
- Global floating unified chat widget

---

## 3) Libraries & Frameworks Used

## 3.1 Backend (Python / Django)
- `Django`
- `djangorestframework`
- `djangorestframework-simplejwt`
- `drf-spectacular`
- `channels`, `daphne`, `channels-redis`
- `psycopg2-binary`
- `dj-database-url`
- `python-dotenv`
- `django-cors-headers`
- `Pillow`
- `requests`
- `stripe`
- `groq`
- `openai` (legacy/compatibility paths)
- `pyswisseph`
- `nepali-datetime`
- `reportlab`
- `django-allauth`, `dj-rest-auth`
- `gunicorn`, `whitenoise`

## 3.2 Frontend (React / TypeScript)
- `react`, `react-dom`, `typescript`, `vite`
- `react-router-dom`
- `axios`
- `tailwindcss`, `@tailwindcss/vite`, `tailwindcss-animate`
- `@radix-ui/*` UI primitives
- `framer-motion`
- `lucide-react`, `react-icons`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- `@react-oauth/google`
- `@stripe/react-stripe-js`, `@stripe/stripe-js`
- `@daily-co/daily-react` (compatibility dependency)
- `leaflet`, `react-leaflet`
- `@fullcalendar/*`
- `i18next`, `react-i18next`
- `recharts`, `d3-scale`, `d3-shape`
- `@react-pdf/renderer`
- `vite-plugin-pwa`

## 3.3 Infrastructure / Runtime
- PostgreSQL
- Redis
- Docker + Docker Compose
- pgAdmin + Adminer (local admin tools)

---

## 4) End-to-End Flows by Role

## 4.1 Customer (`user`) Flow
1. Register/login (OTP/password/Google).
2. Browse pandits and services.
3. Open pandit profile and choose service.
4. Create booking (date/time/location/notes).
5. Pay through Stripe/Khalti/eSewa.
6. Track booking status in dashboard.
7. Use:
   - AI Guide for help and recommendations
   - Direct chat with pandit (pre-booking or booking-linked)
   - Live video room for online puja (WebRTC)
8. Submit review and view invoice/history.
9. Shop samagri/books and place checkout orders.
10. Generate kundali (online/offline fallback) and review panchang.

## 4.2 Pandit (`pandit`) Flow
1. Register as pandit and submit profile/certification.
2. Await admin verification.
3. After approval:
   - Manage service offerings and prices
   - Set availability and calendar blocks
   - Receive and manage bookings
   - Chat with customers
   - Join live video puja rooms
   - Track wallet/earnings and withdrawal requests
   - View received reviews and profile metrics

## 4.3 Admin (`admin`) Flow
1. Login to admin dashboard.
2. Monitor platform KPIs and operational logs.
3. Verify/reject pending pandits.
4. Manage users (status control, delete, oversight).
5. Review bookings and resolve exceptional cases.
6. Manage payments, withdrawal approvals, and payout actions.
7. Moderate reviews and site content.
8. Access activity/error logs for operational reliability.

## 4.4 Superadmin (`superadmin`) Flow
1. Perform all admin-level functions.
2. Manage admin accounts (create/update/delete).
3. Control top-level governance and platform administration.

---

## 5) Real-Time + AI + Video Technical Flow

## 5.1 AI Guide Flow
1. Frontend sends user prompt to `/api/ai/chat/`.
2. Backend orchestrator builds context + tool specs.
3. LLM chooses tools when needed (product/pandit/booking actions).
4. Tool router executes backend-safe functions.
5. Response returns text + cards/actions (e.g., add-to-cart, switch-mode suggestion).
6. Frontend widget renders message and actions.

## 5.2 Room Chat Flow (`/ws/chat/{room_id}/`)
1. Frontend opens WebSocket with JWT token in query.
2. JWT middleware authenticates socket user.
3. Consumer verifies room access.
4. Recent messages are pushed as history.
5. New message is persisted and broadcast in real time.
6. Notification service triggers recipient notification.

## 5.3 Live Video + WebRTC Flow (`/ws/video/{room_id}/`)
1. Frontend resolves room + validates access via REST.
2. Local camera/mic stream starts.
3. Frontend connects signaling socket.
4. Participants exchange `join` -> `offer/answer` -> `ice-candidate`.
5. `RTCPeerConnection` establishes P2P media channels.
6. In-room chat messages use signaling channel (`type=chat`) and persist to chat model.
7. Optional recording uploads to backend; booking/recording metadata updated.

---

## 6) Major API Domains
- `/api/users/*` → auth, profile, admin user controls
- `/api/pandits/*` → pandit registry, services, dashboard, wallet, admin verification
- `/api/services/*` → puja catalog and categories
- `/api/bookings/*` → booking lifecycle + invoice
- `/api/payments/*` → gateway initiation/verification/admin payout/refund
- `/api/samagri/*` → catalog, requirements, checkout, wishlist
- `/api/recommender/*` → recommendation engine + booking samagri flows
- `/api/chat/*` → chat rooms/messages/quick-chat/history
- `/api/ai/*` → orchestrated AI guide and puja samagri intelligence
- `/api/video/*` → room control/token/validation/recording endpoints
- `/api/kundali/*` → generate/list/public stats
- `/api/panchang/*` → daily panchang data
- `/api/reviews/*` → reviews
- `/api/notifications/*` → notifications
- `/api/admin/*` + app admin endpoints → analytics/logs/governance

---

## 7) Security and Access Controls
- JWT for protected API endpoints
- WebSocket JWT auth middleware
- Role-based frontend route protection
- Role-aware backend permissions on sensitive operations
- Booking/room ownership checks for chat/video access
- Payment verification before online puja room usage

---

## 8) Deployment/Run Model (Current)
- Docker Compose stack includes:
  - Backend (Daphne ASGI)
  - PostgreSQL
  - Redis
  - Video reminder worker
  - pgAdmin/Adminer
- Frontend runs via Vite (dev) and supports PWA build mode

---

## 9) Current Strengths
- Broad feature coverage across booking, payments, AI, chat, video, and commerce
- Strong role separation (customer/pandit/admin/superadmin)
- Real-time communication support via Channels + Redis
- Flexible Nepal-focused payment options
- Offline-friendly kundali and PWA support
- API-first architecture suitable for web + mobile clients

---

## 10) Practical Improvement Opportunities
1. Expand automated integration tests (especially payment callbacks and WebRTC edge cases).
2. Standardize chat mode usage and naming across all consumers/widgets.
3. Add stronger observability (centralized logs, metrics, alerting).
4. Add rate limits and abuse controls for AI and chat endpoints.
5. Add richer moderation and fraud/risk detection workflows.

---

## 11) Final Conclusion
PanditYatra is a complete, production-oriented final-year platform with full customer-to-pandit lifecycle coverage: onboarding, booking, payment, AI guidance, real-time chat, and WebRTC-based live puja experience. The system is modular, scalable for future improvements, and already aligned for both web and mobile consumption.

**Final Documentation Status:** Completed as one consolidated master document.