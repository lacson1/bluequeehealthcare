# Fix: "Failed to Fetch" Error

## The Problem

You're seeing a **"Failed to fetch"** error when trying to log in. This means the frontend cannot connect to the backend server.

## Root Cause

The backend server is **not running**. The frontend (Vite dev server) is trying to proxy API requests to `http://localhost:5001`, but there's nothing listening on that port.

## Quick Fix

### Start the Server

Open a terminal and run:

```bash
npm run dev
```

Or use the helper script:

```bash
bash START_SERVER.sh
```

This will:
- Start the Express backend server on port 5001
- Start the Vite frontend dev server (if not already running)
- Enable API proxying from frontend to backend

## Verify It's Working

After starting the server, you should see:
```
🚀 Server running on port 5001
```

Then try logging in again - the "failed to fetch" error should be gone.

## Complete Setup Checklist

For login to work, you need:

1. ✅ **Server running** - `npm run dev`
2. ⏳ **Docker running** - Start Docker Desktop
3. ⏳ **Database running** - `bash START_DATABASE.sh`

## Troubleshooting

### Server won't start?

Check for errors in the terminal. Common issues:
- Port 5001 already in use: `lsof -ti:5001 | xargs kill`
- Missing dependencies: `npm install`
- Environment variables: Check `.env` file exists

### Still getting "Failed to fetch"?

1. Check server is actually running:
   ```bash
   curl http://localhost:5001/api/health
   ```

2. Check browser console for detailed error

3. Verify Vite proxy is configured (should be in `vite.config.ts`)

### Server starts but login still fails?

This is likely a database issue. Make sure:
- Docker is running
- Database container is started: `bash START_DATABASE.sh`

## What Changed

I've improved the error message in the frontend to show a clearer message when the server isn't running, so you'll see:

> "Cannot Connect to Server - The backend server is not running. Please start it with: npm run dev"

Instead of just "Failed to fetch".

