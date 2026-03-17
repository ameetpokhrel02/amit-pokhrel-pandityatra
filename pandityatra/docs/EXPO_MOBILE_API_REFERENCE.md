# React Native Mobile API Reference

This document lists the **non-admin APIs** for the PanditYatra mobile app.

- Base REST URL: `http://<host>:8000/api`
- Base WebSocket URL: `ws://<host>:8000/ws`
- Auth for protected REST APIs: `Authorization: Bearer <access_token>`
- Admin-only APIs are intentionally excluded from this mobile reference

## Base Rules

### Auth

- **Public** = no token required
- **Auth** = JWT access token required
- **Pandit Auth** = logged-in pandit account required

### Content Types

- `application/json` → default for most `POST`, `PATCH`, and `PUT` endpoints
- `multipart/form-data` → use when uploading files/images/recordings
- `query params` → use on `GET` endpoints with filters
- `none` → no request body needed

### Mobile File URLs

- Uploaded files are served from `/media/...`
- Example: `http://<host>:8000/media/samagri_images/Haldi.png`

## Auth and User

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/users/register/` | Public | `application/json` | Register a user/customer account |
| POST | `/api/users/request-otp/` | Public | `application/json` | Request OTP by `phone_number` or `email` |
| POST | `/api/users/login-otp/` | Public | `application/json` | Verify OTP and return `access` + `refresh` |
| POST | `/api/users/login-password/` | Public | `application/json` | Login with `phone_number`, `email`, or `username` plus `password` |
| POST | `/api/users/google-login/` | Public | `application/json` | Login/signup with Google `id_token` |
| POST | `/api/users/forgot-password/` | Public | `application/json` | Request password reset OTP |
| POST | `/api/users/forgot-password/verify-otp/` | Public | `application/json` | Verify password reset OTP |
| POST | `/api/users/forgot-password/reset/` | Public | `application/json` | Reset password |
| GET | `/api/users/site-content/` | Public | `none` | Public CMS/site content |
| POST | `/api/users/contact/` | Public | `application/json` | Submit contact/support form |
| GET | `/api/users/profile/` | Auth | `none` | Get current user profile |
| PATCH | `/api/users/profile/` | Auth | `application/json` or `multipart/form-data` | Update profile fields and optional `profile_pic` |
| PUT | `/api/users/profile/` | Auth | `application/json` or `multipart/form-data` | Replace profile fields |
| DELETE | `/api/users/profile/` | Auth | `none` | Delete current account |
| POST | `/api/token/` | Public | `application/json` | Standard JWT obtain pair |
| POST | `/api/token/refresh/` | Public | `application/json` | Refresh access token |

## Pandits

### Public / Customer-facing

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/pandits/` | Public | `query params` | List pandits |
| GET | `/api/pandits/{pandit_id}/` | Public | `none` | Get pandit summary |
| GET | `/api/pandits/{pandit_id}/profile/` | Public | `none` | Get full pandit profile |
| GET | `/api/pandits/services/catalog/` | Public | `none` | Get puja catalog for pandit workflows |
| POST | `/api/pandits/register/` | Public or Auth | `multipart/form-data` | Register pandit profile with `certification_file` |

### Pandit Self-service

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/pandits/dashboard/stats/` | Pandit Auth | `none` | Dashboard stats |
| POST | `/api/pandits/dashboard/toggle-availability/` | Pandit Auth | `application/json` | Toggle online/offline availability |
| GET | `/api/pandits/me/calendar/` | Pandit Auth | `none` | Get bookings + blocked times |
| POST | `/api/pandits/me/calendar/` | Pandit Auth | `application/json` | Create availability/unavailability block |
| DELETE | `/api/pandits/me/calendar/blocks/{block_id}/` | Pandit Auth | `none` | Delete availability block |
| GET | `/api/pandits/wallet/` | Pandit Auth | `none` | Wallet totals |
| GET | `/api/pandits/withdrawals/` | Pandit Auth | `none` | Withdrawal history |
| POST | `/api/pandits/withdrawal/request/` | Pandit Auth | `application/json` | Request payout |

### Pandit Profile CRUD

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/pandits/{pandit_id}/` | Public | `none` | Retrieve pandit profile |
| PUT | `/api/pandits/{pandit_id}/` | Auth | `application/json` or `multipart/form-data` | Update pandit profile |
| PATCH | `/api/pandits/{pandit_id}/` | Auth | `application/json` or `multipart/form-data` | Partial update pandit profile |
| DELETE | `/api/pandits/{pandit_id}/` | Auth | `none` | Delete own pandit profile |

