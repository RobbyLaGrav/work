# Database Schema - Complete Implementation

## Overview
PostgreSQL database with optimized indexes for read/write performance. Total ~15 tables for full functionality.

---

## 1. Users & Authentication

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  industry VARCHAR(100),
  website VARCHAR(500),
  phone VARCHAR(20),
  country VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  last_login TIMESTAMP,
  profile_image_url VARCHAR(500),
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### password_resets
```sql
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
```

### sessions
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## 2. Phone Numbers & Agents

### phone_numbers
```sql
CREATE TABLE phone_numbers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  provider VARCHAR(50), -- 'plivo', 'vonage', etc
  provider_id VARCHAR(255), -- External provider ID
  country_code VARCHAR(5),
  area_code VARCHAR(10),
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  purchased_at TIMESTAMP,
  renewal_date TIMESTAMP,
  monthly_cost NUMERIC(10,4),
  forwarding_enabled BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
CREATE INDEX idx_phone_numbers_phone ON phone_numbers(phone_number);
```

### agents
```sql
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  phone_number_id INTEGER REFERENCES phone_numbers(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  business_type VARCHAR(100), -- restaurant, law, real_estate, etc
  industry VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active', -- active, paused, archived

  -- Voice Configuration
  voice_provider VARCHAR(50) DEFAULT 'google-cloud', -- google-cloud, elevenlabs, azure
  voice_language VARCHAR(20) DEFAULT 'en-US',
  voice_name VARCHAR(100),
  voice_speed FLOAT DEFAULT 1.0, -- 0.25 to 4.0
  voice_pitch FLOAT DEFAULT 0.0, -- -20 to 20

  -- AI Configuration
  ai_model VARCHAR(50) DEFAULT 'claude-3-5-haiku', -- claude-3-5-haiku, gpt-4, etc
  system_prompt TEXT,
  temperature FLOAT DEFAULT 0.7, -- 0 to 1
  max_tokens INTEGER DEFAULT 1024,

  -- Business Logic
  timezone VARCHAR(50),
  business_hours JSONB, -- { "monday": { "start": "09:00", "end": "17:00" }, ... }
  holidays JSONB DEFAULT '[]',
  hold_music_url VARCHAR(500),
  max_wait_minutes INTEGER DEFAULT 30,

  -- Settings
  allow_voicemail BOOLEAN DEFAULT TRUE,
  voicemail_greeting_url VARCHAR(500),
  transfer_phone_number VARCHAR(20),
  transcription_enabled BOOLEAN DEFAULT TRUE,
  sentiment_analysis_enabled BOOLEAN DEFAULT TRUE,
  recording_enabled BOOLEAN DEFAULT TRUE,

  -- Analytics
  total_calls INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  average_sentiment FLOAT,
  success_rate FLOAT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_phone_number_id ON agents(phone_number_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_created_at ON agents(created_at);
```

---

## 3. Calls & Communications

### calls
```sql
CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  phone_number_id INTEGER REFERENCES phone_numbers(id),

  -- Call Details
  caller_number VARCHAR(20) NOT NULL,
  caller_name VARCHAR(255),
  direction VARCHAR(20), -- inbound, outbound
  status VARCHAR(50), -- pending, ringing, in_progress, completed, failed, missed
  status_reason VARCHAR(255), -- busy, no_answer, declined, etc

  -- Duration & Timing
  started_at TIMESTAMP,
  answered_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  ring_duration_seconds INTEGER,

  -- Content
  transcript TEXT,
  transcript_segments JSONB, -- [{ "speaker": "agent|caller", "text": "...", "timestamp": 123 }]
  recording_url VARCHAR(500),
  recording_duration_seconds INTEGER,

  -- Analysis
  sentiment_score FLOAT, -- -1 to 1 (negative to positive)
  sentiment_label VARCHAR(50), -- negative, neutral, positive
  summary TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_type VARCHAR(100), -- callback, email, sms, etc
  action_items JSONB DEFAULT '[]', -- [{ "action": "call_back", "date": "2024-03-15" }]

  -- External Integration
  external_call_id VARCHAR(255), -- Plivo call ID
  transcription_provider VARCHAR(50),

  -- Cost Tracking
  cost_breakdown JSONB, -- { "phone": 0.03, "transcription": 0.01, "ai": 0.05 }

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_agent_id ON calls(agent_id);
CREATE INDEX idx_calls_phone_number_id ON calls(phone_number_id);
CREATE INDEX idx_calls_created_at ON calls(created_at);
CREATE INDEX idx_calls_started_at ON calls(started_at);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_sentiment ON calls(sentiment_score);
```

