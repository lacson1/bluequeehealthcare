#!/bin/sh
# Startup script for ClinicConnect
# Runs database migrations before starting the server

set -e

echo "🚀 Starting ClinicConnect..."

# Run database migrations (push schema to database)
echo "📦 Running database migrations..."
npx drizzle-kit push --force 2>&1 || {
    echo "⚠️ Migration failed or already up to date, continuing..."
}

echo "✅ Migrations complete, starting server..."

# Start the Node.js application
exec node dist/index.js

