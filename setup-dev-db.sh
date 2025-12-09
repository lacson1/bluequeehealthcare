#!/bin/bash
set -e

echo "🏥 ClinicConnect - Automatic Development Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="clinicconnect"
DB_USER="clinicuser"
DB_PASSWORD="clinic_dev_2024"
DB_PORT="5434"
CONTAINER_NAME="clinicconnect-postgres"

echo "📦 Step 1: Setting up PostgreSQL in Docker..."

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "   Container already exists. Checking status..."
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "   ${GREEN}✓${NC} PostgreSQL container is already running"
    else
        echo "   Starting existing container..."
        docker start ${CONTAINER_NAME}
        sleep 2
        echo -e "   ${GREEN}✓${NC} PostgreSQL container started"
    fi
else
    echo "   Creating new PostgreSQL container..."
    docker run --name ${CONTAINER_NAME} \
        -e POSTGRES_DB=${DB_NAME} \
        -e POSTGRES_USER=${DB_USER} \
        -e POSTGRES_PASSWORD=${DB_PASSWORD} \
        -p ${DB_PORT}:5432 \
        -d postgres:15-alpine
    
    echo "   Waiting for PostgreSQL to be ready..."
    sleep 5
    echo -e "   ${GREEN}✓${NC} PostgreSQL container created and running"
fi

echo ""
echo "📝 Step 2: Creating .env file..."

# Create .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}

# Session Secret
SESSION_SECRET=clinic-session-secret-2024-dev

# JWT Secret
JWT_SECRET=clinic-secret-key-2024-dev

# Server Port
PORT=5001
EOF

echo -e "   ${GREEN}✓${NC} .env file created"

echo ""
echo "📊 Step 3: Running database migrations..."

# Wait a bit more to ensure postgres is fully ready
sleep 2

# Run database migrations
npx drizzle-kit push --force

echo -e "   ${GREEN}✓${NC} Database schema created"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Database Details:"
echo "  Container: ${CONTAINER_NAME}"
echo "  Database:  ${DB_NAME}"
echo "  User:      ${DB_USER}"
echo "  Port:      ${DB_PORT}"
echo ""
echo "Next steps:"
echo "  1. Start backend:  npm run dev"
echo "  2. Start frontend: npx vite --host"
echo "  3. Open browser:   http://localhost:5173"
echo ""
echo "To stop the database:"
echo "  docker stop ${CONTAINER_NAME}"
echo ""
echo "To remove the database:"
echo "  docker rm -f ${CONTAINER_NAME}"
echo ""

