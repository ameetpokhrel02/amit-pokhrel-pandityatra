# PanditYatra – AI-Powered Global Pandit Booking Platform 🕉️

<div align="center">
  <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776834201/bdff48c6-fd94-4f76-8835-ca20c9a7321f.png" width="1000" alt="PanditYatra Introduction" />
  <br />
  <p><b>Bridging ancient Hindu traditions with modern AI technology.</b></p>
  
  <p>
    <a href="https://pandityatra.vercel.app/"><b>🚀 Live Project Demo (Vercel)</b></a> | 
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

### **Core Stack (Web & App)**
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

---

## 📸 Platform Showcase

<div align="center">
  <table style="width:100%">
    <tr>
      <td align="center" width="50%">
        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776835596/e0f82575-34bc-4b63-a993-045b4f7e1239.png" width="100%" alt="Shop Categories" /><br />
        <b>Sacred Collections</b>
      </td>
      <td align="center" width="50%">
        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776835680/10907ddf-480c-4a95-ae62-7bb1c0faa1fd.png" width="100%" alt="Login Page" /><br />
        <b>Premium Authentication</b>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776835713/76968cc4-b392-46e4-83f0-14e406eed1e2.png" width="100%" alt="Marketplace" /><br />
        <b>Vedic Marketplace</b>
      </td>
      <td align="center" width="50%">
        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1776835744/e349bd5a-e63b-4d71-99ae-9e33bf1719dd.png" width="100%" alt="Kundali" /><br />
        <b>AI Kundali Generation</b>
      </td>
    </tr>
  </table>
</div>

---

## 🛡️ Security & Stability
- **XSS Protection**: Full input sanitization via HTML escaping.
- **Secure Uploads**: 5MB cap and strict `.jpg/.png/.webp` validation.
- **SQLi Immunity**: 100% Parameterized queries via Django ORM.
- **SMTP Gateway**: Reliable email delivery via verified Gmail SMTP.

---

## 📂 Project Navigation & Structure

### **Quick Links**
- 🚀 [**Frontend Portal**](frontend/)
- ⚙️ [**Backend API Service**](backend/)
- 🐳 [**Docker Configuration**](docker-compose.yml)
- 📄 [**Backend Environment (.env.example)**](backend/.env.example)
- 📄 [**Frontend Environment (.env.example)**](frontend/.env.example)

### **Directory Overview**
```text
pandityatra/
├── backend/                  # Django REST API & Logic
├── frontend/                 # React & Vite Frontend
├── mobile-app/               # [📱 Mobile Repository](https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-mobile-app.git)
├── nginx/                    # Reverse Proxy configurations
├── docker-compose.yml        # Local orchestration
└── render.yaml               # Deployment specifications
```

---

## 🚀 Installation & Setup

### **1. Docker Setup (Recommended)** 🐳
![Docker](https://img.shields.io/badge/Docker-24.x+-2496ED?style=flat-square&logo=docker&logoColor=white)

```bash
docker compose up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

### **2. Manual Setup**

#### **For Linux & macOS** 🐧 🍎
```bash
cd backend && pip3 install -r requirements.txt && python3 manage.py migrate && python3 manage.py runserver
cd ../frontend && pnpm install && pnpm run dev
```

#### **For Windows** 🪟
```bash
cd backend && pip install -r requirements.txt && python manage.py migrate && python manage.py runserver
cd ..\frontend && pnpm install && pnpm run dev
```

---

## 👥 Authors & Acknowledgements
- **Amit Pokhrel** - London Metropolitan University.

### **Project Context**
This project was developed as a **Final Year Project** at **Itahari International College**.

### **Special Thanks**
- **External Supervisor**: Mr. Hemraj Dhakal
- **Internal Supervisor**: Mr. Nikesh Regmi

---
