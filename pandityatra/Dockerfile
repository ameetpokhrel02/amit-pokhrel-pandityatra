# Dockerfile - Production Ready for Render (Python 3.12)

FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=pandityatra_backend.settings

WORKDIR /app

# Install system dependencies (including those for psycopg2 and build tools)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    build-essential \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend/ .

# Create directory for static files
RUN mkdir -p staticfiles

EXPOSE 8000

# Start application:
# 1. Collect static files at runtime (safe for Render)
# 2. Start Daphne (ASGI) for WebSockets
CMD ["sh", "-c", "python manage.py collectstatic --noinput && daphne -b 0.0.0.0 -p ${PORT:-8000} pandityatra_backend.asgi:application"]