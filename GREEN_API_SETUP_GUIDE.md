# Free WhatsApp Setup Guide - Green API

## Overview

This guide shows you how to set up **FREE** WhatsApp messaging for telemedicine notifications using Green API. Green API provides a free tier with **100 messages per day** - perfect for small clinics and development.

## Why Green API?

✅ **100% FREE** - 100 messages/day free tier  
✅ **No credit card required**  
✅ **Easy setup** - Just scan QR code  
✅ **No sandbox limitations** - Works with any WhatsApp number  
✅ **Simple API** - REST API, no SDK needed  
✅ **Reliable** - Used by thousands of developers  

---

## Step 1: Create Green API Account

1. **Visit Green API**
   - Go to [https://green-api.com](https://green-api.com)
   - Click "Sign Up" or "Get Started"

2. **Register Account**
   - Enter your email address
   - Create a password
   - Verify your email

3. **Login to Dashboard**
   - Go to [https://console.green-api.com](https://console.green-api.com)
   - Login with your credentials

---

## Step 2: Create WhatsApp Instance

1. **Create New Instance**
   - In the dashboard, click "Create Instance" or "Add Instance"
   - Give it a name (e.g., "ClinicConnect Telemedicine")

2. **Get Your Credentials**
   - After creating, you'll see:
     - **Instance ID** (e.g., `1101234567`)
     - **API Token** (long string like `abc123def456...`)
   - **Copy both values** - you'll need them for configuration

---

## Step 3: Connect WhatsApp

1. **Get QR Code**
   - In your instance dashboard, click "QR Code" or "Connect WhatsApp"
   - A QR code will appear

2. **Scan with WhatsApp**
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code from Green API dashboard

3. **Wait for Connection**
   - After scanning, wait a few seconds
   - The dashboard should show "Connected" status
   - Your WhatsApp is now linked!

**Important:** Keep your phone connected to the internet. Green API uses WhatsApp Web protocol, so your phone needs to be online for messages to send.

---

## Step 4: Configure Environment Variables

1. **Open your `.env` file**
   - Located in project root: `/Users/lacbis/clinicconnect/.env`

2. **Add Green API Credentials**
   ```bash
   # Green API Configuration (FREE WhatsApp)
   GREEN_API_ID=1101234567
   GREEN_API_TOKEN=your_api_token_here
   ```

3. **Example:**
   ```bash
   GREEN_API_ID=1101234567
   GREEN_API_TOKEN=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
   ```

4. **Save the file**

5. **Restart your server**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   # or
   yarn dev
   ```

---

## Step 5: Test WhatsApp Sending

### Test via UI:

1. **Go to Telemedicine Page**
   - Navigate to `/telemedicine` in your app

2. **Create/Select Session**
   - Create a new telemedicine session
   - Or select an existing one

3. **Send Notification**
   - Click "Notify Patient"
   - Select "Send WhatsApp"
   - Check if message is sent successfully

### Test via API:

```bash
curl -X POST http://localhost:5001/api/telemedicine/sessions/3/send-notification \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "whatsapp"}'
```

### Test via Node.js:

Create a test file `test-green-api.js`:

```javascript
const fetch = require('node-fetch');

const GREEN_API_ID = process.env.GREEN_API_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const TEST_PHONE = '+1234567890'; // Replace with your phone number

async function testGreenAPI() {
  if (!GREEN_API_ID || !GREEN_API_TOKEN) {
    console.error('❌ Green API credentials not set!');
    console.log('Set GREEN_API_ID and GREEN_API_TOKEN in .env file');
    return;
  }

  const apiUrl = `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: `${TEST_PHONE}@c.us`,
        message: 'Test message from ClinicConnect! 🏥',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.idMessage) {
      console.log('✅ WhatsApp sent successfully!');
      console.log('Message ID:', data.idMessage);
    } else {
      console.error('❌ Failed to send:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGreenAPI();
```

Run it:
```bash
node test-green-api.js
```

---

## How It Works

### Priority Order:

1. **Green API (FREE)** - Used if `GREEN_API_ID` and `GREEN_API_TOKEN` are set
2. **Twilio (PAID)** - Used if Green API not configured but Twilio credentials exist
3. **Logging Only** - If neither is configured (development mode)

### Phone Number Format:

- **Format:** `+[country code][number]`
- **Examples:**
  - US: `+1234567890`
  - UK: `+441234567890`
  - India: `+911234567890`

The system automatically:
- Removes spaces, dashes, parentheses
- Adds country code if missing
- Validates minimum length (12 characters)

---

## Troubleshooting

### Error: "Green API credentials not found"

**Solution:**
- Check `.env` file has `GREEN_API_ID` and `GREEN_API_TOKEN`
- Restart server after adding variables
- Verify no extra spaces in values

### Error: "Instance not found" or "Invalid token"

**Solution:**
- Double-check Instance ID and API Token
- Make sure you copied the full token (it's long!)
- Verify instance is active in Green API dashboard

### Error: "WhatsApp not connected"

**Solution:**
- Go to Green API dashboard
- Check instance status
- Re-scan QR code if needed
- Ensure phone is connected to internet

### Messages not sending

**Check:**
1. Phone is online and connected to internet
2. WhatsApp is open on phone (or running in background)
3. Instance shows "Connected" in dashboard
4. Phone number format is correct (`+countrycode...`)
5. Free tier limit not exceeded (100 messages/day)

### "Rate limit exceeded"

**Solution:**
- Free tier: 100 messages/day
- Wait 24 hours or upgrade to paid plan
- Check usage in Green API dashboard

---

## Free Tier Limits

- **100 messages per day** (resets at midnight UTC)
- **Unlimited instances** (can create multiple)
- **No expiration** (free forever)
- **All features included**

### Upgrade Options (Optional):

If you need more:
- **Starter:** $10/month - 1,000 messages/day
- **Business:** $50/month - 10,000 messages/day
- **Enterprise:** Custom pricing

---

## Security Best Practices

1. **Keep API Token Secret**
   - Never commit to git
   - Use `.env` file (already in `.gitignore`)
   - Rotate token if exposed

2. **Monitor Usage**
   - Check Green API dashboard regularly
   - Set up alerts for unusual activity

3. **Phone Security**
   - Use a dedicated phone/WhatsApp account for production
   - Enable two-factor authentication on WhatsApp
   - Keep phone secure and charged

---

## Comparison: Green API vs Twilio

| Feature | Green API (FREE) | Twilio (PAID) |
|---------|-----------------|---------------|
| **Cost** | Free (100/day) | Pay per message |
| **Setup** | QR code scan | Business API approval |
| **Sandbox** | No sandbox needed | Sandbox required for testing |
| **Phone Required** | Yes (WhatsApp Web) | No |
| **Reliability** | High | Very High |
| **Support** | Community | Enterprise support |
| **Best For** | Small clinics, dev | Large scale, production |

---

## Production Checklist

- [ ] Green API account created
- [ ] Instance created and connected
- [ ] Credentials added to `.env`
- [ ] Server restarted
- [ ] Test message sent successfully
- [ ] Phone number format validated
- [ ] Monitoring set up
- [ ] Backup plan considered (if needed)

---

## Support Resources

- **Green API Docs:** [https://green-api.com/docs/](https://green-api.com/docs/)
- **API Reference:** [https://green-api.com/docs/api/](https://green-api.com/docs/api/)
- **Dashboard:** [https://console.green-api.com](https://console.green-api.com)
- **Support:** [support@green-api.com](mailto:support@green-api.com)

---

## Quick Reference

### Environment Variables:
```bash
GREEN_API_ID=1101234567
GREEN_API_TOKEN=your_token_here
```

### API Endpoint:
```
POST https://api.green-api.com/waInstance{id}/sendMessage/{token}
```

### Phone Format:
```
+[country code][number]
Example: +1234567890
```

### Code Location:
- Implementation: `server/services/EmailService.ts` (lines 328-413)
- Route Handler: `server/routes.ts` (lines 10407-10538)

---

## Summary

**That's it!** With Green API, you can send WhatsApp messages for **FREE**:

1. ✅ Sign up at green-api.com
2. ✅ Create instance and get credentials
3. ✅ Scan QR code to connect WhatsApp
4. ✅ Add credentials to `.env`
5. ✅ Restart server
6. ✅ Start sending messages!

**No credit card, no payment, no sandbox limitations - just free WhatsApp messaging!** 🎉

