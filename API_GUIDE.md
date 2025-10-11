# Bluequee API Documentation

## Overview

Bluequee provides three types of APIs to access your clinic management system:

1. **Public REST API** (`/api/v1/*`) - Full-featured API for third-party integrations
2. **Mobile API** (`/api/mobile/*`) - Lightweight API optimized for mobile apps
3. **API Keys Management** (`/api/api-keys/*`) - Manage your API access keys

## Getting Started

### 1. Generate an API Key

Only administrators can generate API keys. Log in to your Bluequee account and navigate to the API management section.

**Endpoint:** `POST /api/api-keys/generate`

**Authentication:** Session-based (admin/super_admin role required)

**Request Body:**
```json
{
  "name": "My Integration",
  "permissions": ["patients:read", "appointments:read"],
  "rateLimit": 1000,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "message": "API key created successfully. Save this key, it will only be shown once!",
  "apiKey": "a1b2c3d4e5f6g7h8i9j0...",
  "keyInfo": {
    "id": 1,
    "name": "My Integration",
    "permissions": ["patients:read", "appointments:read"],
    "rateLimit": 1000,
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-10-11T13:17:00.000Z"
  }
}
```

⚠️ **Important:** Save the API key immediately! It will only be shown once for security reasons.

### 2. Using Your API Key

Include your API key in the `X-API-Key` header for all API requests:

```bash
curl -H "X-API-Key: YOUR_API_KEY_HERE" \
  https://your-clinic.replit.app/api/v1/patients
```

## Public REST API (`/api/v1`)

Full-featured API with comprehensive data access.

### Health Check
```bash
GET /api/v1/health
```

### Patients

**List Patients**
```bash
GET /api/v1/patients?limit=50&offset=0
```

**Get Patient by ID**
```bash
GET /api/v1/patients/{id}
```

### Appointments

**List Appointments**
```bash
GET /api/v1/appointments?status=scheduled&from=2025-10-01&to=2025-10-31
```

**Query Parameters:**
- `limit` - Number of records (default: 50)
- `offset` - Skip records for pagination (default: 0)
- `status` - Filter by status: scheduled, confirmed, completed, cancelled
- `from` - Filter appointments from date (YYYY-MM-DD)
- `to` - Filter appointments until date (YYYY-MM-DD)

### Prescriptions

**List Prescriptions**
```bash
GET /api/v1/prescriptions?patientId=123&status=active
```

**Query Parameters:**
- `limit` - Number of records (default: 50)
- `offset` - Skip records for pagination
- `patientId` - Filter by patient ID
- `status` - Filter by prescription status

### Lab Results

**List Lab Results**
```bash
GET /api/v1/lab-results?patientId=123&from=2025-09-01&to=2025-10-31
```

**Query Parameters:**
- `limit` - Number of records (default: 50)
- `offset` - Skip records for pagination
- `patientId` - Filter by patient ID
- `from` - Filter from date (YYYY-MM-DD)
- `to` - Filter until date (YYYY-MM-DD)

### Vital Signs

**List Vital Signs**
```bash
GET /api/v1/vital-signs?patientId=123&limit=10
```

**Query Parameters:**
- `limit` - Number of records (default: 50)
- `offset` - Skip records for pagination
- `patientId` - Filter by patient ID
- `from` - Filter from timestamp
- `to` - Filter until timestamp

### Organization

**Get Organization Info**
```bash
GET /api/v1/organization
```

## Mobile API (`/api/mobile`)

Optimized endpoints with minimal payload for mobile applications.

### Dashboard Stats
```bash
GET /api/mobile/dashboard/stats
```

**Response:**
```json
{
  "patients": 150,
  "appointments": 12,
  "labs": 5,
  "prescriptions": 45
}
```

### Patient Endpoints

**Patient Summary (List)**
```bash
GET /api/mobile/patients/summary?limit=20&offset=0
```

**Patient Info (Detail)**
```bash
GET /api/mobile/patients/{id}/info
```

