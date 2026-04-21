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

## 🎯 Project Objective
The goal of PanditYatra is to modernize the accessibility of Hindu spiritual services. It addresses the challenges of finding qualified pandits, managing ritual logistics, and accessing accurate astrological data in a fast-paced digital world. By integrating AI and real-time communication, it ensures that tradition remains accessible anywhere, anytime.

---

## 🏗️ Key Features

### 🤖 AI & Spiritual Intelligence
- **Intelligent Ritual Assistant**: A context-aware AI chatbot for ritual guidance and philosophical queries.
- **Offline JyotishAI (Kundali)**: A specialized engine that generates accurate horoscopes entirely on the client-side using WebAssembly—ensuring 100% data privacy.
- **AI Samagri Recommender**: Automatically suggests required ritual items based on the booked puja.

### 📅 Booking & Management
- **Multi-Role Dashboards**: Specialized interfaces for **Customers**, **Pandits**, **Vendors**, and **Admins**.
- **Real-Time Scheduling**: Instant booking confirmation with automated calendar sync.
- **Flexible Locations**: Support for **Home-based**, **Temple**, or **Online (Video)** rituals.

### 🎥 Communication & Real-time Features
- **Professional Video Consultations**: High-definition, low-latency video calls powered by **WebRTC** and **Coturn TURN Server**.
- **Real-Time Chat**: Instant messaging between users and pandits via **Django Channels (WebSockets)**.
- **Global Notifications**: Real-time push notifications and branded email alerts via **Mailjet**.

### 🛍️ Marketplace & Payments
- **Vendor Shop**: A dedicated marketplace for puja samagri and spiritual items.
- **Multi-Gateway Payments**: Secure transactions via **Stripe**, **eSewa**, and **Khalti**.
- **Admin Email Center**: Centralized dashboard for managing bulk campaigns and transmission logs.

---

## 💻 System Requirements
- **OS**: Linux (Ubuntu 22.04+ recommended), macOS, or Windows (WSL2).
- **Hardware**: 4GB RAM (8GB recommended), 2 vCPUs.
- **Software**: 
  - Docker & Docker Compose (v2.21.0+)
  - Node.js 18+ (for local frontend development)
  - Python 3.11+ (for local backend development)

---

## 🚀 Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra.git
cd amit-pokhrel-pandityatra/pandityatra
```

### 2. Configure Environment Variables
Create a `.env` file in the `pandityatra/` directory:
```env
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=postgres://pandit_admin:secure_password@db:5432/pandityatra_db
REDIS_URL=redis://redis:6379/0

# Services
MAILJET_API_KEY=your_key
MAILJET_SECRET_KEY=your_secret
STRIPE_SECRET_KEY=your_stripe_key
```

### 3. Deploy with Docker
```bash
# Build and start all services (Web, Worker, Beat, DB, Redis)
docker compose up --build -d

# Run database migrations
docker compose exec web python manage.py migrate

# Create an admin account
docker compose exec web python manage.py createsuperuser
```

### 4. Access the Platform
- **Web Frontend**: `http://localhost:5173`
- **Admin Dashboard**: `http://localhost:8000/admin`
- **API Documentation**: `http://localhost:8000/api/docs`

---

## 🌍 Live Project
- **Production URL**: [https://amit-pokhrel-pandityatra.onrender.com/](https://amit-pokhrel-pandityatra.onrender.com/)
- **Mobile APK**: *Available in the Releases section*

---

## 📂 Project Structure
```text
pandityatra/
├── backend/                  # Django REST API & Celery Tasks
│   ├── pandityatra_backend/  # Core Settings & ASGI/WSGI
│   ├── notifications/        # Mailjet & Push logic
│   ├── bookings/             # Service & Appointment logic
│   ├── users/                # Multi-role Auth & Profile management
│   └── payments/             # Stripe, Khalti, eSewa adapters
├── frontend/                 # React (Vite) + shadcn/ui
│   ├── src/components/       # Reusable UI components
│   ├── src/pages/            # Dashboard & Marketplace views
│   └── public/               # PWA assets & Icons
├── docker-compose.yml        # Main orchestration file
└── render.yaml               # Blueprint for Render deployment
```

---

## 🔮 Future Improvements
- **AR Ritual Visualization**: Augmented reality overlays for guided home rituals.
- **Expanded Global Language Support**: Nepali, Hindi, and Sanskrit localization.
- **Smart Puja Kits**: IoT-enabled inventory tracking for vendors.

---

## 👥 Authors
- **Amit Pokhrel**
- BSc (Hons) Computing student at **Itahari International College** (London Metropolitan University).

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
