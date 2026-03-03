# Freelancer Tax AI - REST API Specification

## Base URL
```
https://api.freelancertax.com/api
```

## Authentication
All endpoints except `/auth/*` require JWT token:
```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "freelancer@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "businessType": "developer" // freelancer, consultant, contractor, etc
}

Response (201):
{
  "id": 1,
  "email": "freelancer@example.com",
  "firstName": "John",
  "businessType": "developer",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "freelancer@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "id": 1,
  "email": "freelancer@example.com",
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

---

## User Endpoints

### Get Profile
```
GET /users/profile
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "email": "freelancer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "businessType": "developer",
  "country": "US",
  "state": "CA",
  "currency": "USD",
  "subscriptionTier": "premium",
  "subscriptionExpires": "2025-04-03T00:00:00Z"
}
```

### Update Profile
```
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jonathan",
  "country": "US",
  "state": "NY",
  "businessType": "consultant"
}

Response (200):
{
  "id": 1,
  "firstName": "Jonathan",
  "country": "US",
  "state": "NY",
  "businessType": "consultant"
}
```

---

## Expense Endpoints

### Create Expense
```
POST /expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-03-01",
  "amount": 199.99,
  "currency": "USD",
  "category": "software",
  "description": "Adobe Creative Cloud subscription",
  "vendor": "Adobe",
  "receiptUrl": "https://s3.../receipt.pdf",
  "notes": "Monthly subscription"
}

Response (201):
{
  "id": 1,
  "date": "2024-03-01",
  "amount": 199.99,
  "category": "software",
  "description": "Adobe Creative Cloud subscription",
  "isDeductible": true,
  "deductibleAmount": 199.99,
  "taxYear": 2024,
  "quarter": 1,
  "createdAt": "2024-03-01T10:30:00Z"
}
```

### List Expenses
```
GET /expenses
Authorization: Bearer {token}

Query Parameters:
- taxYear: 2024 (default: current year)
- quarter: 1-4 (optional)
- category: software, mileage, meals (optional)
- limit: 50 (default)
- offset: 0 (default)

Response (200):
{
  "data": [
    {
      "id": 1,
      "date": "2024-03-01",
      "amount": 199.99,
      "category": "software",
      "description": "Adobe subscription",
      "isDeductible": true,
      "deductibleAmount": 199.99
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 145,
    "totalPages": 3
  }
}
```

### Get Single Expense
```
GET /expenses/:id
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "date": "2024-03-01",
  "amount": 199.99,
  "currency": "USD",
  "category": "software",
  "description": "Adobe Creative Cloud",
  "vendor": "Adobe",
  "invoiceNumber": "INV-12345",
  "isDeductible": true,
  "deductibleAmount": 199.99,
  "deductionPercentage": 100,
  "receiptUrl": "https://s3.../receipt.pdf",
  "notes": "Monthly subscription",
  "taxYear": 2024,
  "quarter": 1,
  "createdAt": "2024-03-01T10:30:00Z",
  "updatedAt": "2024-03-01T10:30:00Z"
}
```

### Update Expense
```
PUT /expenses/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 249.99,
  "description": "Adobe subscription (updated)"
}

Response (200):
{
  "id": 1,
  "amount": 249.99,
  "description": "Adobe subscription (updated)",
  "updatedAt": "2024-03-02T11:00:00Z"
}
```

### Delete Expense
```
DELETE /expenses/:id
Authorization: Bearer {token}

Response (204): No Content
```

### Bulk Import CSV
```
POST /expenses/import-csv
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": <CSV file>
}

CSV Format:
date,amount,category,description,vendor
2024-03-01,199.99,software,Adobe,Adobe
2024-03-02,45.00,meals,Lunch,Restaurant

Response (200):
{
  "imported": 2,
  "errors": [],
  "message": "Successfully imported 2 expenses"
}
```

---

## Tax Calculation Endpoints

### Calculate Quarterly Tax
```
POST /tax/calculate-quarterly
Authorization: Bearer {token}
Content-Type: application/json

{
  "year": 2024,
  "quarter": 1
}

Response (200):
{
  "year": 2024,
  "quarter": 1,
  "totalIncome": 15000.00,
  "totalExpenses": 3200.00,
  "netIncome": 11800.00,
  "taxableIncome": 11800.00,
  "federalTax": 1339.00,
  "stateIncomeTax": 400.00,
  "selfEmploymentTax": 1669.67,
  "totalTaxLiability": 3408.67,
  "estimatedQuarterlyPayment": 852.17,
  "dueDate": "2024-04-15",
  "status": "calculated"
}
```

### Calculate Annual Tax
```
POST /tax/calculate-annual
Authorization: Bearer {token}
Content-Type: application/json

{
  "year": 2024
}

