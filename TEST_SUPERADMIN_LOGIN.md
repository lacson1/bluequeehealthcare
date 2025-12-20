# Super Admin Login Demo Test Guide

## Quick Test

To test the super admin login demo, follow these steps:

### 1. Start the Server

```bash
# Make sure you're in the project root
cd /Users/lacbis/clinicconnect

# Start the development server
npm run dev
```

### 2. Configure Demo Passwords (if needed)

The demo login requires environment variables to be set. Create or update your `.env` file:

```bash
# Enable demo passwords in development
ALLOW_DEMO_PASSWORDS=true

# Set demo passwords (comma-separated)
DEMO_PASSWORDS=super123,admin123,doctor123,nurse123

# Make sure you're in development mode
NODE_ENV=development
```

### 3. Test the Login

#### Option A: Using the Test Script

```bash
# Run the simple test script
node test-superadmin-login.js superadmin super123

# Or use the full test suite
node test-super-admin-control.js superadmin super123
```

#### Option B: Using cURL

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"super123"}' \
  -v
```

#### Option C: Using the Web Interface

1. Open your browser to `http://localhost:5001`
2. Click on the "Super Admin" button in the demo login section
3. Or manually enter:
   - Username: `superadmin`
   - Password: `super123`

### 4. Expected Response

On successful login, you should receive:

```json
{
  "message": "Login successful",
  "user": {
    "id": <user_id>,
    "username": "superadmin",
    "role": "superadmin",
    "organizationId": null
  },
  "token": "<jwt_token>" // if using token auth
}
```

And a session cookie will be set (if using session-based auth).

### 5. Troubleshooting

#### Server Not Running
```bash
# Check if server is running
curl http://localhost:5001/api/health

# If not running, start it
npm run dev
```

#### Demo Passwords Not Working
- Make sure `ALLOW_DEMO_PASSWORDS=true` in your `.env` file
- Make sure `NODE_ENV=development` (not production)
- Make sure `DEMO_PASSWORDS` includes `super123`
- Restart the server after changing `.env` file

#### User Not Found Error
- The demo login will create a fallback user if the username doesn't exist in the database
- Make sure demo passwords are enabled
- Check server logs for authentication details

### 6. Test Credentials

Default demo credentials:
- **Super Admin**: `superadmin` / `super123`
- **Admin**: `admin` / `admin123`
- **Doctor**: `ade` / `doctor123`
- **Nurse**: `syb` / `nurse123`
- **Receptionist**: `receptionist` / `receptionist123`
- **Pharmacist**: `akin` / `pharmacist123`
- **Physiotherapist**: `seye` / `physio123`

### 7. Security Notes

⚠️ **IMPORTANT**: 
- Demo passwords are **ONLY** enabled in development mode
- They are **DISABLED** in production automatically
- Never set `ALLOW_DEMO_PASSWORDS=true` in production
- These credentials are for testing purposes only

### 8. Full Test Suite

To run the complete super admin test suite:

```bash
node test-super-admin-control.js superadmin super123
```

This will test:
- ✅ Authentication
- ✅ Organization Management
- ✅ User Management
- ✅ System Controls
- ✅ Security Features
- ✅ Analytics
- ✅ And more...

