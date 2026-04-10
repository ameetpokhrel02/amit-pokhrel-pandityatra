# PanditYatra - AI-Powered Hindu Rituals Platform 🕉️

**PanditYatra** is a state-of-the-art digital ecosystem designed to bridge the gap between ancient traditions and modern technology. It provides a seamless platform for devotees to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance.

---

## 🛠️ Tools & Environment
| Tool | Version / Type |
| :--- | :--- |
| 🐧 **Operating System** | Ubuntu 24.04 LTS |
| 🐳 **Docker Engine** | 24.0.7+ |
| 🚢 **Docker Compose** | v2.21.0+ |
| 🚀 **Nginx** | Alpine (Reverse Proxy & Static Server) |
| 🐍 **Python** | 3.11.x |
| 📦 **Node.js** | 18.x / 20.x |
| 📦 **Package Manager** | PNPM 10.x+ |
| ⚛️ **React** | 18.x |
| 📘 **TypeScript** | 5.x |
| 🎨 **Tailwind CSS** | 4.0 |

---

## 🏗️ Features

### 🤖 AI-Powered Spiritual Intelligence
- **Intelligent Ritual Assistant**: A context-aware AI chatbot that guides users through complex ritual procedures and provides philosophical insights.
- **Smart Recommendation Engine**: Personalizes user experiences by suggesting relevant pujas and rituals based on astrological timing and user history.

### 📅 Comprehensive Booking Ecosystem
- **Multi-Role Integration**: Dedicated dashboards for **Customers**, **Pandits**, **Vendors**, and **Administrators**.
- **Real-Time Scheduling**: Conflict-free booking with instant confirmation and automated calendar synchronization.
- **Flexible Service Locations**: Support for Online (Video), Temple, or Home-based rituals.

### 🎥 Professional Video Consultations
- **HD Video Integration**: High-definition, low-latency video calls powered by Daily.co for remote rituals and consultations.

### 📊 Offline Kundali Generator
- **Privacy-First Astrology**: A specialized WebAssembly-based engine that generates accurate horizontal and North-Indian style horoscopes entirely on the client side—ensuring 100% data privacy.

---

## 🛠️ Technologies Used

### Frontend (The Face)
- **React 18**: Component-based UI library.
- **Vite**: Next-generation, blazing fast frontend tooling.
- **TypeScript**: Static typing for enterprise reliability.
- **Tailwind CSS 4**: Utility-first premium design system.
- **Shadcn UI**: Accessible component library.
- **Dockerfile.prod**: Multi-stage build for Nginx deployment.

### Backend (The Brain)
- **Django 5.x**: Secure and scalable Python web framework.
- **Django REST Framework**: Building robust APIs.
- **Django Channels**: Real-time WebSocket communication for chat and notifications.
- **Celery**: Asynchronous task queue processing.
- **Gunicorn/Uvicorn**: Production-grade WSGI/ASGI servers.

### Database & Cache
- **PostgreSQL**: Robust relational data management for core records.
- **Redis**: High-speed caching and message brokering for WebSockets.

### Deployment & Cloud (DevOps)
- **Docker & Docker Compose**: Containerization for consistent environments.
- **Nginx**: Reverse proxy, SSL termination, and static asset serving.
- **AWS (Amazon Web Services)**: Cloud hosting infrastructure (EC2, S3).
- **Stripe / eSewa / Khalti**: Payment gateway integrations.

---

## 📸 Project Screenshots

<div align="center">
  <img width="800" alt="PanditYatra Dashboard" src="https://github.com/user-attachments/assets/3775643d-1eb7-4b79-8acf-d9a71f5e5b92" />
  <p><i>The complete digital gateway to Hindu rituals and spiritual wellbeing.</i></p>
</div>

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

---

## 🔗 Live Project URL
- **Live Demo**: [https://your-live-url.com](https://your-live-url.com)

---

## 📂 Project Navigation

- 📁 [**Root Overview**](../README.md) - Project metadata and author info
- 📁 [**Backend Services**](backend/) - Django API, Models, and AI logic
- 📁 [**Frontend Portal**](frontend/) - React components and UI
- 📁 [**Infrastructure (Nginx)**](nginx/) - Production server configurations
- 📄 [**Environment Template**](.env.example) - Required configuration keys
- ⚙️ [**Production Setup**](docker-compose.prod.yml) - AWS EC2 Orchestration
- ⚙️ [**Development Setup**](docker-compose.yml) - Local Orchestration


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
