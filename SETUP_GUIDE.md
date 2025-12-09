# ClinicConnect Setup Guide

## Quick Start

### 1. Database Setup

This application requires a PostgreSQL database. You have two options:

#### Option A: Neon PostgreSQL (Recommended for Development)
1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb clinicconnect`
3. Get your connection string: `postgresql://localhost/clinicconnect`

### 2. Environment Variables

Create a `.env` file in the project root with the following **required** variables:

```bash
# REQUIRED - Database connection
DATABASE_URL=postgresql://user:password@host/database

# REQUIRED - Security secrets (generate with: openssl rand -base64 64)
JWT_SECRET=your-secure-jwt-secret-here
SESSION_SECRET=your-secure-session-secret-here
```

**Optional configuration:**

```bash
# Server configuration
PORT=5001                              # Server port (default: 5001)
NODE_ENV=development                   # Environment: development | production

# Session configuration
SESSION_TIMEOUT_MS=86400000            # Session timeout (default: 24 hours)
SESSION_COOKIE_MAX_AGE=2592000000      # Cookie max age (default: 30 days)

# Database pool configuration
DB_POOL_MAX=20                         # Max connections (default: 20)
DB_POOL_MIN=2                          # Min connections (default: 2)
DB_IDLE_TIMEOUT=30000                  # Idle timeout in ms (default: 30s)
DB_CONNECTION_TIMEOUT=10000            # Connection timeout (default: 10s)

# CORS (comma-separated origins for production)
ALLOWED_ORIGINS=https://app.example.com

# AI Services (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ **Security Note**: The server will fail to start without `JWT_SECRET` and `SESSION_SECRET`. Generate secure secrets using: `openssl rand -base64 64`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npx drizzle-kit push
```

### 5. Start the Development Servers

You need to run TWO servers:

#### Terminal 1 - Backend Server (Port 5001):
```bash
npm run dev
```

#### Terminal 2 - Frontend Server (Port 5173):
```bash
npx vite --host
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## Troubleshooting

### Port 5000 Conflict (macOS)

On macOS, port 5000 is often used by AirPlay Receiver. This is why we changed the backend to use port 5001.

If you see "403 Forbidden" errors in the browser console:
1. Make sure the backend server is running on port 5001
2. Make sure the frontend Vite server is running on port 5173
3. Restart the Vite server after changing `vite.config.ts`

### Database Connection Errors

If you see `DATABASE_URL must be set`:
1. Make sure you created a `.env` file
2. Make sure `DATABASE_URL` is set in the `.env` file
3. Make sure the database connection string is valid
4. Test the connection: `psql <your_database_url>`

### Backend Not Running

The browser will show errors like:
- `GET http://localhost:5173/api/notifications 403 (Forbidden)`
- `GET http://localhost:5173/api/patients 403 (Forbidden)`

This means the backend server is not running. Start it with:
```bash
npm run dev
```

## What Changed (Nov 29, 2025)

### Port Configuration
- **Before**: Backend on port 5000 (conflicts with macOS AirPlay)
- **After**: Backend on port 5001 (configurable via PORT env var)

### Files Modified
1. `server/index.ts` - Changed default port from 5000 to 5001
2. `vite.config.ts` - Updated proxy target from localhost:5000 to localhost:5001

### Why These Changes?

macOS uses port 5000 for AirPlay Receiver (ControlCenter service), which causes 403 Forbidden errors when trying to access the API. By moving to port 5001, we avoid this conflict.

## Architecture

```
┌─────────────────┐
│   Browser       │
│  localhost:5173 │
└────────┬────────┘
         │
         │ (Vite Dev Server)
         │
         ▼
┌─────────────────┐
│  Vite Proxy     │
│  /api → :5001   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express Server │
│  localhost:5001 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  (Neon/Local)   │
└─────────────────┘
```

## Default Login Credentials

After seeding the database, you can use:
- Username: `admin`
- Password: (check the seed files in `server/seedMockData.ts`)

Note: Authentication is currently disabled in development mode for easier testing.

