# Telemedicine Platform Testing Guide

## Overview

This document provides a comprehensive guide to testing the Telemedicine Platform in ClinicConnect. The platform enables remote consultations between healthcare providers and patients through video, audio, or chat sessions.

## Test Coverage

### 1. Backend API Tests

**Location:** `server/routes/__tests__/telemedicine.test.ts`

**Coverage:**
- ✅ GET `/api/telemedicine/sessions` - Fetch all sessions
- ✅ POST `/api/telemedicine/sessions` - Create new session
- ✅ PATCH `/api/telemedicine/sessions/:id` - Update session
- ✅ Session status transitions (scheduled → active → completed)
- ✅ Error handling and validation
- ✅ Different session types (video, audio, chat)

**Run Tests:**
```bash
npm test -- server/routes/__tests__/telemedicine.test.ts
```

### 2. Frontend Component Tests

**Location:** `client/src/pages/__tests__/telemedicine.test.tsx`

**Coverage:**
- ✅ Component rendering
- ✅ Session list display
- ✅ Schedule session dialog
- ✅ Active session view
- ✅ Session controls (video, audio, end call)
- ✅ Session notes functionality
- ✅ Form validation
- ✅ User interactions

**Run Tests:**
```bash
npm test -- client/src/pages/__tests__/telemedicine.test.tsx
```

### 3. Integration Tests

**Location:** `test-telemedicine.js`

**Coverage:**
- ✅ End-to-end workflow testing
- ✅ Authentication flow
- ✅ Session creation workflow
- ✅ Session lifecycle (scheduled → active → completed)
- ✅ Multiple session types
- ✅ Session filtering and permissions

**Run Tests:**
```bash
node test-telemedicine.js
```

**Environment Variables:**
```bash
API_BASE_URL=http://localhost:3000
TEST_USERNAME=admin
TEST_PASSWORD=admin123
```

## Test Scenarios

### Scenario 1: Schedule a New Session

1. **Login** as a doctor/nurse/admin
2. **Navigate** to Telemedicine page
3. **Click** "Schedule Session" button
4. **Select** a patient from dropdown
5. **Choose** session type (video/audio/chat)
6. **Set** scheduled time
7. **Submit** the form
8. **Verify** session appears in the list with "scheduled" status

### Scenario 2: Start a Session

1. **Find** a scheduled session
2. **Click** "Start Session" button
3. **Verify** session status changes to "active"
4. **Verify** session URL is generated
5. **Verify** active session view appears
6. **Verify** video interface is displayed

### Scenario 3: Conduct a Session

1. **Start** a session (from Scenario 2)
2. **Toggle** video on/off
3. **Toggle** audio on/off
4. **Enter** consultation notes
5. **Save** notes
6. **Verify** notes are saved

### Scenario 4: Complete a Session

1. **During** an active session
2. **Click** "End Call" button
3. **Verify** session status changes to "completed"
4. **Verify** duration is recorded
5. **Verify** session notes are preserved

### Scenario 5: View Completed Sessions

1. **Navigate** to Telemedicine page
2. **Find** completed sessions
3. **Click** "View Session" button
4. **Verify** session details are displayed
5. **Verify** notes and duration are shown

## API Endpoints

### GET `/api/telemedicine/sessions`

**Description:** Fetch all telemedicine sessions

**Authentication:** Required (Bearer token)