### messages
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  call_id INTEGER REFERENCES calls(id) ON DELETE CASCADE,

  speaker VARCHAR(20) NOT NULL, -- agent, caller, system
  message_type VARCHAR(50), -- text, audio, action

  text_content TEXT,
  audio_url VARCHAR(500),
  audio_duration_seconds FLOAT,

  timestamp_in_call FLOAT, -- seconds from call start

  ai_generated BOOLEAN DEFAULT FALSE,
  confidence_score FLOAT, -- speech recognition confidence

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_call_id ON messages(call_id);
CREATE INDEX idx_messages_speaker ON messages(speaker);
```

---

## 4. Calendar & Scheduling

### calendar_integrations
```sql
CREATE TABLE calendar_integrations (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  provider VARCHAR(50), -- google, outlook, caldav
  provider_account_id VARCHAR(255),
  access_token VARCHAR(500),
  refresh_token VARCHAR(500),
  expires_at TIMESTAMP,
  permissions JSONB, -- what the agent can do
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_integrations_agent_id ON calendar_integrations(agent_id);
```

### calendar_events
```sql
CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  calendar_integration_id INTEGER REFERENCES calendar_integrations(id),

  title VARCHAR(255) NOT NULL,
  description TEXT,

  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER,

  event_type VARCHAR(50), -- appointment, meeting, availability, break, lunch
  status VARCHAR(50), -- confirmed, tentative, canceled

  attendees JSONB, -- [{ "email": "...", "name": "...", "response": "accepted|pending|declined" }]
  location VARCHAR(500),

  external_id VARCHAR(255), -- Google Calendar ID, etc
  is_booked BOOLEAN DEFAULT FALSE,
  booked_via_agent BOOLEAN DEFAULT FALSE,

  -- Booking Details
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  booking_notes TEXT,

  can_be_booked BOOLEAN DEFAULT TRUE,
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_agent_id ON calendar_events(agent_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
```

---

## 5. Billing & Subscriptions

### subscriptions
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  plan_id VARCHAR(100), -- starter, professional, enterprise
  plan_name VARCHAR(255),
  plan_price NUMERIC(10,2),
  billing_cycle VARCHAR(50), -- monthly, annual

  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_payment_method_id VARCHAR(255),

  status VARCHAR(50), -- active, past_due, canceled, unpaid
  start_date TIMESTAMP NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at TIMESTAMP,
  canceled_at TIMESTAMP,

  -- Plan Features
  max_agents INTEGER,
  max_phone_numbers INTEGER,
  monthly_minutes_included INTEGER,
  api_calls_limit INTEGER,

  auto_renew BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
```

### invoices
```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES subscriptions(id),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  stripe_invoice_id VARCHAR(255) UNIQUE,
  invoice_number VARCHAR(100) UNIQUE,

  amount_due NUMERIC(10,2),
  amount_paid NUMERIC(10,2) DEFAULT 0,
  amount_remaining NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'USD',

  status VARCHAR(50), -- draft, open, paid, uncollectible, void
  status_transitions JSONB, -- audit trail

  due_date DATE,
  paid_date DATE,

  items JSONB, -- [{ "description": "...", "amount": 50.00, "quantity": 1 }]

  pdf_url VARCHAR(500),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
```

### usage_tracking
```sql
CREATE TABLE usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  billing_period_start DATE,
  billing_period_end DATE,

  -- Minutes
  minutes_used INTEGER DEFAULT 0,
  minutes_included INTEGER,

  -- Calls
  calls_count INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,

  -- API Usage
  api_calls_used INTEGER DEFAULT 0,
  api_calls_limit INTEGER,

  -- Costs
  phone_cost NUMERIC(10,4) DEFAULT 0,
  transcription_cost NUMERIC(10,4) DEFAULT 0,
  tts_cost NUMERIC(10,4) DEFAULT 0,
  ai_cost NUMERIC(10,4) DEFAULT 0,
  total_overage_cost NUMERIC(10,2) DEFAULT 0,

  -- Breakdown by service
  services_used JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(billing_period_start);
```

---

## 6. API Keys & Integrations

### api_keys
```sql
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  key_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hash
  last_used_at TIMESTAMP,

  permissions JSONB DEFAULT '["read:agents", "read:calls"]',

  ip_whitelist VARCHAR(500), -- comma-separated IPs
  rate_limit_per_minute INTEGER DEFAULT 100,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

### webhooks
```sql
CREATE TABLE webhooks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255), -- HMAC secret

  events JSONB NOT NULL, -- ["call.started", "call.completed", ...]

  is_active BOOLEAN DEFAULT TRUE,

  -- Retry Policy
  max_retries INTEGER DEFAULT 3,
  retry_backoff_seconds INTEGER DEFAULT 60,

  -- Monitoring
  last_triggered_at TIMESTAMP,
  last_triggered_status INTEGER,
  failed_attempts INTEGER DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);
