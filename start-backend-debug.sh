#!/bin/bash
# Debug script to start backend and show errors

cd /Users/lacbis/clinicconnect

echo "Starting backend server..."
echo "========================="
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

# Check for DATABASE_URL
if ! grep -q "DATABASE_URL" .env; then
    echo "WARNING: DATABASE_URL not found in .env file"
fi

# Start the server
npm run dev

