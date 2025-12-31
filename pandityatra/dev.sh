#!/bin/bash

# Simple script to manage Pandityatra backend and DB

COMMAND=$1

case "$COMMAND" in
    up)
        echo "Starting backend + database..."
        docker compose up -d db web
        ;;
    stop)
        echo "Stopping backend + database..."
        docker compose stop web db
        ;;
    down)
        echo "Stopping all services..."
        docker compose down
        ;;
    ps)
        docker compose ps
        ;;
    logs-web)
        docker compose logs -f web
        ;;
    logs-db)
        docker compose logs -f db
        ;;
    *)
        echo "Usage: ./dev.sh {up|stop|down|ps|logs-web|logs-db}"
        ;;
esac
