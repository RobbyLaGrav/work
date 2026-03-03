# Freelancer Tax AI - Complete Database Schema

## Overview

Clean, minimal schema optimized for tax calculations. 10 core tables supporting all features.

---

## 1. Users & Authentication

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  business_name VARCHAR(255),
  business_type VARCHAR(100), -- freelancer, consultant, contractor, developer, designer, writer, other
  industry VARCHAR(100),

  -- Tax Info
  country VARCHAR(50) DEFAULT 'US',
  state VARCHAR(50),
  tax_id VARCHAR(50), -- SSN, EIN, ITN
  tax_filing_status VARCHAR(50), -- single, married, business
  fiscal_year_start DATE DEFAULT '2024-01-01', -- When their tax year starts

  -- Settings
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',

  -- Account Status
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,

  -- Stripe Integration
  stripe_customer_id VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, basic, premium, pro
  subscription_expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
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

CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
```

---

## 2. Expenses (Core Feature)

### expenses
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Basic Info
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  exchange_rate DECIMAL(10,6) DEFAULT 1.0, -- For non-USD currencies
  amount_usd DECIMAL(12,2), -- Normalized to USD

  -- Categorization
  category VARCHAR(100) NOT NULL, -- office-supplies, software, mileage, meals, travel, equipment, etc
  subcategory VARCHAR(100),
  description TEXT NOT NULL,

  -- Deduction Info
  is_deductible BOOLEAN DEFAULT TRUE,
  deduction_percentage INTEGER DEFAULT 100, -- For partial deductions (e.g., home office 30%)
  deductible_amount DECIMAL(12,2), -- amount * deduction_percentage / 100

  -- Filing Info
  tax_year INTEGER NOT NULL, -- 2023, 2024, 2025, etc
  quarter INTEGER, -- 1-4, for quarterly estimates

  -- Documentation
  receipt_url VARCHAR(500), -- Cloud storage link
  receipt_file_name VARCHAR(255),
  vendor_name VARCHAR(255),
  invoice_number VARCHAR(100),
  payment_method VARCHAR(50), -- card, bank_transfer, cash, crypto, etc

  -- Notes & Tags
  notes TEXT,
  tags JSONB DEFAULT '[]', -- ["car", "software", "subscription"]

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft deletes for audit trail
);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_tax_year ON expenses(tax_year);
CREATE INDEX idx_expenses_deductible ON expenses(is_deductible);
CREATE INDEX idx_expenses_user_tax_year ON expenses(user_id, tax_year);
```

### expense_categories
```sql
CREATE TABLE expense_categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(10),
  is_custom BOOLEAN DEFAULT TRUE,
  is_deductible BOOLEAN DEFAULT TRUE,
  irs_category VARCHAR(100), -- Maps to official IRS categories
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expense_categories_user_id ON expense_categories(user_id);
```

---

## 3. Income

### income_records
```sql
CREATE TABLE income_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Income Details
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  exchange_rate DECIMAL(10,6) DEFAULT 1.0,
  amount_usd DECIMAL(12,2),

  -- Source
  client_name VARCHAR(255),
  project_name VARCHAR(255),
  invoice_number VARCHAR(100),

  -- Categorization
  income_type VARCHAR(100), -- project, hourly, retainer, product-sale, other

  -- Filing Info
  tax_year INTEGER,
  quarter INTEGER,

  -- Notes
  notes TEXT,
  tags JSONB DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_income_user_id ON income_records(user_id);
CREATE INDEX idx_income_date ON income_records(date);
CREATE INDEX idx_income_tax_year ON income_records(tax_year);
```

---

## 4. Tax Calculations & Estimates

