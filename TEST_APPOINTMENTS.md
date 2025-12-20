# Appointment Testing Guide

## Available Appointment Endpoints

### 1. Get All Appointments
```bash
GET /api/appointments
GET /api/appointments?date=2024-01-15
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "patientId": 1,
    "doctorId": 2,
    "appointmentDate": "2024-01-15",
    "appointmentTime": "10:00",
    "duration": 30,
    "type": "consultation",
    "status": "scheduled",
    "notes": "Regular checkup",
    "patientName": "John",
    "patientLastName": "Doe",
    "doctorName": "Dr. Smith"
  }
]
```

### 2. Create Appointment
```bash
POST /api/appointments
```
**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "patientId": 1,
  "doctorId": 2,
  "appointmentDate": "2024-01-20",
  "appointmentTime": "10:00",
  "duration": 30,
  "type": "consultation",
  "notes": "Follow-up appointment"
}
```

**Required Fields:**
- `patientId` (number)
- `doctorId` (number)
- `appointmentDate` (string, YYYY-MM-DD)
- `appointmentTime` (string, HH:MM)

**Optional Fields:**
- `duration` (number, default: 30 minutes)
- `type` (string, default: "consultation")
- `notes` (string)
- `priority` (string: "low", "normal", "high", "urgent")

### 3. Update Appointment
```bash
PATCH /api/appointments/:id
```
**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "status": "confirmed",
  "notes": "Updated notes",
  "appointmentTime": "11:00"
}
```

**Status Values:**
- `scheduled`
- `confirmed`
- `in-progress`
- `completed`
- `cancelled`
- `no-show`

### 4. Get Patient Appointments
```bash
GET /api/patients/:patientId/appointments
```
**Headers:** `Authorization: Bearer <token>`

### 5. Start Consultation
```bash
POST /api/appointments/:id/start-consultation
```
**Headers:** `Authorization: Bearer <token>`

Changes appointment status to "in-progress"

### 6. Complete Consultation
```bash
POST /api/appointments/:id/complete-consultation
```
**Headers:** `Authorization: Bearer <token>`

Changes appointment status to "completed"

## Testing Methods

### Method 1: Using the Test Scripts

#### Bash Script (Linux/macOS)
```bash
./test-appointments.sh
```

#### Node.js Script
```bash
node test-appointments.js
```

**Note:** Update credentials in the scripts before running.

### Method 2: Using cURL

#### 1. Login first
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

#### 2. Get appointments
```bash
curl -X GET http://localhost:5001/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Create appointment
```bash
curl -X POST http://localhost:5001/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "doctorId": 2,
    "appointmentDate": "2024-01-20",
    "appointmentTime": "10:00",
    "duration": 30,
    "type": "consultation",
    "notes": "Test appointment"
  }'
```

### Method 3: Using Postman/Insomnia

1. Import the collection or create requests manually
2. Set base URL: `http://localhost:5001/api`
3. Add authentication token to headers: `Authorization: Bearer <token>`
4. Test each endpoint

### Method 4: Using the Frontend

1. Navigate to the appointments page in your application
2. Use the UI to create, view, and manage appointments
3. Check browser console for API calls and responses

## Common Test Scenarios

### Scenario 1: Create Appointment with Conflict
**Test:** Try to create two appointments for the same doctor at overlapping times.

**Expected:** Should return 409 Conflict with error message about time slot conflict.

### Scenario 2: Create Appointment Successfully
**Test:** Create appointment with valid data.

**Expected:** Should return 200 OK with appointment object.

### Scenario 3: Update Appointment Status
**Test:** Update appointment status from "scheduled" to "confirmed".

**Expected:** Should return updated appointment with new status.

### Scenario 4: Get Appointments by Date
**Test:** Get appointments for a specific date.

**Expected:** Should return only appointments for that date.

### Scenario 5: Start and Complete Consultation
**Test:** Start consultation, then complete it.

**Expected:** 
- Start: Status changes to "in-progress"
- Complete: Status changes to "completed"

## Error Handling

### Common Errors:

1. **400 Bad Request** - Missing required fields or invalid data
2. **401 Unauthorized** - Missing or invalid token
3. **403 Forbidden** - Insufficient permissions (need doctor/nurse/admin role)
4. **409 Conflict** - Time slot conflict with existing appointment
5. **500 Internal Server Error** - Server error (check logs)

## Troubleshooting

### Issue: "Organization context required"
**Solution:** Make sure the user has an `organizationId` set, or use a superadmin account.

### Issue: "Time slot conflict"
**Solution:** Choose a different time or cancel the conflicting appointment first.

### Issue: "Failed to create appointment"
**Solution:** 
- Check that patient and doctor IDs exist
- Verify date format is YYYY-MM-DD
- Verify time format is HH:MM
- Check user has required role (doctor, nurse, or admin)

## Database Queries for Testing

### Check appointments in database:
```sql
SELECT * FROM appointments ORDER BY appointment_date DESC LIMIT 10;
```

### Check for conflicts:
```sql
SELECT * FROM appointments 
WHERE doctor_id = 2 
  AND appointment_date = '2024-01-20'
  AND status != 'cancelled';
```

### Get appointment with patient and doctor info:
```sql
SELECT 
  a.*,
  p.first_name as patient_first_name,
  p.last_name as patient_last_name,
  u.username as doctor_username
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN users u ON a.doctor_id = u.id
ORDER BY a.appointment_date DESC;
```

