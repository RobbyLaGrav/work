# API Specification - Complete REST API Reference

## Base URL
```
https://api.aiphone.dev/api/v1
```

## Authentication
All endpoints (except `/auth`) require JWT token in Authorization header:
```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp"
}

Response (201):
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}

Error (401):
{
  "error": "Invalid credentials"
}
```

### Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer {token}

Response (204): No Content
```

### Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "message": "Password reset link sent to email"
}
```

### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewPassword123!"
}

Response (200):
{
  "message": "Password updated successfully"
}
```

---

## User Endpoints

### Get Profile
```
GET /users/profile
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp",
  "timezone": "America/New_York",
  "profileImageUrl": "https://...",
  "subscription": {
    "tier": "professional",
    "status": "active",
    "nextBillingDate": "2024-04-03"
  }
}
```

### Update Profile
```
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jonathan",
  "lastName": "Smith",
  "companyName": "Acme Corp",
  "timezone": "America/Los_Angeles"
}

Response (200):
{
  "id": 1,
  "firstName": "Jonathan",
  "lastName": "Smith",
  "companyName": "Acme Corp",
  "timezone": "America/Los_Angeles"
}
```

### Change Password
```
PUT /users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}

Response (200):
{
  "message": "Password changed successfully"
}

Error (401):
{
  "error": "Current password is incorrect"
}
```

### Delete Account
```
DELETE /users/account
Authorization: Bearer {token}

Response (204): No Content
```

---

## Phone Number Endpoints

### Buy Phone Number
```
POST /phone-numbers
Authorization: Bearer {token}
Content-Type: application/json

{
  "countryCode": "US",
  "areaCode": "415", // Optional
  "provider": "plivo"
}

Response (201):
{
  "id": 1,
  "phoneNumber": "+14155551234",
  "countryCode": "US",
  "areaCode": "415",
  "provider": "plivo",
  "providerId": "plivo_id_xxx",
  "status": "active",
  "monthlyPrice": 1.00,
  "purchasedAt": "2024-03-03T10:30:00Z",
  "renewalDate": "2024-04-03"
}
```

### List Phone Numbers
```
GET /phone-numbers
Authorization: Bearer {token}

Query Parameters:
- status: active | inactive | suspended (optional)
- limit: 10 (default: 50, max: 100)
- offset: 0 (default: 0)

Response (200):
{
  "data": [
    {
      "id": 1,
      "phoneNumber": "+14155551234",
      "status": "active",
      "isDefault": true,
      "agents": 2,
      "totalCalls": 150,
      "monthlyPrice": 1.00
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 3
  }
}
```

### Get Phone Number
```
GET /phone-numbers/:id
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "phoneNumber": "+14155551234",
  "countryCode": "US",
  "areaCode": "415",
  "provider": "plivo",
  "status": "active",
  "isDefault": true,
  "forwardingEnabled": true,
  "forwardingNumber": "+15035551234",
  "purchasedAt": "2024-03-03T10:30:00Z",
  "renewalDate": "2024-04-03",
  "monthlyPrice": 1.00,
  "createdAt": "2024-03-03T10:30:00Z"
}
```

### Update Phone Number Settings
```
PUT /phone-numbers/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "isDefault": true,
  "forwardingEnabled": true,
  "forwardingNumber": "+15035551234"
}

Response (200):
{
  "id": 1,
  "phoneNumber": "+14155551234",
  "isDefault": true,
  "forwardingEnabled": true,
  "forwardingNumber": "+15035551234"
}
```

### Release Phone Number
```
DELETE /phone-numbers/:id
Authorization: Bearer {token}

Response (204): No Content
```

---

## Agent Endpoints

### Create Agent
```
POST /agents
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Restaurant Booking",
  "description": "Handles restaurant reservations",
  "businessType": "restaurant",
  "phoneNumberId": 1,
  "voiceProfile": {
    "provider": "google-cloud",
    "language": "en-US",
    "voiceName": "Neural2-A",
    "speed": 1.0,
    "pitch": 0
  },
  "systemPrompt": "You are a friendly restaurant booking assistant...",
  "timezone": "America/Los_Angeles",
  "businessHours": {
    "monday": { "start": "09:00", "end": "22:00" },
    "tuesday": { "start": "09:00", "end": "22:00" },
    "wednesday": { "start": "09:00", "end": "22:00" },
    "thursday": { "start": "09:00", "end": "22:00" },
    "friday": { "start": "09:00", "end": "23:00" },
    "saturday": { "start": "10:00", "end": "23:00" },
    "sunday": { "start": "10:00", "end": "22:00" }
  },
  "allowVoicemail": true,
  "transcriptionEnabled": true
}

