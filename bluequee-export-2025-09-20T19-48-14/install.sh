#!/bin/bash

echo "🏥 Bluequee Healthcare System - Auto Setup"
echo "========================================"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
node_version=$(node -v 2>/dev/null | cut -c 2-)
if [ -z "$node_version" ]; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $node_version"

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found"
else
    echo "⚠️  PostgreSQL not found. You'll need to install it manually."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env with your database credentials"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🗄️  Database setup..."
echo "   Run 'npm run db:push' after configuring your database"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your database credentials"
echo "2. Run: npm run db:push"
echo "3. Run: npm run dev"
echo ""
echo "📖 Read DEVELOPER_SETUP.md for detailed instructions"
