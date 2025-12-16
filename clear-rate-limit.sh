#!/bin/bash
# Script to help clear rate limits by restarting the server

echo "🔄 Clearing Rate Limits"
echo "======================"
echo ""
echo "This script will help you restart the server to clear rate limits."
echo ""

# Find server processes
SERVER_PIDS=$(lsof -ti:5001 2>/dev/null)

if [ -z "$SERVER_PIDS" ]; then
    echo "❌ No server process found on port 5001"
    echo ""
    echo "The server might not be running, or it's running on a different port."
    echo "To start the server, run: npm run dev"
    exit 1
fi

echo "📋 Found server process(es) on port 5001:"
echo "$SERVER_PIDS"
echo ""

read -p "Do you want to kill these processes and restart the server? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Stopping server..."
    kill $SERVER_PIDS 2>/dev/null
    sleep 2
    
    # Check if processes are still running
    REMAINING=$(lsof -ti:5001 2>/dev/null)
    if [ ! -z "$REMAINING" ]; then
        echo "⚠️  Some processes are still running. Force killing..."
        kill -9 $REMAINING 2>/dev/null
        sleep 1
    fi
    
    echo "✅ Server stopped"
    echo ""
    echo "🚀 To restart the server, run:"
    echo "   npm run dev"
    echo ""
    echo "This will:"
    echo "  ✅ Clear the rate limit cache"
    echo "  ✅ Apply the new higher rate limit (50 attempts in dev mode)"
    echo ""
else
    echo "Cancelled."
    echo ""
    echo "To manually restart:"
    echo "  1. Press Ctrl+C in the terminal where the server is running"
    echo "  2. Run: npm run dev"
fi

