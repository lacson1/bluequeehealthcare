# Patient Messages Functionality Test

## Overview

This document describes the test script for the Patient Messages functionality, which allows staff members to view, read, and reply to patient messages.

## Test Script

The expanded test script `test-patient-messages.js` includes **12 comprehensive test suites**:

### 1. GET /api/staff/messages
- **Purpose**: Retrieve all staff messages
- **Tests**:
  - Fetches all messages for the authenticated staff member
  - Categorizes messages by status (unread, read, replied)
  - Displays message details including patient name, subject, type, and priority

### 2. GET /api/staff/messages/:id
- **Purpose**: Get single message details
- **Tests**:
  - Retrieves complete message information
  - Verifies all message fields are present
  - Validates message data structure

### 3. PATCH /api/staff/messages/:id/read
- **Purpose**: Mark a message as read
- **Tests**:
  - Marks an unread message as read
  - Updates the `readAt` timestamp
  - Verifies status change

### 4. Bulk Mark as Read
- **Purpose**: Test bulk operations
- **Tests**:
  - Marks multiple messages as read simultaneously
  - Handles partial failures gracefully
  - Reports success/failure counts

### 5. POST /api/staff/messages/:id/reply
- **Purpose**: Reply to a patient message
- **Tests**:
  - Sends a reply to a patient message
  - Creates a new message with "Re:" prefix
  - Marks the original message as "replied"
  - Updates the `repliedAt` timestamp

### 6. Message Filtering
- **Tests**:
  - Filters messages by status (unread, read, replied, all)
  - Filters by priority (urgent, high, normal, low)
  - Filters by message type (medical, appointment, lab_result, general)
  - Tests filter combinations (e.g., urgent + unread)

### 7. Message Statistics & Analytics
- **Tests**:
  - Calculates statistics by status, priority, and type
  - Groups messages by date (today, this week, this month, older)
  - Calculates average response time for replied messages
  - Provides comprehensive analytics dashboard

### 8. Message Search
- **Tests**:
  - Searches messages by subject and content
  - Tests multiple search terms
  - Validates search result accuracy
  - Tests complex filter combinations

### 9. Performance Testing
- **Tests**:
  - Measures API response times
  - Runs multiple iterations for accuracy
  - Calculates average, min, and max response times
  - Provides performance recommendations

### 10. Message Routing & Assignment
- **Tests**:
  - Analyzes message assignment patterns
  - Tests routing by role and reason
  - Validates assignment logic
  - Reports routing statistics

### 11. Patient Information
- **Tests**:
  - Validates patient data completeness
  - Identifies messages with missing patient info
  - Groups messages by patient
  - Tests patient data quality

### 12. Error Handling
- **Tests**:
  - Invalid message ID (404 response)
  - Empty reply message (400 response)
  - Authentication errors
  - Network errors
  - Malformed requests

## Usage

### Prerequisites

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Ensure you have test credentials**:
   - Default: `admin` / `admin123`
   - Or set environment variables:
     ```bash
     export TEST_USERNAME=your_username
     export TEST_PASSWORD=your_password
     ```

### Running the Tests

```bash
# Basic usage (uses default localhost:5000)
node test-patient-messages.js

# With custom API URL
API_URL=http://localhost:5000 node test-patient-messages.js

# With custom credentials
TEST_USERNAME=admin TEST_PASSWORD=admin123 node test-patient-messages.js

# All options
API_URL=http://localhost:5000 TEST_USERNAME=admin TEST_PASSWORD=admin123 node test-patient-messages.js
```

## Expected Output

