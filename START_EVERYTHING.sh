#!/bin/bash
# Start everything needed for ClinicConnect

echo "🚀 Starting ClinicConnect"
echo "========================"
echo ""

# Check if server is already running
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "✅ Server is already running on port 5001"
    echo ""
    read -p "Do you want to restart it? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping existing server..."
        lsof -ti:5001 | xargs kill 2>/dev/null
        sleep 2
    else
        echo "Keeping existing server running"
        exit 0
    fi
fi

echo "📦 Starting backend server..."
echo ""
echo "The server will start in the background."
echo "Check the output for any errors."
echo ""

# Start server in background and capture output
npm run dev > /tmp/clinicconnect-server.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

# Check if server started successfully
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "✅ Server started successfully on port 5001"
    echo "   PID: $SERVER_PID"
    echo ""
    echo "📋 Server logs: tail -f /tmp/clinicconnect-server.log"
    echo ""
    echo "🛑 To stop the server: kill $SERVER_PID"
    echo "   OR: lsof -ti:5001 | xargs kill"
else
    echo "❌ Server failed to start"
    echo ""
    echo "Check the logs:"
    echo "   cat /tmp/clinicconnect-server.log"
    echo ""
    exit 1
fi

echo "✅ Backend server is ready!"
echo ""
echo "Next steps:"
echo "  1. Make sure Docker is running"
echo "  2. Start database: bash START_DATABASE.sh"
echo "  3. Try logging in at http://localhost:5173"

