# Complete Guide: Setting Up WhatsApp Notifications for Telemedicine

## Overview

This guide covers all the steps required to send WhatsApp messages for telemedicine session notifications in the ClinicConnect platform.

---

## Prerequisites

1. **Twilio Account** - Sign up at [twilio.com](https://www.twilio.com)
2. **WhatsApp Business API Access** (or Twilio Sandbox for testing)
3. **Server Access** - To configure environment variables
4. **Patient Phone Numbers** - Must be in international format with country code

---

## Step-by-Step Setup

### Step 1: Create Twilio Account

1. Go to [twilio.com](https://www.twilio.com) and sign up
2. Verify your email address
3. Complete account setup (may require phone verification)

### Step 2: Get Twilio Credentials

1. **Log into Twilio Console**
   - Navigate to [console.twilio.com](https://console.twilio.com)

2. **Get Account SID**
   - Found on the dashboard homepage
   - Format: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy this value

3. **Get Auth Token**
   - Click "Show" next to Auth Token on dashboard
   - Format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy this value (keep it secret!)

### Step 3: Set Up WhatsApp (Choose One)

#### Option A: Twilio Sandbox (For Testing)

1. **Navigate to WhatsApp in Twilio Console**
   - Go to: Messaging → Try it out → Send a WhatsApp message
   - Or: [Console → Messaging → Try it out → WhatsApp](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)

2. **Join the Sandbox**
   - You'll see a sandbox number (usually `+14155238886`)
   - Send the join code to this number from your WhatsApp
   - Example: Send "join [code]" to `+14155238886`

3. **Note the Sandbox Number**
   - Format: `whatsapp:+14155238886`
   - This is your default "from" number

#### Option B: WhatsApp Business API (For Production)

1. **Apply for WhatsApp Business API**
   - In Twilio Console: Messaging → Settings → WhatsApp Senders
   - Click "Get Started" or "Request Access"
   - Complete the application process
   - Wait for approval (can take several days)

2. **Get Your WhatsApp Business Number**
   - Once approved, you'll receive a WhatsApp Business number
   - Format: `whatsapp:+[country code][number]`
   - Example: `whatsapp:+14155238886`

### Step 4: Configure Environment Variables

1. **Locate your `.env` file**
   - In the project root directory: `/Users/lacbis/clinicconnect/.env`

2. **Add Twilio Credentials**
   ```bash
   # Twilio WhatsApp Configuration
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

3. **Environment Variable Details:**
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID (required)
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token (required)
   - `TWILIO_WHATSAPP_FROM`: Your WhatsApp sender number (optional, defaults to sandbox)

### Step 5: Install Twilio SDK (Optional but Recommended)

The system works with or without the Twilio SDK, but the SDK provides better error handling:

```bash
npm install twilio
# or
yarn add twilio
```

**Note:** If the SDK is not installed, the system will use Twilio's REST API via fetch.

### Step 6: Ensure Patient Phone Numbers Are Correct

1. **Phone Number Format Requirements:**
   - Must include country code
   - Format: `+[country code][number]`
   - Examples:
     - US: `+1234567890`
     - UK: `+441234567890`
     - India: `+911234567890`

2. **Update Patient Records:**
   - Go to patient management in the application
   - Ensure phone numbers are in international format
   - Remove spaces, dashes, and parentheses
   - Add country code if missing

3. **Phone Number Validation:**
   - System automatically formats phone numbers
   - Minimum length: 12 characters (including `+` and country code)
   - System removes leading zeros and non-digit characters

### Step 7: Create a Telemedicine Session

1. **Navigate to Telemedicine Page**
   - Go to `/telemedicine` in the application

2. **Create or Select a Session**
   - Create a new telemedicine session
   - Or select an existing scheduled session

3. **Ensure Session Has:**
   - Patient assigned (with valid phone number)
   - Doctor assigned
   - Scheduled time set
   - Session type (video/audio/chat)

### Step 8: Send WhatsApp Notification

#### Via UI:

1. **Find the Session**
   - Locate the session in "Scheduled Sessions" list

2. **Click "Notify Patient"**
   - Button appears next to each session

3. **Select "Send WhatsApp"**
   - From the dropdown menu
   - Wait for confirmation

#### Via API:

```bash
POST /api/telemedicine/sessions/:id/send-notification
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "whatsapp"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "WhatsApp notification sent successfully",
  "type": "whatsapp",
  "recipient": "+1234567890",
  "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

---

## Complete Flow Diagram

```
1. User clicks "Notify Patient" → Selects "WhatsApp"
   ↓
2. Frontend sends POST request to /api/telemedicine/sessions/:id/send-notification
   ↓
3. Backend validates:
   - Session exists
   - Patient has phone number
   - Phone number format is valid
   ↓
4. Backend formats phone number:
   - Removes non-digits (except +)
   - Adds country code if missing
   - Validates minimum length
   ↓
5. Backend checks Twilio configuration:
   - TWILIO_ACCOUNT_SID exists?
   - TWILIO_AUTH_TOKEN exists?
   ↓
6. If configured:
   - Formats phone: whatsapp:+1234567890
   - Calls EmailService.sendTelemedicineWhatsApp()
   - Sends via Twilio API
   ↓
7. If not configured:
   - Logs message (development mode)
   - Returns success with messageId: 'logged-only'
   ↓
8. Response sent to frontend
   - Success: Shows success message
   - Error: Shows error details
```

---

## Troubleshooting

### Error: "Twilio credentials not found"

**Solution:**
- Verify environment variables are set:
  ```bash
  echo $TWILIO_ACCOUNT_SID
  echo $TWILIO_AUTH_TOKEN
  ```
- Restart the server after setting variables
- Check `.env` file is in project root

### Error: "Invalid phone number format"

**Solution:**
- Ensure phone number includes country code
- Format: `+[country code][number]`
- Minimum 12 characters total
- Remove spaces, dashes, parentheses

### Error: "Phone number not found on WhatsApp"

**Solution:**
- Verify recipient has WhatsApp installed
- For sandbox: recipient must join sandbox first
- Send join code to Twilio WhatsApp number
- For production: ensure number is registered on WhatsApp

### Error: "Unauthorized" or "Authentication failed"

**Solution:**
- Verify `TWILIO_ACCOUNT_SID` is correct
- Verify `TWILIO_AUTH_TOKEN` is correct
- Check for extra spaces in environment variables
- Regenerate Auth Token in Twilio Console if needed

### Error: "Sandbox recipient not joined"

**Solution (Sandbox Mode):**
1. Get join code from Twilio Console
2. Send join code to Twilio sandbox number via WhatsApp
3. Wait for confirmation
4. Try sending notification again

**Solution (Production):**
- Apply for WhatsApp Business API access
- Complete verification process
- Use approved WhatsApp Business number

### Message Shows "logged-only"

**Meaning:**
- Twilio is not configured
- Message was logged but not sent
- This is normal in development mode

**To Fix:**
- Set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Restart server
- Try again

---

## Testing

### Test WhatsApp Notification

```bash
# Using the test script
node test-whatsapp-notification.js

# Or via API
curl -X POST http://localhost:5001/api/telemedicine/sessions/3/send-notification \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "whatsapp"}'
```

### Check Configuration

```bash
# Verify environment variables
node -e "console.log('SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing');"
node -e "console.log('Token:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing');"
node -e "console.log('From:', process.env.TWILIO_WHATSAPP_FROM || 'Using sandbox');"
```

---

## Security Best Practices

1. **Never commit credentials to git**
   - Use `.env` file (already in `.gitignore`)
   - Use environment variables in production

2. **Rotate credentials regularly**
   - Change Auth Token every 90 days
   - Use different credentials for dev/staging/production

3. **Limit access**
   - Only authorized staff can send notifications
   - Role-based access: doctor, nurse, admin

4. **Audit logging**
   - All notifications are logged
   - Includes recipient, type, and timestamp

5. **Patient privacy**
   - Only send to verified patient phone numbers
   - Include opt-out instructions in messages
   - Comply with HIPAA regulations

---

## Cost Considerations

### Twilio Pricing

- **Sandbox**: Free (limited to 24-hour window)
- **WhatsApp Business API**: Pay-per-message
  - Varies by country
  - Check [Twilio Pricing](https://www.twilio.com/whatsapp/pricing)

### Cost Optimization

1. **Use sandbox for development/testing**
2. **Monitor usage in Twilio Console**
3. **Set up billing alerts**
4. **Consider message templates for lower costs**

---

## Production Checklist

- [ ] Twilio account created and verified
- [ ] WhatsApp Business API approved (or sandbox configured)
- [ ] Environment variables set in production
- [ ] Twilio SDK installed (optional)
- [ ] Patient phone numbers validated and formatted
- [ ] Test notification sent successfully
- [ ] Error handling tested
- [ ] Audit logging verified
- [ ] Billing alerts configured
- [ ] Security review completed

---

## Support Resources

- **Twilio Documentation**: [twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)
- **Twilio Console**: [console.twilio.com](https://console.twilio.com)
- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Code Reference**: `server/services/EmailService.ts` (lines 287-421)
- **Route Handler**: `server/routes.ts` (lines 10407-10538)

---

## Quick Reference

### Environment Variables
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # Optional
```

### Phone Number Format
```
+[country code][number]
Example: +1234567890 (US)
```

### API Endpoint
```
POST /api/telemedicine/sessions/:id/send-notification
Body: { "type": "whatsapp" }
```

### Required Roles
- doctor
- nurse
- admin

---

## Summary

**Minimum Requirements:**
1. Twilio account with Account SID and Auth Token
2. WhatsApp sandbox access (testing) or Business API (production)
3. Environment variables configured
4. Patient phone numbers in international format
5. Telemedicine session created

**That's it!** Once these are set up, WhatsApp notifications will work automatically when you click "Notify Patient" and select "Send WhatsApp".

