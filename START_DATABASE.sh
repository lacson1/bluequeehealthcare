#!/bin/bash
# Quick script to start the database for ClinicConnect

echo "🔍 Checking Docker status..."

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop:"
    echo "1. Open Docker Desktop from Applications"
    echo "2. Wait for Docker to fully start (check menu bar icon)"
    echo "3. Then run this script again: bash START_DATABASE.sh"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if container exists
CONTAINER_NAME="clinicconnect-postgres"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Container exists, checking status..."
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ Database container is already running!"
        echo ""
        echo "You can now try logging in again."
    else
        echo "🚀 Starting database container..."
        docker start ${CONTAINER_NAME}
        sleep 3
        echo "✅ Database container started!"
        echo ""
        echo "You can now try logging in again."
    fi
else
    echo "📦 Container doesn't exist. Creating new database container..."
    echo ""
    echo "This will:"
    echo "  - Create a PostgreSQL container"
    echo "  - Set up the database"
    echo "  - Run migrations"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bash setup-dev-db.sh
    else
        echo "Cancelled."
        exit 0
    fi
fi

echo ""
echo "🧪 Testing database connection..."
sleep 2
if docker exec ${CONTAINER_NAME} psql -U clinicuser -d clinicconnect -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "⚠️  Database might still be starting up. Wait a few seconds and try again."
fi

