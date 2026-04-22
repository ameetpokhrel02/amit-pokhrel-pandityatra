# PanditYatra – AI-Powered Global Pandit Booking Platform 🕉️

<div align="center">
  <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776834201/bdff48c6-fd94-4f76-8835-ca20c9a7321f.png" width="1000" alt="PanditYatra Introduction" />
  <br />
  <p><b>Bridging ancient Hindu traditions with modern AI technology.</b></p>
  
  <p>
    <a href="https://pandityatra.onrender.com"><b>🚀 Live Project Demo</b></a> | 
    <a href="https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-mobile-app.git"><b>📱 Mobile App Repo</b></a>
  </p>
</div>

---

## 🏗️ Project Overview
**PanditYatra** is a state-of-the-art digital ecosystem designed to discover verified pandits, book sacred rituals, and access AI-driven spiritual guidance through Web, PWA, and Mobile interfaces.

---

## 🛠️ Technologies & Infrastructure

### **OS Support**
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)

### **Core Stack**
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

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

## 🛡️ Security & Stability
- **XSS Protection**: Full input sanitization via HTML escaping.
- **Secure Uploads**: 5MB cap and strict `.jpg/.png/.webp` validation.
- **SQLi Immunity**: 100% Parameterized queries via Django ORM (PostgreSQL).
- **SMTP Gateway**: Reliable email delivery via verified Gmail SMTP.

---

## 🌳 Project Structure
```text
pandityatra/
├── backend/                  # Django REST API & Logic
│   └── .env.example          # [🔗 Backend Env Template](backend/.env.example)
├── frontend/                 # React & Vite Frontend
│   └── .env.example          # [🔗 Frontend Env Template](frontend/.env.example)
├── mobile-app/               # [🔗 Mobile Repository](https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-mobile-app.git)
├── nginx/                    # Reverse Proxy configurations
├── docker-compose.yml        # Local orchestration
└── render.yaml               # Deployment specifications
```

---

## 🚀 Installation & Setup

### **1. Docker Setup (Recommended)** 🐳
![Docker](https://img.shields.io/badge/Docker-24.x+-2496ED?style=flat-square&logo=docker&logoColor=white)
```bash
# Clone and build
docker compose up --build -d

# Run migrations
docker compose exec backend python manage.py migrate
```

### **2. Manual Setup**

#### **For Linux & macOS** 🐧 🍎
![Django](https://img.shields.io/badge/Django-5.1-092E20?style=flat-square&logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
```bash
# Setup Backend
cd backend
pip3 install -r requirements.txt
python3 manage.py migrate
python3 manage.py createsuperuser # Optional: Create admin
python3 manage.py runserver

# Setup Frontend
cd ../frontend
pnpm install
pnpm run dev
```

#### **For Windows** 🪟
```bash
# Setup Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser # Optional: Create admin
python manage.py runserver

# Setup Frontend
cd ..\frontend
pnpm install
pnpm run dev
```

---

---

## 👥 Authors & Acknowledgements
- **Amit Pokhrel** - London Metropolitan University.

### **Project Context**
This project, **PanditYatra**, was developed as a **Final Year Project** at **Itahari International College**.

### **Special Thanks**
I would like to express my sincere gratitude and appreciation to my supervisors for their invaluable guidance, support, and mentorship throughout the development of this project:
- **External Supervisor**: Mr. Hemraj Dhakal
- **Internal Supervisor**: Mr. Nikesh Regmi

Thank you for your constant encouragement and technical insights!
