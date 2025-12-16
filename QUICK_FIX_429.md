# Quick Fix: 429 Too Many Requests Error

## The Problem

You're getting `429 Too Many Requests` because the rate limiter has blocked your IP after multiple failed login attempts.

## Solution: Restart the Server

The rate limit is stored in memory, so restarting the server clears it immediately.

### Option 1: Manual Restart (Recommended)

1. **Find the terminal where the server is running**
2. **Press `Ctrl+C`** to stop the server
3. **Restart it:**
   ```bash
   npm run dev
   ```

### Option 2: Use the Helper Script

```bash
bash clear-rate-limit.sh
```

This will:
- Find and stop the server process
- Give you instructions to restart it

### Option 3: Kill Process Manually

If you can't find the terminal:

```bash
# Find the process
lsof -ti:5001

# Kill it (replace PID with the number from above)
kill <PID>

# Then restart
npm run dev
```

## After Restarting

✅ Rate limit cache is cleared  
✅ New limit applies: **50 attempts per 15 minutes** (in development)  
✅ You can try logging in again immediately  

## Why This Happened

1. Multiple login attempts failed (likely due to database connection issues)
2. Each failed attempt counted toward the 10-attempt limit
3. After 10 attempts, the rate limiter blocked further requests
4. The limit is stored in memory, so it persists until the server restarts

## Prevention

Once you fix the database connection issue (start Docker and the database), login will work and you won't hit the rate limit unless you make 50+ failed attempts in 15 minutes.

## Next Steps

After clearing the rate limit:
1. ✅ Restart the server (clears rate limit)
2. ⏳ Start Docker Desktop
3. ⏳ Start the database: `bash START_DATABASE.sh`
4. ✅ Try logging in again

