# AI Phone Agent SaaS - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │    Auth    │ │  Dashboard   │ │   Settings   │             │
│  └────────────┘ └──────────────┘ └──────────────┘             │
└────────────────────────────┬────────────────────────────────────┘
                             │ (HTTPS/REST API)
┌────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY (Node.js)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  JWT Auth │ Rate Limiting │ Request Validation │ Logging │  │
│  └──────────────────────────────────────────────────────────┘  │
└───┬──────────┬──────────────┬──────────────┬──────────────┬─────┘
    │          │              │              │              │
    │          │              │              │              │
┌───▼──┐  ┌───▼──┐  ┌──────▼──┐  ┌──────▼──┐  ┌────────▼──┐
│User  │  │Agent │  │ Phone   │  │Calendar │  │ Analytics│
│Mgmt  │  │Mgmt  │  │  Agent  │  │  Sync   │  │ Engine   │
└──┬───┘  └──┬───┘  └────┬────┘  └───┬─────┘  └─────┬────┘
   │         │           │           │              │
   └────────┬┴───┬───────┼───────────┴──────────────┘
            │    │       │
┌───────────▼────▼───────▼──────────────────────────────────────┐
│          CORE SERVICES (Node.js Microservices)                │
│                                                               │
│  • User Service     • Agent Service   • Call Service         │
│  • Billing Service  • Analytics       • Integration Service  │
└────────────────────┬──────────────────────────────────────────┘
                     │
    ┌────────┬───────┼────────┬──────────┐
    │        │       │        │          │
┌───▼─┐ ┌───▼──┐ ┌──▼────┐ ┌─▼──────┐ ┌─▼──────┐
│Redis│ │  DB  │ │ Cache │ │Storage │ │  Queue │
└─────┘ └──┬───┘ └───────┘ └────────┘ └────────┘
           │
    ┌──────▼──────────────┐
    │  PostgreSQL (DO)    │
    │  • Users            │
    │  • Agents           │
    │  • Call Logs        │
    │  • Analytics        │
    └─────────────────────┘

    ┌─────────────────────────┐
    │  External APIs          │
    │  ├─ Plivo (Phone)      │
    │  ├─ Claude API         │
    │  ├─ Google Cloud TTS   │
    │  ├─ Google Calendar    │
    │  ├─ Stripe (Billing)   │
    │  └─ Email Service      │
    └─────────────────────────┘
```

---

## Tech Stack Details

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite (ultra-fast)
- **CSS**: Tailwind CSS (utility-first)
- **State Management**: Zustand (lightweight, <2KB)
- **HTTP Client**: TanStack Query + Axios
- **UI Components**: Shadcn/ui (headless)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts (lightweight)
- **Hosting**: Vercel (free for this project)

**Bundle Size Target**: <250KB gzipped

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js (minimal overhead)
- **TypeScript**: Yes (type safety)
- **Database Driver**: pg (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken)
- **Environment**: dotenv
- **HTTP Requests**: axios
- **Job Queue**: Bull (Redis-backed)
- **Logging**: Winston
- **API Documentation**: Swagger/OpenAPI

### Infrastructure
- **VPS**: DigitalOcean Droplet ($6/month - 1GB RAM)
- **Database**: DigitalOcean PostgreSQL ($15/month - managed)
- **Redis**: DigitalOcean Redis ($15/month - managed)
- **Storage**: S3-compatible (Spaces, $5/month - 250GB)
- **CDN**: DigitalOcean CDN (pay-per-use, ~$0.20/GB)
- **Email**: SendGrid (100/day free)
- **Domain**: Namecheap (~$0.50/month via bulk)

**Total Infrastructure Cost: ~$45/month**

---

## API Architecture

### Core API Endpoints

```javascript
// Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout
POST   /api/auth/forgot-password

// User Management
GET    /api/users/profile
PUT    /api/users/profile
POST   /api/users/change-password
DELETE /api/users/account

// Agents
POST   /api/agents
GET    /api/agents
GET    /api/agents/:id
PUT    /api/agents/:id
DELETE /api/agents/:id
POST   /api/agents/:id/test-call

// Calls
GET    /api/calls
GET    /api/calls/:id
GET    /api/calls/:id/transcript
GET    /api/calls/:id/recording

// Calendar
POST   /api/calendar/connect
GET    /api/calendar/events
POST   /api/calendar/sync
GET    /api/calendar/business-hours

// Analytics
GET    /api/analytics/overview
GET    /api/analytics/calls
GET    /api/analytics/performance
GET    /api/analytics/export

// API Keys
POST   /api/api-keys
GET    /api/api-keys
DELETE /api/api-keys/:id
PUT    /api/api-keys/:id/rotate

// Webhooks
POST   /api/webhooks
GET    /api/webhooks
PUT    /api/webhooks/:id
DELETE /api/webhooks/:id

// Billing
GET    /api/billing/subscription
POST   /api/billing/upgrade
POST   /api/billing/cancel
GET    /api/billing/invoices
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_end_date TIMESTAMP,
  phone_number VARCHAR(20),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Agents Table