### tax_calculations
```sql
CREATE TABLE tax_calculations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Period
  tax_year INTEGER NOT NULL,
  quarter INTEGER, -- 1-4 for quarterly, NULL for annual
  calculation_type VARCHAR(50), -- quarterly, annual, projection

  -- Income
  total_income DECIMAL(12,2),
  other_income DECIMAL(12,2) DEFAULT 0, -- Side income, investments, etc
  gross_income DECIMAL(12,2),

  -- Deductions
  total_business_expenses DECIMAL(12,2),
  home_office_deduction DECIMAL(12,2) DEFAULT 0,
  mileage_deduction DECIMAL(12,2) DEFAULT 0,
  meal_deduction DECIMAL(12,2) DEFAULT 0,
  equipment_depreciation DECIMAL(12,2) DEFAULT 0,
  health_insurance_deduction DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2),

  -- Net Income
  net_business_income DECIMAL(12,2), -- After deductions

  -- Tax Calculation
  standard_deduction DECIMAL(12,2),
  taxable_income DECIMAL(12,2), -- Net income - standard deduction

  -- Tax Liability
  federal_income_tax DECIMAL(12,2) DEFAULT 0,
  state_income_tax DECIMAL(12,2) DEFAULT 0,
  self_employment_tax DECIMAL(12,2) DEFAULT 0, -- 15.3% of 92.35% of net

  total_tax_liability DECIMAL(12,2), -- Sum of above
  estimated_quarterly_payment DECIMAL(12,2), -- Total liability / 4

  -- Payment Tracking
  payments_made DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2),

  -- Metadata
  notes TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_calculations_user_id ON tax_calculations(user_id);
CREATE INDEX idx_tax_calculations_year_quarter ON tax_calculations(tax_year, quarter);
```

### tax_payment_tracking
```sql
CREATE TABLE tax_payment_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tax_calculation_id INTEGER REFERENCES tax_calculations(id),

  -- Payment Details
  payment_date DATE,
  amount DECIMAL(12,2),
  payment_method VARCHAR(50), -- bank_transfer, credit_card, crypto, check
  confirmation_number VARCHAR(255),

  -- IRS Info
  tax_year INTEGER,
  quarter INTEGER,

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_payment_tracking_user_id ON tax_payment_tracking(user_id);
```

---

## 5. AI Guidance & Suggestions

### ai_conversations
```sql
CREATE TABLE ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(255),
  topic VARCHAR(100), -- deduction-question, tax-strategy, expense-review, etc

  messages JSONB NOT NULL, -- [{role: "user"|"assistant", content: "..."}]

  -- Metadata
  tokens_used INTEGER,
  cost_usd DECIMAL(8,4),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
```

### deduction_suggestions
```sql
CREATE TABLE deduction_suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  category VARCHAR(100),
  subcategory VARCHAR(100),

  suggestion_text TEXT,
  estimated_value DECIMAL(12,2),
  confidence_score FLOAT, -- 0.0-1.0

  is_approved BOOLEAN DEFAULT FALSE,
  is_applied BOOLEAN DEFAULT FALSE,

  reason_for_suggestion VARCHAR(500), -- Why Claude recommended this

  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP
);

CREATE INDEX idx_deduction_suggestions_user_id ON deduction_suggestions(user_id);
CREATE INDEX idx_deduction_suggestions_is_applied ON deduction_suggestions(is_applied);
```

---

## 6. Reports & Exports

### reports
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  report_type VARCHAR(50), -- quarterly, annual, projection
  tax_year INTEGER,
  quarter INTEGER,

  -- Content
  title VARCHAR(255),
  file_url VARCHAR(500), -- S3 URL
  file_size INTEGER, -- Bytes
  file_format VARCHAR(20), -- pdf, csv, json

  -- Metadata
  total_income DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  tax_estimate DECIMAL(12,2),

  created_at TIMESTAMP DEFAULT NOW(),
  downloaded_at TIMESTAMP,
  download_count INTEGER DEFAULT 0
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
```

---

## 7. Subscriptions & Billing

### subscriptions
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  plan VARCHAR(50) NOT NULL, -- free, basic, premium, pro
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),

  -- Billing
  monthly_price DECIMAL(10,2),
  billing_cycle VARCHAR(50), -- monthly, annual

  -- Dates
  current_period_start DATE,
  current_period_end DATE,
  status VARCHAR(50), -- active, past_due, canceled, unpaid

  -- Cancellation
  cancel_requested_at TIMESTAMP,
  canceled_at TIMESTAMP,
  cancellation_reason TEXT,

  auto_renew BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### invoices
```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id),

  stripe_invoice_id VARCHAR(255) UNIQUE,
  invoice_number VARCHAR(100) UNIQUE,

  amount_subtotal DECIMAL(10,2),
  amount_tax DECIMAL(10,2),
  amount_total DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',

  status VARCHAR(50), -- paid, pending, failed

  due_date DATE,
  paid_date DATE,

  pdf_url VARCHAR(500),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