### Pandit Services

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/pandits/my-services/` | Pandit Auth | `none` | List offered services |
| POST | `/api/pandits/my-services/` | Pandit Auth | `application/json` | Add a service/puja |
| GET | `/api/pandits/my-services/{id}/` | Pandit Auth | `none` | Get service mapping |
| PUT | `/api/pandits/my-services/{id}/` | Pandit Auth | `application/json` | Replace service mapping |
| PATCH | `/api/pandits/my-services/{id}/` | Pandit Auth | `application/json` | Update service mapping |
| DELETE | `/api/pandits/my-services/{id}/` | Pandit Auth | `none` | Remove service mapping |

## Services / Puja Catalog

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/services/categories/` | Public | `none` | List puja categories |
| GET | `/api/services/` | Public | `query params` | List pujas/services |
| GET | `/api/services/{id}/` | Public | `none` | Get puja detail |

## Bookings

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/bookings/` | Auth | `query params` | List bookings visible to current user |
| POST | `/api/bookings/` | Auth | `application/json` | Create booking |
| GET | `/api/bookings/{id}/` | Auth | `none` | Booking detail |
| PUT | `/api/bookings/{id}/` | Auth | `application/json` | Replace booking if allowed |
| PATCH | `/api/bookings/{id}/` | Auth | `application/json` | Partial update if allowed |
| DELETE | `/api/bookings/{id}/` | Auth | `none` | Delete booking if allowed |
| PATCH | `/api/bookings/{id}/update_status/` | Pandit Auth | `application/json` | Accept/complete/cancel booking as pandit |
| PATCH | `/api/bookings/{id}/cancel/` | Auth | `application/json` | Cancel own pending booking as customer |
| GET | `/api/bookings/my_bookings/` | Auth | `none` | Shortcut for user bookings |
| GET | `/api/bookings/available_slots/?pandit_id={id}&date=YYYY-MM-DD&service_id={id}` | Auth | `query params` | Get available booking slots |
| GET | `/api/bookings/{id}/invoice/` | Auth | `none` | Download booking invoice PDF |

## Samagri / Shop

### Public Catalog

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/samagri/categories/` | Public | `none` | List samagri categories |
| GET | `/api/samagri/categories/{id}/` | Public | `none` | Category detail |
| GET | `/api/samagri/items/` | Public | `query params` | List samagri items, supports `?category=` |
| GET | `/api/samagri/items/{id}/` | Public | `none` | Samagri item detail |
| GET | `/api/samagri/requirements/` | Public | `query params` | List puja requirement mappings, supports `?puja=` |
| GET | `/api/samagri/requirements/{id}/` | Public | `none` | Requirement detail |
| POST | `/api/samagri/ai_recommend/` | Public | `application/json` | AI-based samagri recommendation |

### Checkout and Orders

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/samagri/checkout/initiate/` | Auth | `application/json` | Create shop order and start payment |
| GET | `/api/samagri/checkout/my-orders/` | Auth | `none` | List current user's orders |
| GET | `/api/samagri/checkout/{id}/detail/` | Auth | `none` | Single order detail |
| GET | `/api/samagri/checkout/{id}/invoice/` | Auth | `none` | Download shop invoice PDF |

### Wishlist / Favorites

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/samagri/wishlist/` | Auth | `none` | List wishlist items |
| GET | `/api/samagri/wishlist/{id}/` | Auth | `none` | Wishlist record detail |
| DELETE | `/api/samagri/wishlist/{id}/` | Auth | `none` | Delete wishlist record |
| POST | `/api/samagri/wishlist/add/` | Auth | `application/json` | Add item to wishlist |
| DELETE | `/api/samagri/wishlist/remove/{item_id}/` | Auth | `none` | Remove by item id |
| GET | `/api/samagri/wishlist/check/{item_id}/` | Auth | `none` | Check favorite state |
| POST | `/api/samagri/wishlist/toggle/` | Auth | `application/json` | Toggle favorite |

