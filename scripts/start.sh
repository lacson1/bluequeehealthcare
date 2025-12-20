#!/bin/sh
# Startup script for ClinicConnect
# Runs database migrations before starting the server

echo "🚀 Starting ClinicConnect..."
echo "📍 Environment: ${NODE_ENV:-development}"
echo "📍 Port: ${PORT:-8080}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Run database migrations (push schema to database)
echo "📦 Running database migrations..."
if npx drizzle-kit push --force 2>&1; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️ Migration had issues, but continuing..."
fi

echo "🌐 Starting server on port ${PORT:-8080}..."

# Start the Node.js application
exec node dist/index.js