Response (200):
{
  "year": 2024,
  "totalIncome": 65000.00,
  "totalExpenses": 12000.00,
  "netIncome": 53000.00,
  "taxableIncome": 40400.00, // After standard deduction
  "federalTax": 4928.00,
  "stateIncomeTax": 2000.00,
  "selfEmploymentTax": 7507.02,
  "totalTaxLiability": 14435.02,
  "estimatedQuarterlyPayments": [
    { "quarter": 1, "amount": 3608.75, "dueDate": "2024-04-15" },
    { "quarter": 2, "amount": 3608.75, "dueDate": "2024-06-17" },
    { "quarter": 3, "amount": 3608.75, "dueDate": "2024-09-16" },
    { "quarter": 4, "amount": 3608.77, "dueDate": "2025-01-15" }
  ],
  "totalPaid": 5000.00,
  "balanceDue": 9435.02
}
```

### Get Quarterly Due Dates
```
GET /tax/quarterly-due-dates
Authorization: Bearer {token}

Query Parameters:
- year: 2024

Response (200):
{
  "year": 2024,
  "dueDates": [
    { "quarter": 1, "dueDate": "2024-04-15", "description": "Q1 Estimated Tax" },
    { "quarter": 2, "dueDate": "2024-06-17", "description": "Q2 Estimated Tax" },
    { "quarter": 3, "dueDate": "2024-09-16", "description": "Q3 Estimated Tax" },
    { "quarter": 4, "dueDate": "2025-01-15", "description": "Q4 Estimated Tax" }
  ]
}
```

---

## AI Guidance Endpoints

### Ask Tax Question
```
POST /ai/ask
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "Can I deduct my home office expenses?",
  "context": "optional_additional_context"
}

Response (200):
{
  "conversationId": "conv_123",
  "question": "Can I deduct my home office expenses?",
  "answer": "Yes, you can deduct home office expenses if you use a dedicated space exclusively for business. This is called the 'exclusive and regular use' test. You can choose between:\n\n1. Simplified method: $5 per square foot, up to 300 sq ft\n2. Regular method: Actual expenses\n\nFor your profile, I estimate you could deduct ~$2,400/year.",
  "estimatedDeduction": 2400.00,
  "confidence": 0.95,
  "tokensUsed": 342,
  "createdAt": "2024-03-01T14:20:00Z"
}
```

### Get Deduction Suggestions
```
GET /ai/suggestions
Authorization: Bearer {token}

Query Parameters:
- year: 2024 (default: current)
- limit: 10

Response (200):
{
  "suggestions": [
    {
      "id": 1,
      "category": "home-office",
      "suggestion": "You might be missing home office deductions. Based on your freelance work, you could deduct ~$200/month for dedicated office space.",
      "estimatedValue": 2400.00,
      "confidence": 0.92,
      "type": "category_gap"
    },
    {
      "id": 2,
      "category": "software",
      "suggestion": "You have $600 in software expenses this year. Consider also deducting cloud storage, VPN, and password manager subscriptions.",
      "estimatedValue": 300.00,
      "confidence": 0.88,
      "type": "category_expansion"
    }
  ],
  "totalPotentialDeductions": 2700.00
}
```

### Auto-categorize Expense
```
POST /ai/categorize-expense
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Visited client in NYC for meetings",
  "amount": 450.00,
  "notes": "Flight and hotel"
}

Response (200):
{
  "suggestedCategory": "travel",
  "suggestedSubcategory": "client-visit",
  "isDeductible": true,
  "confidence": 0.95,
  "explanation": "This appears to be business travel for client meetings, which is fully deductible under IRS section 162."
}
```

---

## Report Endpoints

### Generate Quarterly Report
```
GET /reports/quarterly/:quarter/:year
Authorization: Bearer {token}

Query Parameters:
- format: pdf (default) | csv | json

Response:
- PDF: 200 with PDF file download
- CSV: 200 with CSV text
- JSON: 200 with JSON data

Example JSON response:
{
  "quarter": 1,
  "year": 2024,
  "reportDate": "2024-03-01T00:00:00Z",
  "summary": {
    "totalIncome": 15000.00,
    "totalExpenses": 3200.00,
    "estimatedTax": 852.17,
    "dueDate": "2024-04-15"
  },
  "expenses": [...],
  "taxBreakdown": {...}
}
```

### Generate Annual Report
```
GET /reports/annual/:year
Authorization: Bearer {token}

Query Parameters:
- format: pdf | csv | json

Response (200):
{
  "year": 2024,
  "reportDate": "2024-12-31T00:00:00Z",
  "summary": {
    "totalIncome": 65000.00,
    "totalExpenses": 12000.00,
    "totalTax": 14435.02
  },
  "quarters": [
    { "quarter": 1, ... },
    { "quarter": 2, ... }
  ]
}
```

### List Reports
```
GET /reports
Authorization: Bearer {token}

Query Parameters:
- type: quarterly | annual
- year: 2024
- limit: 20

