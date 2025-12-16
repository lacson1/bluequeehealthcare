# How to Reset Rate Limits

## Problem
You're getting `429 Too Many Requests` errors after multiple failed login attempts.

## Quick Fix: Restart the Server

The rate limiter is in-memory, so restarting the server will clear all rate limits:

```bash
# Stop the server (Ctrl+C in the terminal where it's running)
# Then restart it:
npm run dev
```

## Rate Limit Details

- **Development:** 50 login attempts per 15 minutes
- **Production:** 10 login attempts per 15 minutes
- **Window:** 15 minutes (resets automatically after this time)

## Alternative: Wait 15 Minutes

The rate limit automatically resets after 15 minutes. You can wait and try again.

## Root Cause

The rate limiting was triggered because:
1. Multiple login attempts failed (due to database connection issues)
2. Each failed attempt counted toward the limit
3. After 10 attempts, the rate limiter blocked further requests

## Prevention

Once the database is running and login works, you won't hit the rate limit unless you make 50+ failed attempts in 15 minutes.

