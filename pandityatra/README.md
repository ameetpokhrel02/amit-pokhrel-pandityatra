# PanditYatra - AI-Powered Hindu Rituals Platform 🕉️

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2.9-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

**PanditYatra** is a comprehensive digital platform connecting devotees with verified pandits for Hindu religious ceremonies and rituals. Built with AI-powered recommendations, real-time chat, and seamless booking system.

---

## 🌟 Key Features

### For Devotees

- **🤖 AI Chatbot**: Intelligent assistant for ritual guidance and information
- **🔍 Smart Pandit Discovery**: Find verified pandits based on specialization, location, and availability
- **📅 Online Booking System**: Schedule pujas with instant confirmation
- **🛒 Sacred Items (Samagri)**: Order ritual items with delivery
- **⭐ Review & Ratings**: Community-driven pandit verification
- **💬 Real-time Chat**: Direct communication with pandits via WebSocket
- **📊 Kundali Analysis**: AI-powered horoscope insights
- **🙏 Temple Directory**: Explore sacred destinations with HD images

### For Pandits

- **✅ Verification System**: Multi-stage approval process
- **📆 Schedule Management**: Calendar integration and availability control
- **💰 Payment Integration**: Secure online transactions
- **📱 Mobile Dashboard**: Manage bookings on the go
- **📈 Performance Analytics**: Track ratings and bookings

---

## 🏗️ Architecture

### Backend (Django)

```text
pandityatra/backend/
├── pandityatra_backend/ # Django core settings, ASGI/WSGI, root URLs
├── adminpanel/          # Admin workflows and moderation tools
├── users/          # Authentication & user management
├── pandits/        # Pandit profiles & verification
├── bookings/       # Booking system & scheduling
├── chat/           # WebSocket chat (Django Channels)
├── ai/             # AI assistant + MCP-style tool orchestration layer
├── recommender/    # Recommendation engine and ranking logic
├── kundali/        # Horoscope analysis
├── panchang/       # Panchang calendar and festival intelligence
├── samagri/        # Sacred items catalog
├── payments/       # Payment processing
├── reviews/        # Rating & review system
├── notifications/  # In-app notifications and alerts
├── video/          # Daily.co video consultation integration
└── services/       # Service catalog
```

### Frontend (React + TypeScript)

```text
pandityatra/frontend/src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── contexts/       # React Context (Auth, Cart)
├── lib/            # Shared API helpers and utilities
├── services/       # API integration
├── hooks/          # Custom hooks
├── i18n/           # Internationalization resources
├── types/          # TypeScript interfaces
└── utils/          # Formatting, constants, and helper utilities
```

---

## 🚀 Quick Start

### ✅ Version Requirements

- **Python**: 3.11+
- **Node.js**: 18+
- **pnpm**: 8+
- **Docker**: 24+
- **Docker Compose**: v2+

### 1) Clone Repository

```bash
git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra.git
cd amit-pokhrel-pandityatra/pandityatra
```

### 2) Configure Environment

Use the root env file (already used by Docker + Django in this project):

```bash
cp .env.example .env
```

Then update important values in `.env` (especially `SECRET_KEY`, email, payment keys, AI keys).

---

### 3) Run Backend + Database + Redis with Docker (Recommended)

This starts:

- Django backend (`web`)
- PostgreSQL (`db`)
- Redis (`redis`)
- pgAdmin and Adminer

```bash
docker compose up --build -d
```

Run migrations and create admin user:

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

Useful Docker commands:

```bash
docker compose logs -f web
docker compose ps
docker compose down
```

---

### 4) Run Frontend (Vite)

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:5173`.

---

### 5) Access Services

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Admin Panel: `http://localhost:8000/admin`
- Swagger Docs: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- pgAdmin: `http://localhost:5050`
- Adminer: `http://localhost:8080`

---

### 6) Optional: Run Backend Locally (Without Docker)

If you want local backend instead of Docker, ensure PostgreSQL + Redis are running locally and set proper values in `.env`.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## 🛠️ Technology Stack

### Backend

- **Framework**: Django 5.2.9
- **WebSocket**: Django Channels + Daphne
- **API**: Django REST Framework
- **Database**: PostgreSQL / SQLite
- **Cache**: Redis
- **AI**: OpenAI GPT-3.5-turbo
- **Authentication**: JWT (djangorestframework-simplejwt)

### Frontend

- **Framework**: React 18 + Vite
- **Language**: TypeScript 5.6
- **UI Library**: shadcn/ui + Tailwind CSS 4
- **Animation**: Framer Motion 11
- **Icons**: Lucide React, React Icons
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### DevOps

- **Containerization**: Docker + Docker Compose
- **Package Manager**: pnpm (frontend), pip (backend)
- **Version Control**: Git + GitHub

---

## 📚 Documentation

All detailed documentation is available in [`pandityatra/docs/`](pandityatra/docs/):

- [START_HERE.md](pandityatra/docs/START_HERE.md) - Complete project overview
- [TESTING_GUIDE.md](pandityatra/docs/TESTING_GUIDE.md) - Testing procedures
- [DOCKER_STATUS.md](pandityatra/docs/DOCKER_STATUS.md) - Container setup
- [CHATBOT_README.md](pandityatra/docs/CHATBOT_README.md) - AI chatbot implementation
- [AUTHENTICATION_STATUS.md](pandityatra/docs/AUTHENTICATION_STATUS.md) - Auth system
- [BOOKING_SYSTEM_COMPLETE.md](pandityatra/docs/BOOKING_SYSTEM_COMPLETE.md) - Booking flow
- [DATABASE_ENHANCEMENTS.md](pandityatra/docs/DATABASE_ENHANCEMENTS.md) - Schema details

---

## 🎯 Project Status

✅ **Phase 1 Complete**: Core booking system, authentication, pandit profiles  
✅ **Phase 2 Complete**: AI chatbot, real-time chat, recommendations  
🚀 **Phase 3 Active**: Payment integration, mobile app, advanced analytics

See [PHASE2_IMPLEMENTATION_STATUS.md](pandityatra/docs/PHASE2_IMPLEMENTATION_STATUS.md) for detailed progress.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Final Year Project** - Computer Engineering  
Developed by: Amit Pokhrel

---

## 📞 Support

For issues, questions, or suggestions:

- GitHub Issues: [Report here](https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra/issues)
- Email: [ameetpokhrel02@gmail.com](mailto:ameetpokhrel02@gmail.com)

---

Made with ❤️ for the Hindu community
