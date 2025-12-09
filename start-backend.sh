#!/bin/bash

# Script to start the backend server with database setup instructions

echo "🚀 Starting ClinicConnect Backend Server"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set!"
    echo ""
    echo "To fix this, you need to set up a PostgreSQL database and configure DATABASE_URL."
    echo ""
    echo "Options:"
    echo "1. Use Neon (Free PostgreSQL): https://neon.tech"
    echo "2. Use local PostgreSQL:"
    echo "   export DATABASE_URL='postgresql://user:password@localhost:5432/clinicconnect'"
    echo "3. Use Docker PostgreSQL:"
    echo "   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=clinicconnect postgres"
    echo "   export DATABASE_URL='postgresql://postgres:password@localhost:5432/clinicconnect'"
    echo ""
    echo "After setting DATABASE_URL, run: npm run dev"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo "Starting backend server..."
echo ""

npm run dev

