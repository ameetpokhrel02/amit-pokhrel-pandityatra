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

# Pre-collect static files (using a dummy secret key)
RUN SECRET_KEY=collectstatic_dummy_key python manage.py collectstatic --noinput

EXPOSE 8000

# Start application using Daphne (ASGI) to support WebSockets (Chat/Real-time)
# Render provides the port via the $PORT environment variable
CMD ["sh", "-c", "daphne -b 0.0.0.0 -p ${PORT:-8000} pandityatra_backend.asgi:application"]