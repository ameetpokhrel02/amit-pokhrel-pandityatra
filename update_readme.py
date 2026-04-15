import re

tree_and_deployment = """
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
│   └── tests/                # Automated API tests
├── frontend/                 # React & Vite Frontend
│   ├── package.json          # Node dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── src/                  # React components, contexts, and pages
│   ├── public/               # Static frontend assets
│   └── Dockerfile.prod       # Frontend Nginx container config
├── nginx/                    # Reverse Proxy configurations
├── .env.example              # Environment variables template
├── docker-compose.yml        # Local development orchestration
├── docker-compose.prod.yml   # Production orchestration config
└── render.yaml               # Render deployment specifications
```
"""

deployment_guide = """
## 🌍 Deployment Guide

### Option 1: Render (PaaS Deployment)
The easiest way to deploy the backend and frontend services quickly.
1. Connect you GitHub repository to Render.
2. The project contains a `render.yaml` file (Blueprint). Render will automatically detect the Python web service, Redis, PostgreSQL database, and Vite frontend.
3. Configure your API keys (Stripe, Google, Daily.co) in the Render environment variables dashboard.
4. Render will seamlessly build the Dockerfiles and boot up the microservices.

### Option 2: AWS ECS / EC2 (Production Recommended)
For high-traffic, scalable deployment using Docker Compose.
1. Provision an **AWS EC2 Ubuntu 24.04** instance.
2. Install Docker and Docker Compose on the instance.
3. Transfer the project files or clone the repository on the server.
4. Set up your production environment variables in `.env`.
5. Start the production containers using the EC2 specific compose file:
   ```bash
   docker compose -f docker-compose.ec2.yml up --build -d
   ```
6. The `nginx` container will automatically handle reverse proxying to your frontend and Django backend, running robust components like Gunicorn and ASGI servers.
"""

def update_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Update URL
    content = re.sub(
        r'## 🔗 Live Project URL.*?---',
        '## 🔗 Live Project URL\n- **Live Demo**: [https://amit-pokhrel-pandityatra-ybv9.vercel.app/](https://amit-pokhrel-pandityatra-ybv9.vercel.app/)\n\n---',
        content,
        flags=re.DOTALL
    )

    # Insert Tree after Screenshots
    if '## 🌳 Project Structure' not in content:
        content = re.sub(
            r'(---[\s\n]*## 🚀 Installation & Setup)',
            tree_and_deployment + r'\n\n\1',
            content
        )

    # Insert Deployment after Installation
    if '## 🌍 Deployment Guide' not in content:
        content = re.sub(
            r'(---[\s\n]*## 🔗 Live Project URL)',
            deployment_guide + r'\n\n\1',
            content
        )

    with open(path, 'w') as f:
        f.write(content)

update_file('/home/amit/Documents/Final-Year-Project/README.md')
update_file('/home/amit/Documents/Final-Year-Project/pandityatra/README.md')
