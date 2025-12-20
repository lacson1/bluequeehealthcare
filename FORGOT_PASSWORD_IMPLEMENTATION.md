# Forgot Password Feature Implementation

## Overview
A complete forgot password feature has been implemented, allowing users to reset their passwords via email. This includes both frontend UI components and backend API endpoints.

## Features Implemented

### 1. Backend API Endpoints

#### POST `/api/auth/forgot-password`
- Accepts username or email
- Generates a secure reset token (32-byte hex string)
- Saves token to database with 1-hour expiration
- Sends password reset email with reset link
- Returns success message even if user doesn't exist (security best practice to prevent user enumeration)

#### POST `/api/auth/reset-password`
- Accepts reset token and new password
- Validates token expiration
- Validates password strength
- Updates password and clears reset token
- Returns success message

#### GET `/api/auth/verify-reset-token/:token`
- Verifies if a reset token is valid and not expired
- Used by frontend to check token before showing reset form

### 2. Frontend Pages

#### `/forgot-password`
- Form to enter username or email
- Sends reset request to backend
- Shows success message after submission
- Includes "Back to Login" link

#### `/reset-password`
- Accepts token from URL query parameter
- Verifies token validity on page load
- Form to enter new password and confirm password
- Password visibility toggle
- Shows success message and redirects to login after 3 seconds
- Handles invalid/expired tokens gracefully

### 3. Email Template
- Professional HTML email template
- Includes reset button and fallback link
- Security warnings about token expiration
- Responsive design

### 4. Login Page Integration
- Added "Forgot password?" link below password field
- Links to `/forgot-password` page

### 5. Internationalization
- All UI text translated in English, French, and Spanish
- Translation keys added for:
  - Forgot password form
  - Reset password form
  - Success/error messages
  - Token verification messages

## Security Features

1. **Token Security**
   - 32-byte cryptographically secure random tokens
   - 1-hour expiration time
   - Tokens cleared after successful password reset

2. **User Enumeration Prevention**
   - Always returns success message, even if user doesn't exist
   - Prevents attackers from discovering valid usernames/emails

3. **Password Validation**
   - Minimum length requirement (6 characters)
   - Password strength validation via SecurityManager
   - Password confirmation matching

4. **Token Verification**
   - Tokens verified before allowing password reset
   - Expired tokens rejected with clear error messages

## Database Schema

Uses existing fields in `users` table:
- `passwordResetToken` (varchar, 100 chars)
- `passwordResetExpires` (timestamp)

## Environment Variables

The reset URL uses:
- `FRONTEND_URL` (preferred)
- `APP_URL` (fallback)
- `http://localhost:5173` (development default)

Add to `.env`:
```env
FRONTEND_URL=https://yourdomain.com
```

## Email Configuration

Requires SendGrid API key configured:
```env
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

If SendGrid is not configured, emails will be logged but not sent (development mode).

## Usage Flow

1. User clicks "Forgot password?" on login page
2. User enters username or email on forgot password page
3. System sends email with reset link (if user exists)
4. User clicks link in email
5. User is taken to reset password page with token in URL
6. System verifies token validity
7. User enters new password and confirms
8. System updates password and clears token
9. User is redirected to login page

## Testing

To test the feature:

1. **Request Password Reset:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser"}'
   ```

2. **Verify Token:**
   ```bash
   curl http://localhost:5001/api/auth/verify-reset-token/YOUR_TOKEN
   ```

3. **Reset Password:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token": "YOUR_TOKEN", "newPassword": "NewPassword123!"}'
   ```

## Files Modified/Created

### Backend
- `server/routes/auth.ts` - Added forgot password and reset password endpoints
- `server/services/EmailService.ts` - Added `sendPasswordResetEmail` method

### Frontend
- `client/src/pages/login.tsx` - Added "Forgot password?" link
- `client/src/pages/forgot-password.tsx` - New page (created)
- `client/src/pages/reset-password.tsx` - New page (created)
- `client/src/App.tsx` - Added routes for new pages
- `client/src/lib/i18n.ts` - Added translations for all auth-related text

## Notes

- The feature follows security best practices
- All user-facing text is internationalized
- Email template is responsive and professional
- Error handling is comprehensive
- Token expiration prevents abuse
- User enumeration is prevented

