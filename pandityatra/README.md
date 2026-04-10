# PanditYatra - AI-Powered Hindu Rituals Platform 🕉️

<p align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" />
  <img src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS" />
  <img src="https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black" alt="Linux" />
  <img src="https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white" alt="Ubuntu" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/typescript-%230074c1.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>


---

**PanditYatra** is a state-of-the-art digital ecosystem designed to bridge the gap between ancient traditions and modern technology. It provides a seamless platform for devotees to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance.

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

### Frontend
- **React 18.2+**: Component-based UI library.
- **Vite 5.x**: Blazing fast frontend build tool.
- **TypeScript 5.x**: Static typing for reliability.
- **Tailwind CSS 4.0**: Utility-first design system.
- **Shadcn UI**: Accessible components.

### Backend
- **Django 5.1+**: Secure Python web framework.
- **Django REST Framework 3.15+**: Robust API building.
- **Django Channels 4.x**: WebSocket communication.
- **Celery 5.x**: Asynchronous task processing.

### Database & Cache
- **PostgreSQL 16**: Relational data management.
- **Redis 7**: High-speed caching and message brokering.

### Deployment & DevOps
- **Docker 24+** & **Docker Compose v2**: Containerization.
- **Nginx**: High-performance reverse proxy.
- **AWS EC2/S3**: Cloud hosting infrastructure.
- **Stripe / eSewa / Khalti**: Payment integrations.

---

## 📸 Project Screenshots

*(Add your project screenshots here)*

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
Create a `.env` file in the root based on this example pattern:
```env
# Example .env configuration
DEBUG=True
SECRET_KEY=your_django_secret_key
DATABASE_URL=postgres://postgres:password@db:5432/pandityatra

# Third-party Services
STRIPE_SECRET_KEY=your_stripe_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Start Backend & Database (Docker Setup - Linux, Mac, Windows)
The backend and database are entirely containerized. Run the following command from the root directory:
```bash
docker compose up --build -d
```
*Note for Windows users: Ensure Docker Desktop is running before executing this.*

**Run Initial Migrations:**
```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

### 4. Start Frontend
Open a new terminal and navigate to the frontend directory:

**Mac & Linux:**
```bash
cd frontend
pnpm install
pnpm dev
```

**Windows (PowerShell):**
```powershell
cd frontend
pnpm install
pnpm dev
```
Access the application at `http://localhost:5173`.

---

### 🧭 Repository Navigation
- 📁 **[Return to Project Root (`../`)](../)**
- 🖥️ **[Frontend Interface (`./frontend`)](./frontend/)** - *React 18 + TS + Vite*
- ⚙️ **[Backend API (`./backend`)](./backend/)** - *Django 5.1 + DRF*
- 🔑 **[Environment Variables (`.env.example`)](./.env.example)** - *Config template*
- 🐳 **Docker Setup Examples:**
  - [Development Compose (`docker-compose.yml`)](./docker-compose.yml)
  - [Production Compose (`docker-compose.prod.yml`)](./docker-compose.prod.yml)
  - [Application Dockerfile (`Dockerfile`)](./Dockerfile)
- 📱 **[Mobile App Repository](https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-mobile-app)** - *Expo Native Mobile App*

---

## 🔗 Live Project URL

*(Insert live deployment link here once published)*
- **Live Demo**: [https://your-live-url.com](https://your-live-url.com)

---

## 📂 Project Structure

```text
pandityatra/
│
├── backend/               # Django application (APIs, Models, Auth)
│   ├── manage.py
│   ├── pandityatra_backend/
│   └── (app directories: users, bookings, chat, etc.)
│
├── frontend/              # React/Vite application (UI components)
│   ├── package.json
│   ├── src/
│   └── public/
│
├── docker-compose.yml     # Container orchestration for Backend, Postgres, & Redis
├── .env.example           # Example environment variables
└── README.md              # Project documentation
```

---

## 🔮 Future Improvements

- **Mobile Application**: A native React Native mobile application is currently in the **testing and refinement phase** for push notifications and on-the-go access. 
  - 🔗 **Mobile App Repo**: [amit-pokhrel-pandityatra-mobile-app](https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-mobile-app.git)
- **Multilingual Support enhancements**: Expanding beyond English/Nepali/Hindi to regional languages.
- **AR/VR Integration**: Virtual temple tours and pooja participation.
- **Advanced Astrology AI**: Predictive analytics for highly detailed daily horoscopes.

---

## 👥 Authors

- **Student Name**: Amit Pokhrel
- **Program**: BSc (Hons) Computing
- **University**: Itahari International College (Affiliated to London Metropolitan University)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
