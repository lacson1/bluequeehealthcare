#!/bin/bash
# Quick script to start the server

echo "🚀 Starting ClinicConnect Server"
echo "================================"
echo ""

# Check if server is already running
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "⚠️  Server is already running on port 5001"
    echo ""
    echo "To restart, first stop it:"
    echo "  lsof -ti:5001 | xargs kill"
    echo ""
    exit 0
fi

echo "Starting server..."
echo ""
echo "The server will start on: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev

