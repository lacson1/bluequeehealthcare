# Telemedicine Notification Guide

## Overview

The telemedicine platform now supports sending email and SMS notifications to patients when sessions are scheduled. This helps ensure patients are informed about their upcoming telemedicine consultations.

## Features

### 1. Email Notifications
- Professional HTML email template
- Includes session details (date, time, type, doctor)
- Session join link (when available)
- Preparation instructions
- Responsive design

### 2. SMS Notifications
- Concise text message with key details
- Session date, time, and type
- Join link (when available)

### 3. UI Integration
- "Notify Patient" button in session list
- Dropdown menu to choose email or SMS
- Visual feedback during sending
- Error handling with user-friendly messages

## Setup

### 1. Configure SendGrid (for Email)

1. **Get SendGrid API Key**
   - Sign up at [SendGrid](https://sendgrid.com)
   - Create an API key with "Mail Send" permissions
   - Copy the API key

2. **Set Environment Variables**
   ```bash
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Verify Sender Email**
   - In SendGrid dashboard, verify your sender email address
   - Or set up domain authentication for better deliverability

### 2. Configure SMS (Optional)

Currently, SMS notifications are logged only. To enable actual SMS sending:

1. **Choose SMS Provider**
   - Twilio (recommended)
   - AWS SNS
   - Other SMS gateway

2. **Update EmailService.ts**
   - Implement SMS sending in `sendSMS` method
   - Add provider credentials to environment variables

## Usage

### Sending Notifications from UI

1. **Navigate to Telemedicine Page**
   - Go to `/telemedicine` in the application

2. **Find Scheduled Session**
   - Locate the session in the "Scheduled Sessions" list

3. **Send Notification**
   - Click the "Notify Patient" button
   - Choose "Send Email" or "Send SMS" from dropdown
   - Wait for confirmation message

### Sending via API

#### Send Email Notification

```bash
POST /api/telemedicine/sessions/:id/send-notification
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "type": "email",
  "recipient": "patient@example.com",
  "messageId": "sg_message_id_123"
}
```

#### Send SMS Notification

```bash
POST /api/telemedicine/sessions/:id/send-notification
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "sms"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS notification sent successfully",
  "type": "sms",
  "recipient": "+1234567890",
  "messageId": "sms_id_123"
}
```

## Email Template

The email notification includes:

- **Header**: Gradient banner with "Telemedicine Session Scheduled"
- **Session Details Card**:
  - Session Type (Video/Audio/Chat)
  - Date and Time
  - Provider Name
- **Join Link** (if session URL is available):
  - Prominent button to join session
  - Fallback text link
- **Preparation Instructions**:
  - Be ready 5 minutes early
  - Stable internet connection
  - Camera/mic test (for video)
  - Quiet, private location
  - ID and insurance card ready
- **Rescheduling Notice**: Contact information for changes

## Error Handling

### Common Errors

1. **Patient has no email**
   ```json
   {
     "message": "Patient does not have an email address",
     "hasEmail": false
   }
   ```

2. **Patient has no phone**
   ```json
   {
     "message": "Patient does not have a phone number",
     "hasPhone": false
   }
   ```

3. **SendGrid API Error**
   - Check API key is correct
   - Verify sender email is verified
   - Check SendGrid account status

4. **Session Not Found**
   ```json
   {
     "message": "Session not found"
   }
   ```

## Development Mode

When `SENDGRID_API_KEY` is not set:
- Email notifications are logged to console
- SMS notifications are logged to console
- No actual emails/SMS are sent
- Useful for development and testing

## Best Practices

1. **Send Immediately After Scheduling**
   - Notify patients right after creating session
   - Gives them time to prepare

2. **Send Reminder 24 Hours Before**
   - Consider adding automated reminders
   - Reduces no-shows

3. **Include Session Link When Available**
   - Update session with URL before sending
   - Makes it easier for patients to join

4. **Verify Patient Contact Info**
   - Check email/phone before sending
   - Update patient records if needed

## Automated Notifications (Future)

Consider implementing:
- Automatic email on session creation
- 24-hour reminder emails
- 1-hour reminder SMS
- Session cancellation notifications
- Rescheduling confirmations

## Testing

### Test Email Notification

```bash
# Create a test session
POST /api/telemedicine/sessions
{
  "patientId": 1,
  "type": "video",
  "scheduledTime": "2024-01-20T10:00:00Z"
}

# Send notification
POST /api/telemedicine/sessions/{sessionId}/send-notification
{
  "type": "email"
}
```

### Test SMS Notification

```bash
POST /api/telemedicine/sessions/{sessionId}/send-notification
{
  "type": "sms"
}
```

## Troubleshooting

### Emails Not Sending

1. **Check SendGrid API Key**
   ```bash
   echo $SENDGRID_API_KEY
   ```

2. **Check Email From Address**
   - Must be verified in SendGrid
   - Or use authenticated domain

3. **Check SendGrid Dashboard**
   - View activity logs
   - Check for bounces or blocks

4. **Check Server Logs**
   - Look for error messages
   - Check email service initialization

### SMS Not Sending

1. **SMS is currently logged only**
   - Implement SMS provider integration
   - Update `EmailService.sendSMS()` method

## Security Considerations

1. **API Key Protection**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

2. **Patient Privacy**
   - Only send to verified patient emails/phones
   - Include opt-out instructions
   - Comply with HIPAA regulations

3. **Rate Limiting**
   - Consider rate limiting for notification endpoint
   - Prevent abuse

## Related Documentation

- [Telemedicine Platform Guide](./TELEMEDICINE_TESTING_GUIDE.md)
- [Telemedicine Appointment Integration](./TELEMEDICINE_APPOINTMENT_INTEGRATION.md)
- [Email Service Implementation](./server/services/EmailService.ts)

