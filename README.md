# PanditYatra – AI-Powered Global Pandit Booking Platform with Offline JyotishAI 🕉️

**PanditYatra** is a state-of-the-art digital ecosystem designed to bridge the gap between ancient Hindu traditions and modern technology. It provides a seamless platform for devotees to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance through Web, PWA, and Mobile interfaces.

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

## 🏗️ Features

### 🤖 AI-Powered Spiritual Intelligence
- **Intelligent Ritual Assistant**: A context-aware AI chatbot that guides users through complex ritual procedures and provides philosophical insights.
- **Offline JyotishAI (Kundali)**: A specialized WebAssembly-based engine that generates accurate horizontal and North-Indian style horoscopes entirely on the client side—ensuring 100% data privacy.
- **AI Samagri Recommender**: Automatically suggests required ritual items based on the booked puja.

### 📅 Comprehensive Booking Ecosystem
- **Multi-Role Integration**: Dedicated dashboards for **Customers**, **Pandits**, **Vendors**, and **Administrators**.
- **Real-Time Scheduling**: Conflict-free booking with instant confirmation and automated calendar synchronization.
- **Flexible Service Locations**: Support for Online (Video), Temple, or Home-based rituals.

### 🎥 Professional Video Consultations & Chat
- **HD Video Integration**: High-definition, low-latency video calls powered by Daily.co/WebRTC and **Coturn TURN Server**.
- **Real-Time Chat**: Instant messaging via Django Channels (WebSockets) for seamless user-pandit coordination.

### 🛍️ Marketplace & Global Notifications
- **Vendor Shop**: A dedicated marketplace for puja samagri and spiritual items.
- **Global Notifications**: Real-time push notifications and branded email alerts via **Mailjet**.

---

## 📸 Project Screenshots

<div align="center">
  <h3>1. Customer Dashboard</h3>
  <img width="800" alt="Customer Dashboard" src="https://github.com/user-attachments/assets/3775643d-1eb7-4b79-8acf-d9a71f5e5b92" />
  <p><i>The complete digital gateway to Hindu rituals and spiritual wellbeing.</i></p>
  
  <h3>2. Pandit Management</h3>
  <!-- [Insert Pandit Screenshot Here] -->
  
  <h3>3. Marketplace (Vendor Shop)</h3>
  <!-- [Insert Shop Screenshot Here] -->
  
  <h3>4. AI Jyotish (Kundali)</h3>
  <!-- [Insert Kundali Screenshot Here] -->
</div>


## 🌳 Project Structure

```text
pandityatra/
├── backend/                  # Django REST API & Core Logic
│   ├── manage.py             # Django entry point
│   ├── requirements.txt      # Python dependencies
│   ├── pandityatra_backend/  # Main Django settings
│   ├── users/                # User & Auth app
│   ├── bookings/             # Appointments & Bookings
│   ├── payments/             # Stripe, Khalti, eSewa integrations
│   ├── chat/                 # WebSocket chat logic
│   ├── ai/                   # AI Chatbot & Recommender models
│   └── notifications/        # Mailjet & Push logic
├── frontend/                 # React & Vite Frontend
│   ├── package.json          # Node dependencies
│   ├── src/                  # React components, contexts, and pages
│   ├── public/               # Static frontend assets
│   └── Dockerfile.prod       # Frontend Nginx container config
├── nginx/                    # Reverse Proxy configurations
├── .env.example              # Environment variables template
├── docker-compose.yml        # Local development orchestration
└── render.yaml               # Render deployment specifications
```


---

## 🚀 Installation & Setup

### General Requirements
- **Python** 3.11+
- **pnpm** (Required for Frontend)
- **Docker** & **Docker Compose**

### 1. Clone & Initialize
```bash
git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra.git
cd amit-pokhrel-pandityatra/pandityatra
```

### 2. Environment Variables (.env)
Create a `.env` file in the root based on the provided [`.env.example`](.env.example):
```env
# Example .env configuration
DEBUG=True
SECRET_KEY=your_django_secret_key
DATABASE_URL=postgres://postgres:password@db:5432/pandityatra

# Third-party Services
STRIPE_SECRET_KEY=your_stripe_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Start via Docker (Development)
```bash
docker compose up --build -d
```

**Run Migrations:**
```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

### 4. Start Frontend
```bash
cd frontend
pnpm install
pnpm dev
```
Access the application at `http://localhost:5173`.


## 🌍 Deployment Guide

### Option 1: Render (PaaS Deployment)
1. Connect you GitHub repository to Render.
2. The project contains a `render.yaml` file (Blueprint). Render will automatically detect services.
3. Configure your API keys (Stripe, Google, Mailjet) in the Render dashboard.

### Option 2: AWS ECS / EC2 (Production Recommended)
1. Provision an **AWS EC2 Ubuntu 24.04** instance with Docker installed.
2. Start the production containers:
   ```bash
   docker compose -f docker-compose.ec2.yml up --build -d
   ```


---

## 🔗 Live Project URL
- **Live Demo**: [(https://pandityatra.vercel.app/)]

---

## 📂 Project Navigation

- 📁 [**Project Core**](pandityatra/) - Main source code directory
- 📂 [**Backend Services**](pandityatra/backend/) - Django API, Models, and AI logic
- 📂 [**Frontend Portal**](pandityatra/frontend/) - React components and UI
- 📂 [**Infrastructure (Nginx)**](pandityatra/nginx/) - Production server configurations
- 📄 [**Environment Template**](pandityatra/.env.example) - Required configuration keys
- ⚙️ [**Production Setup**](pandityatra/docker-compose.prod.yml) - AWS EC2 Orchestration
- ⚙️ [**Development Setup**](pandityatra/docker-compose.yml) - Local Orchestration


---

## 🔮 Future Improvements
- **Mobile Application**: A React Native app currently in testing.
  - 🔗 **Repo**: [amit-pokhrel-pandityatra-mobile-app](https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-mobile-app.git)
- **Multilingual Support**: Region-specific language enhancements.
- **AR/VR Integration**: Virtual temple tours.

---

## 👥 Authors
- **Amit Pokhrel**
- **BSc (Hons) Computing**
- **Itahari International College** (London Metropolitan University)

---

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.
