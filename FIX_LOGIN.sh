#!/bin/bash
# Comprehensive login fix script

echo "🔍 Diagnosing Login Issues"
echo "=========================="
echo ""

# Check 1: Server Status
echo "1️⃣  Checking server status..."
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "   ✅ Server is running on port 5001"
    SERVER_RUNNING=true
else
    echo "   ❌ Server is NOT running on port 5001"
    SERVER_RUNNING=false
fi
echo ""

# Check 2: Docker Status
echo "2️⃣  Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo "   ✅ Docker is running"
    DOCKER_RUNNING=true
else
    echo "   ❌ Docker is NOT running"
    echo "   → Please start Docker Desktop from Applications"
    DOCKER_RUNNING=false
fi
echo ""

# Check 3: Database Container
echo "3️⃣  Checking database container..."
if [ "$DOCKER_RUNNING" = true ]; then
    if docker ps --format '{{.Names}}' | grep -q "clinicconnect-postgres"; then
        echo "   ✅ Database container is running"
        DB_RUNNING=true
    else
        if docker ps -a --format '{{.Names}}' | grep -q "clinicconnect-postgres"; then
            echo "   ⚠️  Database container exists but is not running"
            echo "   → Starting database container..."
            docker start clinicconnect-postgres > /dev/null 2>&1
            sleep 3
            if docker ps --format '{{.Names}}' | grep -q "clinicconnect-postgres"; then
                echo "   ✅ Database container started"
                DB_RUNNING=true
            else
                echo "   ❌ Failed to start database container"
                DB_RUNNING=false
            fi
        else
            echo "   ❌ Database container does not exist"
            echo "   → Run: bash setup-dev-db.sh"
            DB_RUNNING=false
        fi
    fi
else
    echo "   ⏭️  Skipping (Docker not running)"
    DB_RUNNING=false
fi
echo ""

# Check 4: Test Login Endpoint
echo "4️⃣  Testing login endpoint..."
if [ "$SERVER_RUNNING" = true ]; then
    RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}' 2>&1)
    
    if echo "$RESPONSE" | grep -q "Too Many Requests"; then
        echo "   ❌ Rate limit active (429 error)"
        echo "   → Solution: Restart the server to clear rate limit"
    elif echo "$RESPONSE" | grep -q "DATABASE_ERROR\|Database user does not exist"; then
        echo "   ❌ Database connection error"
        echo "   → Solution: Start Docker and database container"
    elif echo "$RESPONSE" | grep -q "success.*true"; then
        echo "   ✅ Login endpoint is working!"
    else
        echo "   ⚠️  Unexpected response:"
        echo "$RESPONSE" | head -3
    fi
else
    echo "   ⏭️  Skipping (Server not running)"
fi
echo ""

# Summary and Actions
echo "📋 Summary & Actions Needed"
echo "============================"
echo ""

FIXES_NEEDED=0

if [ "$SERVER_RUNNING" = false ]; then
    echo "❌ START THE SERVER:"
    echo "   npm run dev"
    echo ""
    FIXES_NEEDED=$((FIXES_NEEDED + 1))
fi

if [ "$DOCKER_RUNNING" = false ]; then
    echo "❌ START DOCKER:"
    echo "   1. Open Docker Desktop from Applications"
    echo "   2. Wait for it to fully start"
    echo ""
    FIXES_NEEDED=$((FIXES_NEEDED + 1))
fi

if [ "$DOCKER_RUNNING" = true ] && [ "$DB_RUNNING" = false ]; then
    echo "❌ START DATABASE:"
    echo "   bash START_DATABASE.sh"
    echo "   OR"
    echo "   docker start clinicconnect-postgres"
    echo ""
    FIXES_NEEDED=$((FIXES_NEEDED + 1))
fi

if [ $FIXES_NEEDED -eq 0 ]; then
    echo "✅ Everything looks good!"
    echo ""
    echo "Try logging in with:"
    echo "   Username: admin"
    echo "   Password: admin123"
else
    echo "⚠️  $FIXES_NEEDED issue(s) need to be fixed above"
fi

echo ""
echo "After fixing the issues, run this script again to verify:"
echo "   bash FIX_LOGIN.sh"