## Payments

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/payments/create/` | Auth | `application/json` | Create payment intent |
| POST | `/api/payments/initiate/` | Auth | `application/json` | Alias for payment initiation |
| GET | `/api/payments/check-status/{booking_id}/` | Auth | `none` | Check payment status for booking |
| GET | `/api/payments/exchange-rate/` | Public | `none` | Get current exchange rate |
| POST | `/api/payments/khalti/verify/` | Auth | `application/json` | Verify Khalti payment |
| POST | `/api/payments/esewa/verify/` | Auth | `application/json` | Verify eSewa payment |
| POST | `/api/payments/{payment_id}/refund/` | Auth | `application/json` | Refund payment when business rules allow |

### Payment Webhooks

These are **backend-to-backend** endpoints, not for React Native app calls:

- `POST /api/payments/webhooks/stripe/`
- `POST /api/payments/webhooks/khalti/`

## Reviews

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/reviews/create/` | Auth | `application/json` | Create review for booking/pandit |
| GET | `/api/reviews/pandit-reviews/` | Public | `none` | Public recent pandit reviews |
| GET | `/api/reviews/site-reviews/` | Public | `none` | List site/app reviews |
| POST | `/api/reviews/site-reviews/` | Auth | `application/json` | Create site/app review |
| GET | `/api/reviews/my-reviews/` | Auth | `none` | Current user's reviews |
| GET | `/api/reviews/pandit/my-reviews/` | Pandit Auth | `none` | Reviews received by pandit |

## Chat REST APIs

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/chat/rooms/` | Auth | `none` | List chat rooms |
| GET | `/api/chat/rooms/{id}/` | Auth | `none` | Chat room detail |
| PUT | `/api/chat/rooms/{id}/` | Auth | `application/json` | Replace chat room metadata |
| PATCH | `/api/chat/rooms/{id}/` | Auth | `application/json` | Update chat room metadata |
| GET | `/api/chat/rooms/{room_id}/messages/` | Auth | `none` | List room messages |
| POST | `/api/chat/rooms/{room_id}/messages/` | Auth | `application/json` | Create/send room message |
| POST | `/api/chat/messages/{id}/mark-read/` | Auth | `application/json` | Mark message as read |
| POST | `/api/chat/rooms/initiate/` | Auth | `application/json` | Create/initiate chat room |
| POST | `/api/chat/quick-chat/` | Public or Auth | `application/json` | AI guide chat endpoint |
| POST | `/api/chat/` | Public or Auth | `application/json` | Alias of quick chat |
| GET | `/api/chat/history/` | Auth | `none` | User's AI guide chat history |

## Chat WebSocket APIs

| Protocol | Path | Auth | Payload Type | Purpose |
| --- | --- | --- | --- | --- |
| WS | `/ws/chat/{room_id}/` | JWT query token | JSON frames | Real-time room chat |
| WS | `/ws/puja/{booking_id}/` | JWT query token | JSON frames | Puja-specific real-time updates |

JWT query example:

```text
ws://<host>:8000/ws/chat/12/?token=<jwt_access_token>
```

## Video / WebRTC APIs

### Video REST

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/video/rooms/create/` | Auth | `application/json` | Create/resolve room from booking |
| GET | `/api/video/rooms/{room_id}/` | Auth | `none` | Room detail |
| PATCH | `/api/video/rooms/{room_id}/` | Auth | `application/json` | Update room detail fields |
| POST | `/api/video/rooms/{room_id}/start/` | Auth | `application/json` | Mark room as live |
| POST | `/api/video/rooms/{room_id}/end/` | Auth | `application/json` | Mark room ended |
| POST | `/api/video/rooms/{room_id}/upload-recording/` | Auth | `multipart/form-data` | Upload recorded video file |
| GET | `/api/video/{room_id}/validate/` | Auth | `none` | Validate booking state + time window |
| GET | `/api/video/room/{booking_id}/` | Auth | `none` | Resolve room by booking id |

### Legacy Video Compatibility Endpoints

