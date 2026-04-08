# Dockerfile - Production Ready for Render

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=pandityatra_backend.settings

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY backend/requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy entire backend code
COPY backend/ .

# Collect static files
RUN SECRET_KEY=collectstatic_dummy python manage.py collectstatic --noinput

EXPOSE 8000

# Use Gunicorn (already in your requirements.txt)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "pandityatra_backend.asgi:application"]