Response (201):
{
  "id": 5,
  "userId": 1,
  "name": "Restaurant Booking",
  "phoneNumber": "+14155551234",
  "status": "active",
  "voiceProfile": {...},
  "systemPrompt": "You are a friendly restaurant booking assistant...",
  "createdAt": "2024-03-03T10:35:00Z"
}
```

### List Agents
```
GET /agents
Authorization: Bearer {token}

Query Parameters:
- status: active | paused | archived (optional)
- limit: 50
- offset: 0

Response (200):
{
  "data": [
    {
      "id": 5,
      "name": "Restaurant Booking",
      "phoneNumber": "+14155551234",
      "status": "active",
      "totalCalls": 342,
      "totalMinutes": 1205,
      "averageSentiment": 0.85,
      "successRate": 0.92,
      "createdAt": "2024-03-03T10:35:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 3
  }
}
```

### Get Agent
```
GET /agents/:id
Authorization: Bearer {token}

Response (200):
{
  "id": 5,
  "name": "Restaurant Booking",
  "description": "Handles restaurant reservations",
  "phoneNumber": "+14155551234",
  "status": "active",
  "voiceProfile": {...},
  "systemPrompt": "You are a friendly...",
  "timezone": "America/Los_Angeles",
  "businessHours": {...},
  "totalCalls": 342,
  "totalMinutes": 1205,
  "averageSentiment": 0.85,
  "successRate": 0.92,
  "createdAt": "2024-03-03T10:35:00Z"
}
```

### Update Agent
```
PUT /agents/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Restaurant Booking Pro",
  "voiceProfile": {
    "speed": 1.1,
    "pitch": 2
  },
  "systemPrompt": "Updated prompt...",
  "businessHours": {...}
}

Response (200):
{
  "id": 5,
  "name": "Restaurant Booking Pro",
  "voiceProfile": {
    "speed": 1.1,
    "pitch": 2
  },
  "updatedAt": "2024-03-03T11:00:00Z"
}
```

### Delete Agent
```
DELETE /agents/:id
Authorization: Bearer {token}

Response (204): No Content
```

### Test Agent
```
POST /agents/:id/test-call
Authorization: Bearer {token}
Content-Type: application/json

{
  "testPrompt": "I want to make a reservation for 4 people tomorrow at 7pm"
}

Response (200):
{
  "conversationId": "test_conv_xxx",
  "exchange": [
    {
      "speaker": "caller",
      "text": "I want to make a reservation for 4 people tomorrow at 7pm"
    },
    {
      "speaker": "agent",
      "text": "Great! I'd be happy to help you book a table for 4 guests tomorrow at 7 PM...",
      "audioUrl": "https://..."
    }
  ]
}
```

---

## Call Endpoints

### List Calls
```
GET /calls
Authorization: Bearer {token}

Query Parameters:
- agentId: 5 (optional)
- status: completed | failed | no_answer (optional)
- sentiment: positive | negative | neutral (optional)
- startDate: 2024-03-01 (optional)
- endDate: 2024-03-03 (optional)
- limit: 50
- offset: 0

