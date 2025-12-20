# Telemedicine Appointment Integration

## Overview

The telemedicine platform now supports scheduling sessions directly from appointments. When an appointment is selected, the system automatically populates the patient, doctor, and scheduled time fields.

## Changes Made

### 1. Database Schema

**File:** `shared/schema.ts`

- Added `appointmentId` field to `telemedicineSessions` table (optional foreign key to `appointments`)
- Added relation between `telemedicineSessions` and `appointments` tables

```typescript
appointmentId: integer('appointment_id').references(() => appointments.id)
```

### 2. Backend API Updates

**File:** `server/routes.ts`

#### GET `/api/telemedicine/sessions`
- Now includes `appointmentId` in the response

#### POST `/api/telemedicine/sessions`
- Accepts optional `appointmentId` in request body
- When `appointmentId` is provided:
  - Fetches the appointment from database
  - Auto-populates `patientId` from appointment
  - Auto-populates `doctorId` from appointment
  - Combines `appointmentDate` and `appointmentTime` into `scheduledTime`
- Validates that appointment exists (returns 404 if not found)

### 3. Frontend Updates

**File:** `client/src/pages/telemedicine.tsx`

#### New Features:
- **Appointment Selection Dropdown**: Added at the top of the schedule session form
- **Auto-population**: When an appointment is selected:
  - Patient field is auto-filled and disabled
  - Scheduled time is auto-filled and disabled
  - Doctor is automatically set (from appointment)
- **Manual Scheduling**: Users can still schedule sessions manually without selecting an appointment

#### New State Variables:
- `selectedAppointmentId`: Tracks the selected appointment
- `appointments`: Fetches appointments list from API

#### New Functions:
- `handleAppointmentSelect`: Handles appointment selection and auto-populates fields

## Usage

### Scheduling from Appointment

1. Click "Schedule Session" button
2. Select an appointment from the "Appointment (Optional)" dropdown
3. Patient and scheduled time are automatically filled
4. Select session type (video/audio/chat)
5. Click "Schedule Session"

### Manual Scheduling

1. Click "Schedule Session" button
2. Leave "Appointment (Optional)" as "None - Schedule manually"
3. Manually select patient
4. Manually set scheduled time
5. Select session type
6. Click "Schedule Session"

## API Examples

### Create Session from Appointment

```bash
POST /api/telemedicine/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentId": 123,
  "type": "video",
  "status": "scheduled"
}
```

**Response:**
```json
{
  "id": 456,
  "patientId": 1,
  "doctorId": 2,
  "appointmentId": 123,
  "scheduledTime": "2024-01-20T10:00:00Z",
  "status": "scheduled",
  "type": "video",
  "sessionUrl": null,
  "notes": null,
  "duration": null
}
```

### Create Session Manually

```bash
POST /api/telemedicine/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": 1,
  "type": "video",
  "scheduledTime": "2024-01-20T10:00:00Z",
  "status": "scheduled"
}
```

## Database Migration

To apply these changes to your database, run:

```sql
ALTER TABLE telemedicine_sessions 
ADD COLUMN appointment_id INTEGER REFERENCES appointments(id);
```

Or use Drizzle Kit:

```bash
npm run db:push
```

## Benefits

1. **Reduced Data Entry**: No need to manually enter patient and time when scheduling from appointment
2. **Data Consistency**: Ensures telemedicine session matches appointment details
3. **Workflow Integration**: Seamlessly connects appointment scheduling with telemedicine
4. **Flexibility**: Still supports manual session scheduling when needed

## Testing

### Test Appointment Selection

1. Create an appointment for a patient
2. Navigate to Telemedicine page
3. Click "Schedule Session"
4. Select the appointment from dropdown
5. Verify patient and time are auto-filled
6. Schedule the session
7. Verify session is created with correct `appointmentId`

### Test Manual Scheduling

1. Navigate to Telemedicine page
2. Click "Schedule Session"
3. Leave appointment as "None"
4. Manually select patient and set time
5. Schedule the session
6. Verify session is created without `appointmentId`

## Future Enhancements

- [ ] Show appointment details in session list
- [ ] Link back to appointment from session view
- [ ] Auto-update appointment status when session starts/completes
- [ ] Filter sessions by appointment
- [ ] Bulk schedule sessions from multiple appointments

