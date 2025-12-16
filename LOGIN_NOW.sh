#!/bin/bash
# Quick script to clear rate limit and help with login

echo "🔐 Getting You Logged In"
echo "========================"
echo ""

# Step 1: Clear rate limit by restarting server
echo "Step 1: Clearing rate limit..."
echo ""

SERVER_PIDS=$(lsof -ti:5001 2>/dev/null)

if [ ! -z "$SERVER_PIDS" ]; then
    echo "🛑 Stopping server to clear rate limit..."
    kill $SERVER_PIDS 2>/dev/null
    sleep 2
    
    REMAINING=$(lsof -ti:5001 2>/dev/null)
    if [ ! -z "$REMAINING" ]; then
        kill -9 $REMAINING 2>/dev/null
        sleep 1
    fi
    
    echo "✅ Server stopped (rate limit cleared)"
    echo ""
    echo "🚀 Please restart the server in another terminal:"
    echo "   npm run dev"
    echo ""
else
    echo "⚠️  Server not running on port 5001"
    echo ""
    echo "To start the server, run:"
    echo "   npm run dev"
    echo ""
fi

# Step 2: Check Docker
echo "Step 2: Checking database..."
echo ""

if docker ps > /dev/null 2>&1; then
    echo "✅ Docker is running"
    
    if docker ps --format '{{.Names}}' | grep -q "clinicconnect-postgres"; then
        echo "✅ Database container is running"
    else
        echo "⚠️  Database container is not running"
        echo ""
        echo "To start it, run:"
        echo "   bash START_DATABASE.sh"
        echo "   OR"
        echo "   docker start clinicconnect-postgres"
    fi
else
    echo "❌ Docker is not running"
    echo ""
    echo "Please:"
    echo "  1. Start Docker Desktop"
    echo "  2. Wait for it to fully start"
    echo "  3. Then run: bash START_DATABASE.sh"
fi

echo ""
echo "=========================================="
echo "After completing the steps above:"
echo "  1. Server restarted (clears rate limit)"
echo "  2. Docker running"
echo "  3. Database container started"
echo ""
echo "Then try logging in with:"
echo "  Username: admin"
echo "  Password: admin123"
echo "=========================================="

