# PanditYatra – AI-Powered Global Pandit Booking Platform 🕉️

<div align="center">
  <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776834201/bdff48c6-fd94-4f76-8835-ca20c9a7321f.png" width="1000" alt="PanditYatra Introduction" />
  <br />
  <p><b>Bridging ancient Hindu traditions with modern AI technology.</b></p>
</div>

---

## 🏗️ Project Overview
**PanditYatra** is a state-of-the-art digital ecosystem designed to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance through Web, PWA, and Mobile interfaces.

---

## 📸 Platform Showcase

### **Mobile App Experience (React Native)**
<div align="center">
  <table style="width:100%">
    <tr>
      <td align="center" width="33%">
        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776833380/hero_2_oxsgym.webp" width="100%" alt="Onboarding" /><br />
        <b>Smart Onboarding</b>
      </td>
      <td align="center" width="33%">
        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776833379/books_ite_ohwntm.webp" width="100%" alt="Home" /><br />
        <b>Ritual Discovery</b>
      </td>
      <td align="center" width="33%">
        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776834201/bdff48c6-fd94-4f76-8835-ca20c9a7321f.png" width="100%" alt="AI Chat" /><br />
        <b>AI Ritual Guide</b>
      </td>
    </tr>
  </table>
</div>

---

## 🛡️ Security Hardening
- **XSS Protection**: Full input sanitization via HTML escaping.
- **Secure Uploads**: 5MB cap and strict `.jpg/.png/.webp` validation.
- **SQLi Immunity**: 100% Parameterized queries via Django ORM.
- **Role Isolation**: RBAC for Customer, Pandit, Vendor, and Admin.

---

## 🛠️ Technologies Used
- **Backend**: Django 5.1, DRF 3.15, PostgreSQL 16, Redis 7
- **Frontend**: React 18, TypeScript 5, TailwindCSS 4
- **Mobile**: React Native (Expo SDK 54)
- **Real-Time**: WebSockets (Channels), HD Video (Daily.co)
- **AI**: Custom Ritual Assistant & Offline JyotishAI (WASM)

---

## 🚀 Infrastructure
- **Production Stable**: Optimized for Render Free Tier with Celery Eager Mode.
- **SMTP Gateway**: Reliable email delivery via verified Gmail SMTP.

---

## 📂 Project Structure
- 📁 [**Backend**](backend/) | 📁 [**Frontend**](frontend/) | 📁 [**Nginx**](nginx/)

---

## 👥 Authors
- **Amit Pokhrel** - London Metropolitan University.