```

### integrations
```sql
CREATE TABLE integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,

  name VARCHAR(255),
  provider VARCHAR(100), -- slack, zapier, crm, etc
  provider_type VARCHAR(50),

  config JSONB, -- provider-specific configuration
  credentials JSONB, -- encrypted credentials

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
```

---

## 7. Analytics & Insights

### call_analytics
```sql
CREATE TABLE call_analytics (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  date DATE,

  -- Counts
  total_calls INTEGER DEFAULT 0,
  answered_calls INTEGER DEFAULT 0,
  missed_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,

  -- Duration
  total_minutes INTEGER DEFAULT 0,
  average_duration_seconds INTEGER,

  -- Performance
  success_rate FLOAT,
  average_sentiment FLOAT,
  positive_calls INTEGER DEFAULT 0,
  negative_calls INTEGER DEFAULT 0,
  neutral_calls INTEGER DEFAULT 0,

  -- Breakdown
  calls_by_hour JSONB,
  calls_by_sentiment JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_call_analytics_agent_id ON call_analytics(agent_id);
CREATE INDEX idx_call_analytics_date ON call_analytics(date);
```

### top_contacts
```sql
CREATE TABLE top_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,

  contact_number VARCHAR(20),
  contact_name VARCHAR(255),

  call_count INTEGER,
  total_duration_seconds INTEGER,
  last_call_at TIMESTAMP,

  avg_sentiment FLOAT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_top_contacts_user_id ON top_contacts(user_id);
```

---

## 8. Audit & Compliance

### audit_logs
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id INTEGER,

  changes JSONB, -- what changed
  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## Indexing Strategy

### Key Indexes Created
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);

-- Agent queries
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);

-- Call history (most common)
CREATE INDEX idx_calls_agent_id ON calls(agent_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);

-- Calendar sync
CREATE INDEX idx_calendar_events_agent_id ON calendar_events(agent_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);

-- Analytics
CREATE INDEX idx_call_analytics_date ON call_analytics(date DESC);

-- Unique constraints
CREATE UNIQUE INDEX idx_phone_numbers_phone ON phone_numbers(phone_number);
CREATE UNIQUE INDEX idx_stripe_subscription ON subscriptions(stripe_subscription_id);
```

### Partitioning Strategy (for future scale)
For high-volume production, partition `calls` and `messages` by date:
```sql
-- Partition calls table by month
CREATE TABLE calls_2024_01 PARTITION OF calls FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## Storage Estimates (per 10,000 users)

| Table | Estimated Size |
|-------|----------------|
| users | 5 MB |
| agents | 15 MB |
| calls (500k/month) | 500 MB |
| messages | 1 GB |
| calendar_events | 50 MB |
| call_analytics | 20 MB |
| **Total** | **~2 GB** |

---

## Data Retention Policy

- **Calls & Transcripts**: Keep for 2 years (compliance)
- **Call Recordings**: Keep for 90 days (cost optimization)
- **Messages**: Keep for 1 year
- **Audit Logs**: Keep for 7 years (legal requirement)
- **Session Tokens**: Expire after 24 hours
