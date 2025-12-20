# Forgot Password Feature - Testing Guide

## Quick Test Steps

### Option 1: Test via Web UI (Recommended)

1. **Start the server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open the login page**:
   - Navigate to: `http://localhost:5001/login`
   - Or: `http://localhost:5173/login` (if using Vite dev server)

3. **Click "Forgot password?" link**:
   - Located below the password field

4. **Enter username or email**:
   - Username: `admin`
   - Or email: `admin@democlinic.ng`

5. **Submit the form**:
   - Click "Send Reset Link" button

6. **Check server console**:
   - If email is not configured, you'll see:
     ```
     ⚠️  EMAIL SERVICE NOT CONFIGURED
     📧 Password reset URL (for testing): http://localhost:5173/reset-password?token=...
     ```
   - Copy the URL and open it in your browser

7. **Reset your password**:
   - Enter new password
   - Confirm password
   - Click "Reset Password"

8. **Login with new password**:
   - Go back to login page
   - Use your new password

### Option 2: Test via API (cURL)

1. **Request password reset**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"username":"admin"}'
   ```

2. **Get reset token from database**:
   ```sql
   SELECT id, username, email, password_reset_token, password_reset_expires
   FROM users 
   WHERE username = 'admin';
   ```

3. **Verify token** (optional):
   ```bash
   curl http://localhost:5001/api/auth/verify-reset-token/YOUR_TOKEN_HERE
   ```

4. **Reset password**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "token": "YOUR_TOKEN_HERE",
       "newPassword": "NewPassword123!"
     }'
   ```

### Option 3: Test via Node.js Script

```bash
# Test forgot password request
node test-forgot-password.js admin

# Test with email
node test-forgot-password.js admin admin@democlinic.ng

# Test full flow with token
node test-forgot-password.js admin admin@democlinic.ng YOUR_TOKEN_HERE
```

## Expected Results

### Success Response (Forgot Password Request)
```json
{
  "success": true,
  "data": null,
  "message": "If an account exists with that username or email, a password reset link has been sent."
}
```

### Success Response (Password Reset)
```json
{
  "success": true,
  "data": null,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

### Error Response (Invalid Token)
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid or expired reset token"
  }
}
```

## Test Users

Available test users (check database for actual credentials):

- **Admin**: `admin` / `admin123` (email: `admin@democlinic.ng`)
- **Doctor**: `ade` / `doctor123`
- **Nurse**: `syb` / `nurse123`
- **Super Admin**: `superadmin` / `super123`

## Troubleshooting

### Issue: Route not found (404)
**Solution**: Restart the server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Issue: Email not sending
**Solution**: Check server console for reset URL (development mode)
- The reset URL will be logged to console
- Copy and use it directly

### Issue: User not found
**Solution**: Check if user exists and has email:
```sql
SELECT id, username, email FROM users WHERE username = 'admin';
```

### Issue: Token expired
**Solution**: Request a new reset token (tokens expire after 1 hour)

## Database Queries for Testing

### Check reset token:
```sql
SELECT 
  id, 
  username, 
  email, 
  password_reset_token, 
  password_reset_expires,
  CASE 
    WHEN password_reset_expires > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as token_status
FROM users 
WHERE password_reset_token IS NOT NULL;
```

### Clear reset token (for testing):
```sql
UPDATE users 
SET password_reset_token = NULL, 
    password_reset_expires = NULL 
WHERE username = 'admin';
```

## Security Notes

- ✅ System always returns success (prevents user enumeration)
- ✅ Tokens expire after 1 hour
- ✅ Only one active token per user
- ✅ Tokens are cleared after successful reset
- ✅ Password strength validation enforced

## Next Steps

After testing:
1. Configure SendGrid for production email sending
2. Set `FRONTEND_URL` in `.env` for production
3. Test with real email addresses
4. Verify email delivery in SendGrid dashboard