These still exist in backend and may be used by older clients:

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/video/create-token/` | Auth | `application/json` | Create legacy Daily token |
| GET | `/api/video/generate-link/{booking_id}/` | Auth | `none` | Generate legacy video link |
| POST | `/api/video/room/{booking_id}/join/` | Auth | `application/json` | Join legacy room |

### Video WebSocket Signaling

| Protocol | Path | Auth | Payload Type | Purpose |
| --- | --- | --- | --- | --- |
| WS | `/ws/video/{room_id}/` | JWT query token | JSON frames | WebRTC signaling + in-room chat |

JWT query example:

```text
ws://<host>:8000/ws/video/bk-20-naming-ceremony/?token=<jwt_access_token>
```

## Kundali

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/kundali/generate/` | Public or Auth | `application/json` | Generate kundali |
| GET | `/api/kundali/list/` | Auth | `none` | List saved kundalis |
| GET | `/api/kundali/public-stats/` | Public | `none` | Public kundali stats |

## Panchang

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/panchang/data/` | Public | `query params` | Get panchang data for date/location |

## Notifications

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/notifications/` | Auth | `none` | List notifications |
| POST | `/api/notifications/` | Auth | `application/json` | Create notification record (normally backend-driven) |
| GET | `/api/notifications/{id}/` | Auth | `none` | Notification detail |
| PUT | `/api/notifications/{id}/` | Auth | `application/json` | Replace notification |
| PATCH | `/api/notifications/{id}/` | Auth | `application/json` | Mark as read / update |
| DELETE | `/api/notifications/{id}/` | Auth | `none` | Delete notification |
| POST | `/api/notifications/mark-all-read/` | Auth | `application/json` | Mark all notifications as read |

## AI / Assistant

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/ai/guide/` | Public or Auth | `query params` | AI guide/help endpoint |
| POST | `/api/ai/chat/` | Public or Auth | `application/json` | AI chatbot endpoint |
| POST | `/api/ai/puja-samagri/` | Public or Auth | `application/json` | AI puja + samagri helper |

## Recommender

### Read APIs

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/recommender/recommendations/` | Auth | `query params` | List recommendations |
| GET | `/api/recommender/recommendations/{id}/` | Auth | `none` | Recommendation detail |
| GET | `/api/recommender/templates/` | Auth | `query params` | List puja templates |
| GET | `/api/recommender/templates/{id}/` | Auth | `none` | Template detail |
| GET | `/api/recommender/user/preferences/` | Auth | `query params` | List user preferences |
| GET | `/api/recommender/user/preferences/{id}/` | Auth | `none` | Preference detail |
| GET | `/api/recommender/logs/` | Auth | `query params` | List recommendation logs |
| GET | `/api/recommender/logs/{id}/` | Auth | `none` | Log detail |
| GET | `/api/recommender/bookings/{booking_id}/samagri/` | Auth | `none` | Booking-specific samagri list |

### Write APIs

| Method | Path | Auth | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/recommender/user/preferences/` | Auth | `application/json` | Create preference |
| PUT | `/api/recommender/user/preferences/{id}/` | Auth | `application/json` | Replace preference |
| PATCH | `/api/recommender/user/preferences/{id}/` | Auth | `application/json` | Update preference |
| DELETE | `/api/recommender/user/preferences/{id}/` | Auth | `none` | Delete preference |
| POST | `/api/recommender/bookings/{booking_id}/samagri/recommendations/` | Auth | `application/json` | Generate booking recommendations |
| POST | `/api/recommender/bookings/{booking_id}/samagri/auto-add/` | Auth | `application/json` | Auto-add recommended items |
| POST | `/api/recommender/bookings/{booking_id}/samagri/add-item/` | Auth | `application/json` | Add one samagri item manually |

## Explicitly Excluded from Mobile

Do **not** use these in React Native app flows:

- `/api/admin/*`
- `/api/users/admin/*`
- `/api/pandits/admin/*`
- `/api/payments/admin/*`
- `/api/reviews/admin-reviews/`
- `/api/schema/`, `/api/docs/`, `/api/redoc/`

## Recommended Headers

### JSON APIs

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
```

### File Upload APIs

```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
Accept: application/json
```

## React Native Notes

- Prefer the `/api/users/` login endpoints over raw `/api/token/` in app flows.
- Refresh access tokens with `/api/token/refresh/`.
- For file/image uploads, use `FormData` in React Native.
- For WebSockets, append `?token=<access_token>` to the URL.
- For downloads like invoices, use file download handling in the mobile app instead of expecting JSON.

