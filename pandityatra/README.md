# PanditYatra – AI-Powered Global Pandit Booking Platform 🕉️

**PanditYatra** is a state-of-the-art digital ecosystem designed to bridge the gap between ancient Hindu traditions and modern technology. It provides a seamless platform for devotees to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance through Web, PWA, and Mobile interfaces.

---

<div align="center">
  <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776833380/hero_2_oxsgym.webp" width="900" alt="PanditYatra Banner" />
</div>

---

## 🛡️ Security Hardening (Latest Updates)
We have implemented enterprise-grade security protocols for the final submission:
- **Input Sanitization**: All user-generated content (emails, messages) is sanitized using HTML escaping to prevent **XSS (Cross-Site Scripting)**.
- **Secure File Uploads**: Multi-layer validation for profile pictures and marketplace items:
  - **Type Control**: Restricted to `.jpg`, `.png`, and `.webp` only.
  - **Size Limit**: Hard cap at 5MB per file to prevent DoS attacks.
- **SQL Injection Immunity**: 100% database interaction via Django ORM with parameterized queries.
- **Role-Based Access Control (RBAC)**: Strict isolation between Customer, Pandit, Vendor, and Admin permissions.

---

## 🛠️ Technologies Used
- **Backend**: Django 5.1, DRF 3.15, PostgreSQL 16
- **Frontend**: React 18, TypeScript 5, TailwindCSS 4
- **Mobile**: React Native (Expo)
- **Real-Time**: WebSockets (Django Channels), HD Video (Daily.co / WebRTC)
- **AI/ML**: Custom AI Ritual Guide & Offline JyotishAI (WASM)
- **Email**: SMTP via Verified Gmail (Optimized for Production Stability)

---

## 🚀 Infrastructure & Deployment
- **Celery Eager Mode**: Background tasks (OTP/Emails) are executed synchronously to ensure 100% reliability on low-resource servers (Render Free Tier).
- **Environment Management**: Hardened `.env` configuration for secure API key management.
- **SMTP Gateway**: Reliable email delivery via verified SMTP protocols.

---

## 📂 Project Structure
- 📁 [**Backend Services**](backend/) - Django API, Models, and AI logic
- 📁 [**Frontend Portal**](frontend/) - React components and UI
- 📁 [**Infrastructure**](nginx/) - Production server configurations
- 📄 [**Environment Template**](.env.example) - Required configuration keys

---

## 👥 Authors
- **Amit Pokhrel** - London Metropolitan University (Final Year Project).
