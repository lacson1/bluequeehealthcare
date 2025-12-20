#!/bin/sh
# Startup script for ClinicConnect
# Runs database migrations before starting the server
# Optimized for Cloud Run fast startup

echo "🚀 Starting ClinicConnect..."
echo "📍 Environment: ${NODE_ENV:-development}"
echo "📍 Port: ${PORT:-8080}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Run database migrations with timeout (max 30 seconds)
# Skip migrations if SKIP_MIGRATIONS=true (useful for faster cold starts)
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "📦 Running database migrations (30s timeout)..."
    
    # Use timeout to prevent hanging on DB connection issues
    if timeout 30 npx drizzle-kit push --force 2>&1; then
        echo "✅ Migrations completed successfully"
    else
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 124 ]; then
            echo "⚠️ Migration timed out after 30s, continuing anyway..."
        else
            echo "⚠️ Migration had issues (exit code: $EXIT_CODE), continuing..."
        fi
    fi
else
    echo "⏭️ Skipping migrations (SKIP_MIGRATIONS=true)"
fi

echo "🌐 Starting server on port ${PORT:-8080}..."

# Start the Node.js application
exec node dist/index.js

