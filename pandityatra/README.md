# PanditYatra - AI-Powered Hindu Rituals Platform 🕉️

[![Final Year Project](https://img.shields.io/badge/FYP-2025%2F2026-orange.svg)](https://iic.edu.np/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2.9-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10+-E8BA24.svg)](https://pnpm.io/)

**PanditYatra** is a state-of-the-art digital ecosystem designed to bridge the gap between ancient traditions and modern technology. It provides a seamless platform for devotees to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance.

<div align="center">
  <img width="800" alt="PanditYatra Hero" src="https://github.com/user-attachments/assets/3775643d-1eb7-4b79-8acf-d9a71f5e5b92" />
  <p><i>The complete digital gateway to Hindu rituals and spiritual wellbeing.</i></p>
</div>

---

## 🏗️ Core Pillars & Features

### 1. 🤖 AI-Powered Spiritual Intelligence
- **Intelligent Ritual Assistant**: A context-aware AI chatbot that guides users through complex ritual procedures and provides philosophical insights.
- **Smart Recommendation Engine**: Personalizes user experiences by suggesting relevant pujas and rituals based on astrological timing and user history.

### 2. 📅 Comprehensive Booking Ecosystem
- **Multi-Role Integration**: Dedicated dashboards for **Customers**, **Pandits**, **Vendors**, and **Administrators**.
- **Real-Time Scheduling**: Conflict-free booking with instant confirmation and automated calendar synchronization.
- **Flexible Service Locations**: Support for Online (Video), Temple, or Home-based rituals.

### 3. 🎥 Professional Video Consultations
- **HD Video Integration**: High-definition, low-latency video calls powered by Daily.co for remote rituals and consultations.
- **Session Records**: Secure storage of completed sessions for future reference.

### 4. 📊 World's First 100% Offline Kundali Generator
- **Privacy-First Astrology**: A specialized WebAssembly-based engine that generates accurate horizontal and North-Indian style horoscopes entirely on the client side—ensuring 100% data privacy.

### 5. 🛠️ Advanced Admin Oversight
- **Dynamic User Creation**: Manual onboarding module for Admins to create and activate any user role immediately.
- **Financial Transparency**: Detailed ledgers for transaction tracking and platform commission management.
- **System Monitoring**: Comprehensive activity logs and error tracking for platform stability.

---

## 🛠️ Technology Stack

### Backend (The Brain)
- **Django 5.2.9**: Secure and scalable core.
- **Django Channels**: Real-time WebSocket communication for chat and notifications.
- **PostgreSQL**: Robust relational data management.
- **Redis**: High-speed caching and message brokering.

### Frontend (The Face)
- **React 18 + Vite**: Lightning-fast, modern UI framework.
- **TypeScript**: Type-safe development for enterprise reliability.
- **Shadcn UI + Tailwind CSS 4**: Premium, customizable design system with glassmorphism and modern aesthetics.
- **Framer Motion**: Fluid, physics-based micro-animations for an interactive experience.

---

## 🚀 Installation & Setup

### Requirements
- **Python** 3.11+
- **pnpm** 10.0+ (Required for Frontend)
- **Docker** 24.0+ & **Docker Compose** v2.0+

### 1. Clone & Initialize
```bash
git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra.git
cd amit-pokhrel-pandityatra/pandityatra
cp .env.example .env
```

### 2. Launch Services (Docker Recommended)
This will set up the Backend (Django), Database (Postgres), and Cache (Redis) automatically.
```bash
docker compose up --build -d
```

**Run Initial Migrations:**
```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

### 3. Start Frontend (Vite)
Open a new terminal and navigate to the frontend directory.
```bash
cd frontend
pnpm install
pnpm dev
```
Access the application at `http://localhost:5173`.

---

## 📂 Project Navigation

- [Root Configuration](.env.example) - Global environment settings
- [Backend Services](backend/) - Django apps and AI logic
- [Frontend Portal](frontend/) - React components and UI
- [Documentation Hub](docs/) - Detailed implementation guides

---

## 👥 The Final Year Project Team

**Itahari International College** (London Metropolitan University)  
**Lead Developer**: Amit Pokhrel (Student ID: 23056626)  
**Project**: Final Year Project (FYP) 2025/2026

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ for the Global Hindu Community</p>
  <img src="https://img.shields.io/badge/Status-Final_Build-success?style=for-the-badge" alt="Build Status" />
</div>
