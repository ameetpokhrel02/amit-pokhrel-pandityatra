# PanditYatra – AI-Powered Global Pandit Booking Platform with Offline JyotishAI 🕉️

**PanditYatra** is a comprehensive, production-grade digital ecosystem designed to bridge the gap between ancient Hindu traditions and modern technology. It provides a seamless platform for devotees to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance through Web, PWA, and Mobile interfaces.

---

## 🛠️ Technologies Used

### **Web & Backend Infrastructure**
![Django](https://img.shields.io/badge/Django-5.1.2-092E20?style=for-the-badge&logo=django)
![DRF](https://img.shields.io/badge/DRF-3.15.2-A30000?style=for-the-badge&logo=django)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)
![Docker](https://img.shields.io/badge/Docker-24.x-2496ED?style=for-the-badge&logo=docker)
![Celery](https://img.shields.io/badge/Celery-5.x-37814A?style=for-the-badge&logo=celery)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss)
![WebRTC](https://img.shields.io/badge/WebRTC-LATEST-FF6F00?style=for-the-badge&logo=webrtc)
![Mailjet](https://img.shields.io/badge/Mailjet-API-FF9F00?style=for-the-badge&logo=mailjet)

### **Mobile App (React Native)**
![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-~54.0.30-000020?style=for-the-badge&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-~5.9.2-3178C6?style=for-the-badge&logo=typescript)
![Zustand](https://img.shields.io/badge/Zustand-^5.0.9-443E38?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-^3.4.19-38B2AC?style=for-the-badge&logo=tailwindcss)

---

## 🏗️ Key Features

### 🤖 AI & Spiritual Intelligence
- **Intelligent Ritual Assistant**: Context-aware AI chatbot.
- **Offline JyotishAI (Kundali)**: WebAssembly-powered offline horoscope generation.
- **AI Samagri Recommender**: Automatic ritual item suggestions.

### 📅 Booking & Management
- **Dashboards**: Specialized Customer, Pandit, Vendor, and Admin views.
- **Video Rituals**: Remote sessions via WebRTC / Daily.co.
- **Real-Time Scheduling**: Conflict-free booking engine.

### 🛍️ Marketplace & Logistics
- **Vendor Shop**: Integrated marketplace for spiritual items.
- **Branded Emails**: Transmissions powered by Mailjet + Celery.
- **Multi-Payment**: Stripe, eSewa, and Khalti integration.

---

## 🚀 Quick Start (Docker)

```bash
# Clone & Start
git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra.git
cd amit-pokhrel-pandityatra/pandityatra
docker compose up --build -d

# Initialize DB
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

Frontend available at: `http://localhost:5173`

---

## 👥 Authors
- **Amit Pokhrel** - [GitHub](https://github.com/ameetpokhrel02)
- BSc (Hons) Computing, London Metropolitan University.