```
🧪 Patient Messages API Test Suite (Expanded)
=============================================
Base URL: http://localhost:5000
Test User: admin

🔐 Logging in...
✅ Login successful

📨 Test 1: Get all staff messages
GET /api/staff/messages
✅ Success! Found 5 messages
   - Unread: 2
   - Read: 2
   - Replied: 1
   - All: 5

   Sample messages:
   1. [SENT] Appointment Reminder
      From: John Doe
      Type: appointment, Priority: normal
      Sent: 12/15/2024, 10:30:00 AM
   ...

📋 Test 6: Get single message details
GET /api/staff/messages/1
✅ Success! Retrieved message details
   ID: 1
   Subject: Appointment Reminder
   From: John Doe
   Type: appointment
   Priority: normal
   Status: sent
   Message: Your appointment is scheduled for...

👁️  Test 2: Mark message as read
PATCH /api/staff/messages/1/read
✅ Success! Message marked as read
   Message ID: 1
   Status: read
   Read at: 12/15/2024, 11:00:00 AM

📚 Test 7: Bulk mark messages as read
   Marking 3 messages as read...
   ✅ Successfully marked 3 messages as read

💬 Test 3: Reply to a message
POST /api/staff/messages/1/reply
✅ Success! Reply sent
   Reply ID: 6
   Subject: Re: Appointment Reminder
   Status: sent
   ✅ Original message marked as replied

🔍 Test 4: Filter messages by status
   Filter results:
   - UNREAD: 2 messages
   - READ: 2 messages
   - REPLIED: 1 messages
   - ALL: 5 messages

📊 Test 8: Message statistics and analytics
   📈 Statistics:
   - Total Messages: 5
   - By Status:
     • sent: 2
     • read: 2
     • replied: 1
   - By Priority:
     • normal: 4
     • high: 1
   - By Type:
     • appointment: 2
     • general: 2
     • lab_result: 1
   - By Date:
     • Today: 3
     • This Week: 2
     • This Month: 0
     • Older: 0
   - Average Response Time: 45 minutes

🔎 Test 9: Message search and filtering
   Testing search functionality:
   - Search "appointment": 2 results
   - Search "lab": 1 results
   Testing filter combinations:
   - Urgent + Unread: 1
   - Medical + Replied: 0
   - Today's messages: 3

🎯 Test 11: Message routing and assignment
   Routing Statistics:
   - Assigned: 3
   - Unassigned: 2
   - By Role:
     • doctor: 3
     • nurse: 2

👤 Test 12: Patient information in messages
   Patient Data Quality:
   - Messages with patient info: 5
   - Messages without patient info: 0
   - Unique patients: 3
   Sample patients:
   1. John Doe (2 messages)
      Phone: +1234567890
   2. Jane Smith (2 messages)
      Phone: +0987654321

⚡ Test 10: Performance testing
   Running 5 requests to measure performance...
   Request 1: 125ms
   Request 2: 98ms
   Request 3: 112ms
   Request 4: 105ms
   Request 5: 110ms
   Performance Summary:
   - Average: 110ms
   - Min: 98ms
   - Max: 125ms
   ✅ Response time is good (<500ms)

⚠️  Test 5: Error handling
   Testing invalid message ID...
   ✅ Correctly returns 404 for non-existent message
   Testing reply without message body...
   ✅ Correctly returns 400 for empty reply

==================================================
✅ All tests completed!
==================================================

📊 Test Summary:
- Total Duration: 2.45s
- Tests Passed: 12
- Tests Failed: 0
- Tests Skipped: 0
- Total Messages: 5
- Unread: 2
- Read: 2
- Replied: 1
```

## API Endpoints Reference

### GET /api/staff/messages
Returns all messages for the authenticated staff member's organization.

**Response:**
```json
[
  {
    "id": 1,
    "subject": "Appointment Reminder",
    "message": "Your appointment is scheduled for...",
    "messageType": "appointment",
    "priority": "normal",
    "status": "sent",
    "sentAt": "2024-12-15T10:30:00Z",
    "readAt": null,
    "repliedAt": null,
    "recipientType": "Staff",
    "recipientRole": "doctor",
    "routingReason": "Appointment related",
    "patientId": 1,
    "patientName": "John Doe",
    "patientPhone": "+1234567890"
  }
]
```

### PATCH /api/staff/messages/:id/read
Marks a message as read.

**Response:**
```json
{
  "id": 1,
  "status": "read",
  "readAt": "2024-12-15T11:00:00Z"
}
```

### POST /api/staff/messages/:id/reply
Sends a reply to a patient message.

**Request Body:**
```json
{
  "reply": "Thank you for your message. We will get back to you soon."
}
```

**Response:**
```json
{
  "id": 6,
  "subject": "Re: Appointment Reminder",
  "message": "Thank you for your message...",
  "status": "sent",
  "patientId": 1,
  "staffId": 2
}
```

## Troubleshooting

### Server Connection Error
```
Cannot connect to server at http://localhost:5000
```
**Solution**: Make sure the server is running with `npm run dev`

### Authentication Error
```
Login failed: 403 - Access forbidden
```
**Solution**: 
- Check your credentials
- Ensure the user account exists and is active
- Verify the user has staff role permissions

### No Messages Found
```
✅ Success! Found 0 messages
```
**Solution**: 
- This is normal if no patient messages have been sent
- You can create test messages through the patient portal or API

## Frontend Integration

The Patient Messages UI is located at:
- **Page**: `client/src/pages/staff-messages.tsx`
- **Route**: `/staff-messages`

The UI displays:
- **Tabs**: Unread, Read, Replied, All
- **Message List**: Left panel with message previews
- **Message Details**: Right panel with full message content
- **Reply Functionality**: Dialog to send replies to patients

## Related Files

- **API Routes**: `server/routes.ts` (lines 12460-12589)
- **Frontend Page**: `client/src/pages/staff-messages.tsx`
- **Schema**: `shared/schema.ts` (messages table)
- **Notifications**: `server/routes/notifications.ts` (includes message notifications)