Response (200):
{
  "data": [
    {
      "id": 123,
      "agentId": 5,
      "agentName": "Restaurant Booking",
      "callerNumber": "+15035551234",
      "callerName": "John Smith",
      "direction": "inbound",
      "status": "completed",
      "durationSeconds": 245,
      "sentimentScore": 0.85,
      "sentimentLabel": "positive",
      "recordingUrl": "https://...",
      "summary": "Customer booked a table for 4 on March 5 at 7 PM",
      "createdAt": "2024-03-03T14:20:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 342
  }
}
```

### Get Call Details
```
GET /calls/:id
Authorization: Bearer {token}

Response (200):
{
  "id": 123,
  "agentId": 5,
  "agentName": "Restaurant Booking",
  "callerNumber": "+15035551234",
  "callerName": "John Smith",
  "direction": "inbound",
  "status": "completed",
  "startedAt": "2024-03-03T14:20:00Z",
  "answeredAt": "2024-03-03T14:20:05Z",
  "endedAt": "2024-03-03T14:24:05Z",
  "durationSeconds": 245,
  "ringDurationSeconds": 5,
  "transcript": "Customer: Hello... Agent: Thank you for calling...",
  "transcriptSegments": [
    {
      "speaker": "agent",
      "text": "Thank you for calling Restaurant, how can I help?",
      "timestamp": 0
    },
    {
      "speaker": "caller",
      "text": "I'd like to make a reservation",
      "timestamp": 2.5
    }
  ],
  "recordingUrl": "https://...",
  "sentimentScore": 0.85,
  "sentimentLabel": "positive",
  "summary": "Customer booked a table for 4 on March 5 at 7 PM",
  "followUpRequired": false,
  "actionItems": [
    {
      "action": "send_confirmation",
      "status": "completed",
      "completedAt": "2024-03-03T14:24:30Z"
    }
  ],
  "costBreakdown": {
    "phone": 0.03,
    "transcription": 0.01,
    "ai": 0.05,
    "total": 0.09
  }
}
```

### Get Call Transcript
```
GET /calls/:id/transcript
Authorization: Bearer {token}

Response (200):
{
  "id": 123,
  "format": "text",
  "transcript": "Full conversation text...",
  "segments": [
    {
      "speaker": "agent",
      "text": "Thank you for calling...",
      "startTime": 0,
      "duration": 2.5
    }
  ]
}
```

### Get Call Recording
```
GET /calls/:id/recording
Authorization: Bearer {token}

Response (302):
Redirects to recording file URL
```

---

## Calendar Endpoints

### Connect Google Calendar
```
POST /calendar/connect
Authorization: Bearer {token}
Content-Type: application/json

{
  "authCode": "code_from_oauth_flow"
}

Response (200):
{
  "id": 1,
  "provider": "google",
  "calendarEmail": "user@gmail.com",
  "isActive": true,
  "lastSync": "2024-03-03T10:30:00Z"
}
```

### List Calendar Events
```
GET /calendar/events
Authorization: Bearer {token}

Query Parameters:
- agentId: 5
- startDate: 2024-03-05
- endDate: 2024-03-10
- status: confirmed | tentative | canceled

Response (200):
{
  "data": [
    {
      "id": 1,
      "title": "Lunch Break",
      "startTime": "2024-03-05T12:00:00Z",
      "endTime": "2024-03-05T13:00:00Z",
      "status": "confirmed",
      "eventType": "break",
      "canBeBooked": false
    },
    {
      "id": 2,
      "title": "Available Slot",
      "startTime": "2024-03-05T14:00:00Z",
      "endTime": "2024-03-05T15:00:00Z",
      "status": "confirmed",
      "eventType": "availability",
      "canBeBooked": true,
      "currentBookings": 1,
      "maxBookings": 3
    }
  ]
}
```

### Sync Calendar
```
POST /calendar/sync
Authorization: Bearer {token}

Response (200):
{
  "message": "Calendar synced successfully",
  "eventsAdded": 5,
  "eventsUpdated": 2,
  "lastSync": "2024-03-03T11:00:00Z"
}
```

### Get Business Hours
```
GET /calendar/business-hours
Authorization: Bearer {token}

Query Parameters:
- agentId: 5

Response (200):
{
  "agentId": 5,
  "timezone": "America/Los_Angeles",
  "businessHours": {
    "monday": { "start": "09:00", "end": "18:00", "enabled": true },
    "tuesday": { "start": "09:00", "end": "18:00", "enabled": true },
    ...
  },
  "holidays": [
    {
      "date": "2024-12-25",
      "name": "Christmas",
      "closed": true
    }
  ]
}
```

---

## Analytics Endpoints

### Get Analytics Overview
```
GET /analytics/overview
Authorization: Bearer {token}

Query Parameters:
- period: today | week | month | year
- agentId: 5 (optional - all agents if not specified)

Response (200):
{
  "period": "month",
  "totalCalls": 342,
  "completedCalls": 315,
  "missedCalls": 27,
  "failedCalls": 5,
  "totalMinutes": 1205,
  "averageDuration": 3.51,
  "successRate": 0.92,
  "averageSentiment": 0.82,
  "topContact": {
    "number": "+15035551234",
    "name": "John Smith",
    "calls": 12
  }
}
```

### Get Call Analytics
```
GET /analytics/calls
Authorization: Bearer {token}

Query Parameters:
- period: today | week | month
- agentId: 5 (optional)

Response (200):
{
  "timeline": [
    {
      "date": "2024-03-03",
      "calls": 45,
      "minutes": 160,
      "successRate": 0.93,
      "averageSentiment": 0.84
    }
  ],
  "byHour": [
    {
      "hour": 9,
      "calls": 12,
      "averageWaitTime": 2.5
    }
  ],
  "bySentiment": {
    "positive": 285,
    "neutral": 28,
    "negative": 2
  }
}
```

### Get Performance Analytics
```
GET /analytics/performance
Authorization: Bearer {token}

Query Parameters:
- agentId: 5 (optional)

Response (200):
{
  "agents": [
    {
      "id": 5,
      "name": "Restaurant Booking",
      "totalCalls": 342,
      "successRate": 0.92,
      "averageSentiment": 0.85,
      "averageDuration": 3.51,
      "topIssue": "Booking confirmation",
      "trend": "up"
    }
  ]
}
```

### Export Analytics
```
GET /analytics/export
Authorization: Bearer {token}

Query Parameters:
- format: csv | pdf | json
- startDate: 2024-03-01
- endDate: 2024-03-03
- agentId: 5 (optional)

Response (200):
Returns file download
```

---

## API Key Endpoints

### Create API Key
```
POST /api-keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Production API Key",
  "description": "For production integrations",
  "permissions": ["read:agents", "read:calls", "read:analytics"],
  "expiresAt": "2025-03-03T00:00:00Z"
}