**Patient Recent Vitals**
```bash
GET /api/mobile/patients/{id}/vitals/recent
```

**Patient Active Prescriptions**
```bash
GET /api/mobile/patients/{id}/prescriptions/active
```

**Patient Recent Labs**
```bash
GET /api/mobile/patients/{id}/labs/recent?limit=10
```

### Appointments

**Today's Appointments**
```bash
GET /api/mobile/appointments/today
```

**Upcoming Appointments**
```bash
GET /api/mobile/appointments/upcoming?limit=10
```

### Quick Search
```bash
GET /api/mobile/search?q=john&limit=10
```

## API Keys Management

Manage your organization's API keys (admin only).

### List API Keys
```bash
GET /api/api-keys/list
```

### Deactivate API Key
```bash
PATCH /api/api-keys/{id}/deactivate
```

### Activate API Key
```bash
PATCH /api/api-keys/{id}/activate
```

### Delete API Key
```bash
DELETE /api/api-keys/{id}
```

## Permissions

Available permissions for API keys:

- `*` - Full access (all permissions)
- `patients:read` - Read patient data
- `appointments:read` - Read appointments
- `prescriptions:read` - Read prescriptions
- `lab:read` - Read lab results
- `vitals:read` - Read vital signs

**Example:** Create an API key with specific permissions:
```json
{
  "name": "Read-Only Integration",
  "permissions": ["patients:read", "appointments:read"]
}
```

## Rate Limiting

- Default: 1000 requests per hour per API key
- Configurable when creating API key
- Rate limit resets every hour
- 429 status code when limit exceeded

**Response when rate limited:**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 1000 requests per hour",
  "resetAt": "2025-10-11T14:00:00.000Z"
}
```

## Error Responses

All APIs return standard error responses:

**401 Unauthorized**
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

**403 Forbidden**
```json
{
  "error": "Insufficient permissions",
  "message": "This API key does not have the required permissions"
}
```

**404 Not Found**
```json
{
  "error": "Patient not found"
}
```

**429 Rate Limit Exceeded**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 1000 requests per hour",
  "resetAt": "2025-10-11T14:00:00.000Z"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch patients"
}
```

## Interactive API Documentation

Visit the Swagger UI documentation at:
```
https://your-clinic.replit.app/api/docs
```

The OpenAPI specification is available at:
```
https://your-clinic.replit.app/api/docs/openapi.json
```

## Code Examples

### JavaScript/Node.js
```javascript
const apiKey = 'your-api-key-here';

async function getPatients() {
  const response = await fetch('https://your-clinic.replit.app/api/v1/patients', {
    headers: {
      'X-API-Key': apiKey
    }
  });
  
  const data = await response.json();
  console.log(data);
}

getPatients();
```

### Python
```python
import requests

api_key = 'your-api-key-here'
headers = {'X-API-Key': api_key}

response = requests.get(
    'https://your-clinic.replit.app/api/v1/patients',
    headers=headers
)

print(response.json())
```

### cURL
```bash
curl -H "X-API-Key: your-api-key-here" \
  https://your-clinic.replit.app/api/v1/patients
```

## Best Practices

1. **Secure Your API Keys**
   - Never commit API keys to version control
   - Store keys in environment variables
   - Rotate keys regularly

2. **Use Permissions Wisely**
   - Only grant necessary permissions
   - Create separate keys for different integrations
   - Use read-only permissions when possible

3. **Handle Rate Limits**
   - Implement exponential backoff
   - Cache responses when appropriate
   - Monitor your usage

4. **Mobile Optimization**
   - Use Mobile API endpoints for mobile apps
   - Minimize data transfer with focused queries
   - Implement local caching

5. **Error Handling**
   - Always check response status codes
   - Implement retry logic for 5xx errors
   - Handle rate limits gracefully

## Support

For API support, contact:
- Email: api@bluequee.com
- Documentation: https://your-clinic.replit.app/api/docs
