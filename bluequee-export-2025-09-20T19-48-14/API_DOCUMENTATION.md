# Bluequee API Documentation

## Base URL
`https://your-domain.com/api`

## Authentication
All protected endpoints require session authentication.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Logout
```http
POST /api/auth/logout
```

### Get Current User
```http
GET /api/auth/me
```

## Patients

### List Patients
```http
GET /api/patients
```

### Create Patient
```http
POST /api/patients
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "phone": "string",
  "email": "string",
  "address": "string"
}
```

### Get Patient
```http
GET /api/patients/:id
```

### Update Patient
```http
PUT /api/patients/:id
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  // ... other fields
}
```

## Visits

### List Patient Visits
```http
GET /api/patients/:patientId/visits
```

### Create Visit
```http
POST /api/patients/:patientId/visits
Content-Type: application/json

{
  "visitType": "string",
  "chiefComplaint": "string",
  "diagnosis": "string",
  "treatmentPlan": "string",
  "vitalSigns": {
    "bloodPressure": "string",
    "heartRate": "string",
    "temperature": "string"
  }
}
```

## Lab Results

### List Lab Results
```http
GET /api/lab-results
```

### Create Lab Result
```http
POST /api/lab-results
Content-Type: application/json

{
  "patientId": "number",
  "testName": "string",
  "result": "string",
  "status": "string",
  "dateOrdered": "YYYY-MM-DD"
}
```

## Prescriptions

### List Prescriptions
```http
GET /api/prescriptions
```

### Create Prescription
```http
POST /api/prescriptions
Content-Type: application/json

{
  "patientId": "number",
  "medication": "string",
  "dosage": "string",
  "frequency": "string",
  "duration": "string"
}
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
