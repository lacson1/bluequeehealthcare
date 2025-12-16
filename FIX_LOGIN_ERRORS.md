# Fix Login Errors: 500 and 429

## Current Issues

1. **500 Internal Server Error** - Database connection failure
2. **429 Too Many Requests** - Rate limiting from repeated failed attempts

## Step-by-Step Fix

### Step 1: Fix Rate Limiting (Do This First)

The rate limiter is in-memory, so restarting the server clears it:

1. **Stop the server:**
   - Press `Ctrl+C` in the terminal where the server is running
   - Or find the process and kill it

2. **Restart the server:**
   ```bash
   npm run dev
   ```

   This will:
   - Clear the rate limit cache
   - Apply the new higher limit (50 attempts in dev mode instead of 10)

### Step 2: Fix Database Connection

1. **Start Docker Desktop:**
   - Open Docker Desktop from Applications
   - Wait until it's fully running (check menu bar icon)

2. **Start the database:**
   ```bash
   bash START_DATABASE.sh
   ```
   
   Or manually:
   ```bash
   docker start clinicconnect-postgres
   ```

3. **Verify database is running:**
   ```bash
   docker ps | grep clinicconnect-postgres
   ```

### Step 3: Test Login

After both steps are complete, try logging in again. It should work!

## What Changed

- ✅ Increased development rate limit from 10 to 50 attempts per 15 minutes
- ✅ Rate limit automatically clears when server restarts
- ✅ Better error messages for database connection issues

## If Still Having Issues

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check database container:**
   ```bash
   docker ps -a | grep clinicconnect-postgres
   ```

3. **Check server logs** for detailed error messages

4. **Verify .env file:**
   ```bash
   cat .env | grep DATABASE_URL
   ```
   Should show: `DATABASE_URL=postgresql://clinicuser:clinic_dev_2024@localhost:5434/clinicconnect`

