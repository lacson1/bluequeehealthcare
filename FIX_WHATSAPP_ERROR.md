# Fix WhatsApp Notification 500 Error

## Problem
Getting 500 Internal Server Error when trying to send WhatsApp notifications:
```
POST http://localhost:5001/api/telemedicine/sessions/3/send-notification 500 (Internal Server Error)
Error: "Email service not available"
```

## Root Cause
The server is running old code and hasn't picked up the updated `EmailService.ts` file that includes Green API support.

## Solution: Restart the Server

### Step 1: Stop the Current Server
1. Find the terminal where the server is running
2. Press `Ctrl+C` to stop it
3. Wait for it to fully stop

### Step 2: Restart the Server
```bash
# Option 1: Using npm
npm run dev

# Option 2: Using yarn
yarn dev

# Option 3: Using tsx directly
npx tsx server/index.ts
```

### Step 3: Verify Server Started
Look for messages like:
- "Server running on port 5001"
- "EmailService initialized" (if SendGrid is configured)
- No error messages about EmailService

### Step 4: Test Again
1. Go to the telemedicine page
2. Click "Notify Patient" → "Send WhatsApp"
3. Should work now!

## If Still Getting Errors

### Check Server Console
Look at the server terminal for error messages. You should see:
- `Failed to import EmailService: [error details]` - This shows the actual error

### Common Issues:

1. **Syntax Error in EmailService.ts**
   - Check: `npx tsc --noEmit server/services/EmailService.ts`
   - Fix any TypeScript errors

2. **Module Not Found**
   - Make sure `server/services/EmailService.ts` exists
   - Check file path is correct

3. **Import Error**
   - Verify `@sendgrid/mail` is installed: `npm list @sendgrid/mail`
   - If missing: `npm install @sendgrid/mail`

## Quick Test Command

After restarting, test with:
```bash
node test-whatsapp-john-day.js
```

Or test via API:
```bash
curl -X POST http://localhost:5001/api/telemedicine/sessions/3/send-notification \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "whatsapp"}'
```

## Expected Behavior After Fix

✅ **If Green API is configured:**
- Message sent via Green API
- Returns `messageId` (not "logged-only")

✅ **If Twilio is configured:**
- Message sent via Twilio
- Returns Twilio message SID

✅ **If neither is configured:**
- Message logged to console
- Returns `messageId: "logged-only"`
- No error (this is expected in development)

## Still Having Issues?

1. Check server logs for detailed error messages
2. Verify `.env` file has correct paths
3. Make sure TypeScript compiles: `npx tsc --noEmit`
4. Check file permissions: `ls -la server/services/EmailService.ts`