---

## 8. Audit & Compliance

### audit_logs
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  action VARCHAR(100), -- create_expense, delete_expense, calculate_tax, export_report
  resource_type VARCHAR(50), -- expense, calculation, report
  resource_id INTEGER,

  old_values JSONB,
  new_values JSONB,

  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 9. Analytics

### usage_stats
```sql
CREATE TABLE usage_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Usage Metrics
  expenses_added_this_month INTEGER DEFAULT 0,
  expenses_total INTEGER DEFAULT 0,
  income_records_added_this_month INTEGER DEFAULT 0,

  ai_questions_asked_month INTEGER DEFAULT 0,
  reports_generated_month INTEGER DEFAULT 0,

  -- Engagement
  last_expense_added_at TIMESTAMP,
  last_login_at TIMESTAMP,

  month_year DATE, -- For aggregation

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_stats_user_id ON usage_stats(user_id);
```

---

## 10. Features & Feature Flags

### feature_flags
```sql
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,

  flag_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  is_enabled BOOLEAN DEFAULT FALSE,
  is_beta BOOLEAN DEFAULT FALSE,

  affected_users JSONB DEFAULT '[]', -- Which users have access
  rollout_percentage INTEGER DEFAULT 0, -- Gradual rollout: 0-100

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Indexes Summary

### Performance-Critical Indexes
```sql
-- User lookups (every request)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- Expense queries (most common)
CREATE INDEX idx_expenses_user_tax_year ON expenses(user_id, tax_year);
CREATE INDEX idx_expenses_date ON expenses(date);

-- Tax calculations
CREATE INDEX idx_tax_calculations_user_year ON tax_calculations(user_id, tax_year);

-- Income aggregations
CREATE INDEX idx_income_user_year ON income_records(user_id, tax_year);

-- Subscription status checks
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
```

---

## Retention & Privacy Policy

### Data Retention
- **Active users**: Keep all data indefinitely
- **Deleted accounts**: Delete all data within 30 days (GDPR)
- **Receipts/files**: Keep for 7 years (IRS requirement)
- **Audit logs**: Keep for 7 years (compliance)

### Backup Strategy
- Daily automated backups
- 30-day retention on backups
- Point-in-time recovery available

---

## Storage Estimates

| Table | Avg Row Size | Rows (10k users) | Total Size |
|-------|-------------|-----------------|-----------|
| users | 500 bytes | 10,000 | 5 MB |
| expenses | 400 bytes | 1,500,000 | 600 MB |
| income_records | 300 bytes | 500,000 | 150 MB |
| tax_calculations | 800 bytes | 50,000 | 40 MB |
| ai_conversations | 2 KB | 100,000 | 200 MB |
| reports | 500 bytes | 50,000 | 25 MB |
| **Total** | | | **~1.1 GB** |

This scales linearly, so 100k users = 11GB total.

---

## Query Optimization Examples

### Most Common Query: Get User's Current Year Expenses
```sql
SELECT * FROM expenses
WHERE user_id = $1
  AND tax_year = 2024
  AND deleted_at IS NULL
ORDER BY date DESC
LIMIT 100;

-- Uses: idx_expenses_user_tax_year
-- Expected: <10ms
```

### Tax Calculation Query
```sql
SELECT
  SUM(amount_usd) as total_income,
  SUM(deductible_amount) as total_deductions
FROM expenses
WHERE user_id = $1
  AND tax_year = 2024
  AND is_deductible = true;

-- Expected: <50ms (fast aggregation)
```

### Dashboard Summary
```sql
SELECT
  COUNT(*) as expense_count,
  SUM(amount_usd) as total_expenses,
  AVG(amount_usd) as avg_expense
FROM expenses
WHERE user_id = $1
  AND tax_year = 2024;

-- Expected: <20ms
```
