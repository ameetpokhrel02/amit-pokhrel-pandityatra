# PanditYatra – AI-Powered Global Pandit Booking Platform with Offline JyotishAI 🕉️

**PanditYatra** is a state-of-the-art digital ecosystem designed to bridge the gap between ancient Hindu traditions and modern technology. It provides a seamless platform for devotees to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance.

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
![Mailjet](https://img.shields.io/badge/Mailjet-API-FF9F00?style=for-the-badge&logo=mailjet)

---

## 🏗️ Key Features
- **AI Spiritual Intelligence**: JyotishAI (Offline Kundali) and Ritual Chatbot.
- **Multi-Role Integration**: Dashboards for Customer, Pandit, Vendor, and Admin.
- **Real-Time Communication**: HD Video (Daily.co) and WebSocket Chat (Channels).
- **Global Marketplace**: Integrated Vendor Shop and Multi-Gateway Payments.

---

## 🚀 Quick Setup (Docker)
```bash
docker compose up --build -d
docker compose exec web python manage.py migrate
```

---

## 📂 Project Navigation
- 📁 [**Backend Services**](backend/) - Django API, Models, and AI logic
- 📁 [**Frontend Portal**](frontend/) - React components and UI
- 📁 [**Infrastructure**](nginx/) - Production server configurations
- 📄 [**Environment Template**](.env.example) - Required configuration keys

---

## 👥 Authors
- **Amit Pokhrel** - London Metropolitan University.