**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "patientId": 1,
    "patientName": "John Doe",
    "doctorId": 1,
    "doctorName": "Dr. Smith",
    "scheduledTime": "2024-01-15T10:00:00Z",
    "status": "scheduled",
    "type": "video",
    "sessionUrl": null,
    "notes": null,
    "duration": null
  }
]
```

**Filtering:**
- Doctors see only their own sessions
- Admins see all sessions in their organization
- Filtered by `organizationId` and `doctorId`

### POST `/api/telemedicine/sessions`

**Description:** Create a new telemedicine session

**Authentication:** Required (Bearer token)

**Required Roles:** doctor, nurse, admin

**Request Body:**
```json
{
  "patientId": 1,
  "type": "video",
  "scheduledTime": "2024-01-20T10:00:00Z",
  "status": "scheduled"
}
```

**Response:**
```json
{
  "id": 3,
  "patientId": 1,
  "doctorId": 1,
  "scheduledTime": "2024-01-20T10:00:00Z",
  "status": "scheduled",
  "type": "video",
  "sessionUrl": null,
  "notes": null,
  "duration": null,
  "createdAt": "2024-01-15T08:00:00Z"
}
```

### PATCH `/api/telemedicine/sessions/:id`

**Description:** Update an existing telemedicine session

**Authentication:** Required (Bearer token)

**Request Body (all fields optional):**
```json
{
  "status": "active",
  "sessionUrl": "https://meet.clinic.com/room-1",
  "notes": "Patient consultation notes",
  "duration": 30
}
```

**Response:**
```json
{
  "id": 1,
  "patientId": 1,
  "doctorId": 1,
  "scheduledTime": "2024-01-15T10:00:00Z",
  "status": "active",
  "type": "video",
  "sessionUrl": "https://meet.clinic.com/room-1",
  "notes": "Patient consultation notes",
  "duration": 30
}
```

## Session Status Flow

```
scheduled → active → completed
     ↓
 cancelled
```

**Status Descriptions:**
- `scheduled`: Session is scheduled but not started
- `active`: Session is currently in progress
- `completed`: Session has ended successfully
- `cancelled`: Session was cancelled before starting

## Session Types

1. **Video** (`video`): Video call with audio and video
2. **Audio** (`audio`): Audio-only call
3. **Chat** (`chat`): Text-based chat session

## Testing Checklist

### Backend Tests
- [x] GET sessions returns array
- [x] GET sessions includes patient and doctor names
- [x] POST creates session with valid data
- [x] POST validates required fields
- [x] POST accepts all session types
- [x] PATCH updates session status
- [x] PATCH updates session notes
- [x] PATCH updates session to completed
- [x] PATCH returns 404 for non-existent session
- [x] Error handling works correctly

### Frontend Tests
- [x] Page renders correctly
- [x] Sessions list displays
- [x] Schedule dialog opens
- [x] Form validation works
- [x] Active session view displays
- [x] Session controls work
- [x] Notes can be saved
- [x] Statistics display

### Integration Tests
- [x] Login and authentication
- [x] Create test patient
- [x] Create session
- [x] Update session status
- [x] Complete session
- [x] Test all session types
- [x] Session filtering

## Running All Tests

```bash
# Run all telemedicine tests
npm test -- telemedicine

# Run with coverage
npm test -- telemedicine --coverage

# Run in watch mode
npm test -- telemedicine --watch
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure test user credentials are correct
   - Check that JWT token is being sent in headers
   - Verify user has required role (doctor, nurse, or admin)

2. **Session Not Found**
   - Verify session ID exists in database
   - Check that user has permission to access the session
   - Ensure organization filtering is correct

3. **Validation Errors**
   - Check that all required fields are provided
   - Verify date format is ISO 8601
   - Ensure patientId and doctorId are valid integers

4. **Frontend Tests Failing**
   - Ensure React Query is properly mocked
   - Check that API endpoints are mocked correctly
   - Verify test utilities are imported correctly

## Future Enhancements

- [ ] Add WebRTC integration tests
- [ ] Add session recording tests
- [ ] Add multi-participant session tests
- [ ] Add session timeout tests
- [ ] Add notification tests for session reminders
- [ ] Add analytics and reporting tests

## Related Documentation

- [API Guide](./API_GUIDE.md)
- [RBAC System Guide](./RBAC_SYSTEM_GUIDE.md)
- [Testing Setup Guide](./TESTING_SETUP_COMPLETE.md)