Response (201):
{
  "id": 1,
  "name": "Production API Key",
  "key": "sk_live_abc123def456", // Show only once!
  "permissions": ["read:agents", "read:calls", "read:analytics"],
  "createdAt": "2024-03-03T11:30:00Z",
  "expiresAt": "2025-03-03T00:00:00Z"
}
```

### List API Keys
```
GET /api-keys
Authorization: Bearer {token}

Response (200):
{
  "data": [
    {
      "id": 1,
      "name": "Production API Key",
      "lastUsedAt": "2024-03-03T11:00:00Z",
      "permissions": ["read:agents", "read:calls"],
      "isActive": true,
      "createdAt": "2024-03-03T11:30:00Z"
    }
  ]
}
```

### Rotate API Key
```
PUT /api-keys/:id/rotate
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "name": "Production API Key",
  "key": "sk_live_xyz789uvw012", // New key
  "createdAt": "2024-03-03T12:00:00Z"
}
```

### Delete API Key
```
DELETE /api-keys/:id
Authorization: Bearer {token}

Response (204): No Content
```

---

## Webhook Endpoints

### Create Webhook
```
POST /webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Call Completed Webhook",
  "url": "https://example.com/webhooks/calls",
  "events": ["call.completed", "call.failed"],
  "secret": "webhook_secret_123"
}

Response (201):
{
  "id": 1,
  "name": "Call Completed Webhook",
  "url": "https://example.com/webhooks/calls",
  "events": ["call.completed", "call.failed"],
  "isActive": true,
  "createdAt": "2024-03-03T11:45:00Z"
}
```

### List Webhooks
```
GET /webhooks
Authorization: Bearer {token}

Response (200):
{
  "data": [
    {
      "id": 1,
      "name": "Call Completed Webhook",
      "url": "https://example.com/webhooks/calls",
      "events": ["call.completed", "call.failed"],
      "isActive": true,
      "lastTriggeredAt": "2024-03-03T14:20:00Z",
      "lastTriggeredStatus": 200
    }
  ]
}
```

### Update Webhook
```
PUT /webhooks/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "events": ["call.completed", "call.failed", "call.started"],
  "url": "https://example.com/webhooks/calls-v2"
}

Response (200):
{
  "id": 1,
  "name": "Call Completed Webhook",
  "url": "https://example.com/webhooks/calls-v2",
  "events": ["call.completed", "call.failed", "call.started"],
  "updatedAt": "2024-03-03T11:50:00Z"
}
```

### Delete Webhook
```
DELETE /webhooks/:id
Authorization: Bearer {token}

Response (204): No Content
```

---

## Webhook Events

### call.started
```json
{
  "event": "call.started",
  "data": {
    "callId": "call_123",
    "agentId": 5,
    "callerNumber": "+15035551234",
    "startTime": "2024-03-03T14:20:00Z"
  }
}
```

### call.completed
```json
{
  "event": "call.completed",
  "data": {
    "callId": "call_123",
    "agentId": 5,
    "callerNumber": "+15035551234",
    "durationSeconds": 245,
    "transcript": "...",
    "sentimentScore": 0.85,
    "summary": "..."
  }
}
```

### appointment.scheduled
```json
{
  "event": "appointment.scheduled",
  "data": {
    "appointmentId": "apt_456",
    "agentId": 5,
    "customerName": "John Smith",
    "customerEmail": "john@example.com",
    "startTime": "2024-03-05T14:00:00Z",
    "duration": 30
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "Email is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Agent not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limited",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "requestId": "req_xyz123"
}
```

---

## Rate Limiting

- **Per IP**: 100 requests/minute
- **Per API Key**: 1000 requests/minute
- **Per User**: 500 concurrent connections

Response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```
