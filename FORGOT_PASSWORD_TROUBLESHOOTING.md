# Forgot Password Email Troubleshooting

## Issue: "Failed to send reset email"

### Common Causes

1. **SendGrid API Key Not Configured** (Most Common)
   - The `SENDGRID_API_KEY` is empty or missing in `.env`
   - In development mode, emails are logged but not sent
   - Check your `.env` file for `SENDGRID_API_KEY=`

2. **User Doesn't Have Email Address**
   - The user account doesn't have an email address set
   - Check the database: `SELECT id, username, email FROM users WHERE username = 'your_username';`

3. **Invalid Email Address Format**
   - The email address in the database is invalid
   - Check for typos or malformed email addresses

4. **SendGrid Configuration Issues**
   - Invalid API key
   - SendGrid account issues
   - Rate limiting

## Solutions

### Solution 1: Configure SendGrid (Production)

1. Sign up for SendGrid account: https://sendgrid.com
2. Create an API key with "Mail Send" permissions
3. Add to your `.env` file:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```
4. Restart your server

### Solution 2: Development Mode (No Email Required)

In development mode, when SendGrid is not configured:
- The reset token is still generated and saved to the database
- The reset URL is logged to the console
- You can manually copy the URL from the server logs

**To get the reset URL:**
1. Request password reset via the UI
2. Check your server console logs - you'll see:
   ```
   ⚠️  EMAIL SERVICE NOT CONFIGURED
   📧 Password reset URL (for testing): http://localhost:5173/reset-password?token=...
   ```
3. Copy the URL and open it in your browser

### Solution 3: Check User Email Address

Run this SQL query to check if user has email:
```sql
SELECT id, username, email, first_name, last_name 
FROM users 
WHERE username = 'your_username' OR email = 'your_email@example.com';
```

If email is NULL or empty, update it:
```sql
UPDATE users 
SET email = 'user@example.com' 
WHERE username = 'your_username';
```

### Solution 4: Test Email Service Directly

You can test if SendGrid is working by checking the server logs when requesting a password reset:

**Success (Email Sent):**
```
Password reset email sent { username: '...', email: '...', messageId: '...' }
```

**Success (Development - Logged Only):**
```
Email service not configured. Reset URL (dev only): { resetUrl: '...' }
⚠️  EMAIL SERVICE NOT CONFIGURED
📧 Password reset URL (for testing): http://localhost:5173/reset-password?token=...
```

**Error (Email Failed):**
```
Failed to send password reset email { username: '...', email: '...', error: '...' }
```

## Testing Without Email

Even without email configured, you can test the password reset flow:

1. **Request Reset:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser"}'
   ```

2. **Get Reset Token from Database:**
   ```sql
   SELECT id, username, email, password_reset_token, password_reset_expires
   FROM users 
   WHERE username = 'testuser';
   ```

3. **Use Reset URL:**
   ```
   http://localhost:5173/reset-password?token=YOUR_TOKEN_FROM_DB
   ```

4. **Or Reset via API:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token": "YOUR_TOKEN", "newPassword": "NewPassword123!"}'
   ```

## Environment Variables

Required for production email sending:
```env
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com  # For reset links
```

Optional (development):
```env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Debugging Steps

1. **Check .env file:**
   ```bash
   grep SENDGRID_API_KEY .env
   grep EMAIL_FROM .env
   ```

2. **Check server logs** when requesting password reset

3. **Check database** for reset token:
   ```sql
   SELECT * FROM users WHERE password_reset_token IS NOT NULL;
   ```

4. **Test email service directly:**
   - Check SendGrid dashboard for email delivery status
   - Verify API key permissions in SendGrid

## Notes

- The system always returns success to prevent user enumeration (security best practice)
- In development, reset URLs are logged to console when email isn't configured
- Reset tokens expire after 1 hour
- Only one active reset token per user (new request invalidates old token)

