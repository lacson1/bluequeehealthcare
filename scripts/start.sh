#!/bin/sh
# Startup script for ClinicConnect
# Optimized for Cloud Run fast startup - starts server IMMEDIATELY

echo "🚀 Starting ClinicConnect..."
echo "📍 Environment: ${NODE_ENV:-development}"
echo "📍 Port: ${PORT:-8080}"

# Start the Node.js application immediately
# The server has health checks built-in that respond before full initialization
exec node dist/index.js

