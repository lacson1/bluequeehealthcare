#!/bin/bash

# Super Admin Login Test Script
# This script tests the super admin demo login

echo "🧪 Super Admin Login Demo Test"
echo "=============================="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "   ✅ Server is running"
else
    echo "   ❌ Server is not running"
    echo "   💡 Start the server with: npm run dev"
    echo ""
    read -p "   Do you want to start the server now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Starting server in background..."
        npm run dev > /tmp/clinicconnect-server.log 2>&1 &
        SERVER_PID=$!
        echo "   Server started (PID: $SERVER_PID)"
        echo "   Waiting for server to be ready..."
        sleep 5
        
        # Wait for server to be ready
        for i in {1..30}; do
            if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
                echo "   ✅ Server is ready"
                break
            fi
            sleep 1
        done
    else
        exit 1
    fi
fi

echo ""
echo "2. Testing Super Admin Login..."
echo "   Username: superadmin"
echo "   Password: super123"
echo ""

# Test login
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"super123"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   HTTP Status: $HTTP_CODE"
echo "   Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ LOGIN SUCCESSFUL!"
    echo ""
    echo "   User details:"
    echo "$BODY" | jq -r '.user | "   - Username: \(.username)\n   - Role: \(.role)\n   - ID: \(.id)"' 2>/dev/null || echo "   (Check response above)"
    echo ""
    echo "✅ Test passed!"
    exit 0
else
    echo "❌ LOGIN FAILED"
    echo ""
    echo "   Troubleshooting:"
    echo "   1. Make sure ALLOW_DEMO_PASSWORDS=true in .env"
    echo "   2. Make sure DEMO_PASSWORDS includes 'super123'"
    echo "   3. Make sure NODE_ENV=development"
    echo "   4. Restart the server after changing .env"
    echo ""
    exit 1
fi