```sql
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  voice_profile JSONB, -- { provider, language, accent, speed }
  system_prompt TEXT,
  business_type VARCHAR(100),
  timezone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Calls Table
```sql
CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  caller_number VARCHAR(20) NOT NULL,
  duration_seconds INTEGER,
  status VARCHAR(50), -- pending, ringing, in_progress, completed, failed
  transcript TEXT,
  recording_url VARCHAR(500),
  sentiment_score FLOAT,
  conversation_summary TEXT,
  external_id VARCHAR(255), -- Plivo call ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_agent_id ON calls(agent_id);
CREATE INDEX idx_calls_created_at ON calls(created_at);
```

### Calendar Events Table
```sql
CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  external_id VARCHAR(255), -- Google Calendar ID
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### Webhooks Table
```sql
CREATE TABLE webhooks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  failed_attempts INTEGER DEFAULT 0,
  last_attempted TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  tier VARCHAR(50), -- starter, professional, enterprise
  status VARCHAR(50), -- active, past_due, canceled
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Usage Tracking Table
```sql
CREATE TABLE usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  month DATE,
  minutes_used INTEGER DEFAULT 0,
  calls_count INTEGER DEFAULT 0,
  transcription_cost NUMERIC(10,4),
  tts_cost NUMERIC(10,4),
  phone_cost NUMERIC(10,4),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Call Flow Architecture

### Incoming Call Flow
```
1. Phone Call → Plivo SIP Trunk
2. Plivo → Webhook (POST /calls/incoming)
3. Validate Agent & Business Hours
4. Initialize Call Session
5. Google Cloud TTS (Initial greeting)
6. Customer speaks → Google Cloud Whisper (transcription)
7. Transcription → Claude API (context understanding + response)
8. Claude response → Google Cloud TTS (speech synthesis)
9. Play audio to caller
10. Repeat 6-9 until call ends
11. Store call log + transcript + sentiment analysis
12. Send webhook event to user
```

### Agent Voice Profile Format
```json
{
  "provider": "google-cloud",
  "language": "en-US",
  "voice_name": "Neural2-A",
  "speed": 1.0,
  "pitch": 0.0,
  "business_type": "restaurant",
  "system_prompt": "You are a friendly restaurant booking assistant. You help customers make reservations and answer questions about the restaurant."
}
```

---

## Authentication & Security

### JWT Token Structure
```javascript
{
  "sub": user_id,
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890 + 24h,
  "role": "user"
}
```

### API Key Generation
- Generate 32-byte random token
- Hash with SHA-256
- Store only hash in database
- Show plaintext only once on creation

### Rate Limiting
```
- Per IP: 100 requests/minute
- Per API Key: 1000 requests/minute
- Per User: 500 concurrent connections
```

---

## Deployment Architecture

### Environment Variables
```
# Database
DATABASE_URL=postgresql://user:pass@db:5432/aiphone

# Redis
REDIS_URL=redis://cache:6379

# Third-party APIs
PLIVO_AUTH_ID=xxx
PLIVO_AUTH_TOKEN=xxx
CLAUDE_API_KEY=xxx
GOOGLE_CLOUD_TTS_KEY=xxx
GOOGLE_CALENDAR_CLIENT_ID=xxx
GOOGLE_CALENDAR_CLIENT_SECRET=xxx
STRIPE_SECRET_KEY=xxx

# App Config
NODE_ENV=production
JWT_SECRET=xxx
PORT=3000
BASE_URL=https://yourdomain.com
```

### CI/CD Pipeline
```
1. Code Push → GitHub
2. Run Tests (Jest)
3. Lint Code (ESLint)
4. Build Docker Image
5. Push to Registry
6. Deploy to DigitalOcean
7. Run Health Checks
```

---

## Cost Summary (First Year)

| Item | Cost/Month | Notes |
|------|-----------|-------|
| DigitalOcean Droplet | $6 | 1GB RAM, shared CPU |
| PostgreSQL Managed DB | $15 | 1GB storage |
| Redis Cache | $15 | 250MB |
| DigitalOcean Spaces | $5 | 250GB S3-compatible |
| Domain | $0.50 | Bulk discount |
| SendGrid Email | $0 | 100/day free tier |
| Stripe (2.9% + $0.30) | Variable | Per transaction |
| **Backend Total** | **$41.50** | Plus transaction fees |

| Per 1000 Users | Cost/Month |
|----------------|-----------|
| Plivo Phone | $1,000 |
| Claude API (10min/user avg) | $2,000 |
| Google Cloud TTS | $150 |
| Google Cloud Whisper | $100 |
| Infrastructure | $50 |
| Storage/Bandwidth | $100 |
| **Total User Cost** | **$3,400** |
| **Revenue (avg $50/user)** | **$50,000** |
| **Gross Margin** | **93.2%** ✅ |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time | <200ms |
| Call Setup Time | <3 seconds |
| Speech Recognition Latency | <1 second |
| TTS Synthesis Time | <2 seconds |
| Database Query Time | <100ms |
| Uptime SLA | 99.5% |
| Concurrent Calls | 100+ (with 1GB RAM) |

---

## Scaling Strategy

**Phase 1 (0-100 users):**
- Single DigitalOcean Droplet
- 1 PostgreSQL instance
- 1 Redis instance

**Phase 2 (100-1000 users):**
- 2-3 API servers (load balanced)
- Database replicas
- Dedicated Redis cluster
- CDN for static assets

**Phase 3 (1000+ users):**
- Kubernetes cluster
- Auto-scaling
- Multi-region deployment
- Dedicated infrastructure for high-volume customers