Response (200):
{
  "reports": [
    {
      "id": 1,
      "type": "quarterly",
      "quarter": 1,
      "year": 2024,
      "totalIncome": 15000.00,
      "estimatedTax": 852.17,
      "createdAt": "2024-03-01T10:00:00Z",
      "downloadedAt": "2024-03-02T14:30:00Z",
      "downloadCount": 3
    }
  ]
}
```

---

## Dashboard Endpoints

### Get Dashboard Summary
```
GET /dashboard/summary
Authorization: Bearer {token}

Query Parameters:
- year: 2024 (default: current)

Response (200):
{
  "year": 2024,
  "currentQuarter": 1,
  "metrics": {
    "totalIncome": 15000.00,
    "totalExpenses": 3200.00,
    "netIncome": 11800.00,
    "estimatedTaxQuarter": 852.17,
    "estimatedTaxAnnual": 14435.02,
    "expenseCount": 47,
    "incomeCount": 12
  },
  "nextDueDate": {
    "quarter": 1,
    "amount": 852.17,
    "date": "2024-04-15",
    "daysUntilDue": 45
  },
  "topExpenseCategories": [
    { "category": "software", "amount": 899.99, "percentage": 28 },
    { "category": "equipment", "amount": 1200.00, "percentage": 38 },
    { "category": "meals", "amount": 245.67, "percentage": 8 }
  ]
}
```

### Get Chart Data
```
GET /dashboard/charts
Authorization: Bearer {token}

Query Parameters:
- year: 2024
- type: income-vs-expenses | monthly-breakdown | category-breakdown

Response (200):
{
  "type": "income-vs-expenses",
  "data": [
    { "month": "Jan", "income": 5000, "expenses": 1000, "profit": 4000 },
    { "month": "Feb", "income": 5500, "expenses": 1200, "profit": 4300 },
    { "month": "Mar", "income": 4500, "expenses": 1000, "profit": 3500 }
  ]
}
```

---

## Category Endpoints

### List Categories
```
GET /categories
Authorization: Bearer {token}

Response (200):
{
  "categories": [
    { "id": 1, "name": "Software", "icon": "💻", "color": "#3B82F6", "isDeductible": true },
    { "id": 2, "name": "Equipment", "icon": "🖥️", "color": "#8B5CF6", "isDeductible": true },
    { "id": 3, "name": "Meals", "icon": "🍽️", "color": "#F59E0B", "isDeductible": true },
    { "id": 4, "name": "Travel", "icon": "✈️", "color": "#EC4899", "isDeductible": true },
    { "id": 5, "name": "Home Office", "icon": "🏠", "color": "#10B981", "isDeductible": true }
  ]
}
```

### Create Custom Category
```
POST /categories/custom
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Vehicle Maintenance",
  "icon": "🔧",
  "color": "#F97316",
  "isDeductible": true
}

Response (201):
{
  "id": 6,
  "name": "Vehicle Maintenance",
  "icon": "🔧",
  "color": "#F97316",
  "isDeductible": true,
  "isCustom": true
}
```

---

## Subscription Endpoints

### Get Current Subscription
```
GET /subscription/current
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "plan": "premium",
  "status": "active",
  "currentPeriodStart": "2024-02-03",
  "currentPeriodEnd": "2025-03-03",
  "monthlyPrice": 29.99,
  "billingCycle": "monthly",
  "cancelAtPeriodEnd": false,
  "features": {
    "maxExpenses": "unlimited",
    "aiQuestions": "unlimited",
    "reports": "unlimited",
    "receiptScanning": true,
    "bankIntegration": false,
    "support": "email"
  }
}
```

### Upgrade Plan
```
POST /subscription/upgrade
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPlan": "pro"
}

Response (200):
{
  "checkoutUrl": "https://stripe.com/pay/cs_...",
  "message": "Redirect to complete upgrade"
}
```

### Cancel Subscription
```
POST /subscription/cancel
Authorization: Bearer {token}

Response (200):
{
  "status": "cancellation_requested",
  "cancellationEffectiveDate": "2025-03-03",
  "message": "Your subscription will be canceled at the end of the current billing period"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "Amount must be a positive number"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Expense with ID 999 not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "This email is already registered"
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
  "requestId": "req_abc123xyz"
}
```

---

## Rate Limiting

- **Per IP**: 100 requests/minute
- **Per User**: 500 requests/minute
- **Per Feature**: Some features have additional limits

Response headers:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 489
X-RateLimit-Reset: 1704067200
```

---

## Response Format

All responses follow this format:

### Success (2xx)
```json
{
  "data": {...} or [...],
  "timestamp": "2024-03-01T10:30:00Z"
}
```

### Error (4xx, 5xx)
```json
{
  "error": "Error type",
  "message": "Human readable message",
  "details": "Additional details (optional)",
  "requestId": "req_12345"
}
```

---

## Pagination

List endpoints support pagination:

Query Parameters:
- `limit`: Items per page (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 245,
    "totalPages": 5,
    "hasMore": true
  }
}
```
