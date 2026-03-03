# Freelancer Tax AI - Technical Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │  Dashboard   │ │  Expenses    │ │  Tax Calculator  │    │
│  └──────────────┘ └──────────────┘ └──────────────────┘    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │   Reports    │ │  AI Guidance │ │    Settings      │    │
│  └──────────────┘ └──────────────┘ └──────────────────┘    │
└────────────────────────────┬─────────────────────────────────┘
                             │ (HTTPS/REST API)
┌────────────────────────────▼─────────────────────────────────┐
│                    API GATEWAY (Node.js)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Auth │ Rate Limit │ Validation │ Error Handling      │ │
│  └────────────────────────────────────────────────────────┘ │
└───┬──────────┬──────────────┬──────────────┬────────────┬───┘
    │          │              │              │            │
┌───▼──┐  ┌───▼──┐  ┌──────▼──┐  ┌──────▼──┐  ┌─────▼──┐
│Auth  │  │User  │  │Expense  │  │Tax      │  │Reports │
│Mgmt  │  │Mgmt  │  │Tracking │  │Engine   │  │Engine  │
└──┬───┘  └──┬───┘  └────┬────┘  └───┬─────┘  └────┬───┘
   │         │           │           │             │
   └────────┬┴───────────┼───────────┴─────────────┘
            │            │
┌───────────▼────────────▼──────────────────────────────────────┐
│          CORE SERVICES (Node.js Services)                     │
│                                                               │
│  • Authentication Service  • Expense Processing             │
│  • Tax Calculation Engine  • AI Guidance Service            │
│  • Report Generator        • Currency Conversion            │
│  • Billing Service         • Email Notifications            │
└────────────────────────┬──────────────────────────────────────┘
                         │
    ┌────────┬───────────┼────────┬──────────┐
    │        │           │        │          │
┌───▼─┐ ┌───▼──┐ ┌──────▼──┐ ┌──▼──┐ ┌───▼──┐
│Cache│ │  DB  │ │ Storage │ │ Queue │ │Claude│
│Redis│ │PG    │ │S3/DO    │ │Bull  │ │API  │
└─────┘ └──┬───┘ └─────────┘ └──────┘ └─────┘
           │
    ┌──────▼──────────────┐
    │  PostgreSQL (DO)    │
    │  • Users            │
    │  • Expenses         │
    │  • Tax Records      │
    │  • Calculations     │
    │  • Reports          │
    │  • Subscriptions    │
    └─────────────────────┘

    ┌─────────────────────────┐
    │  External APIs          │
    │  ├─ Claude API         │
    │  ├─ Stripe (Billing)   │
    │  ├─ SendGrid (Email)   │
    │  ├─ Tax API (IRS rates)│
    │  └─ Currency rates     │
    └─────────────────────────┘
```

---

## Tech Stack (Optimized for Speed & Cost)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite (blazing fast, <1s startup)
- **Styling**: Tailwind CSS
- **State**: Zustand (lightweight)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts (for tax visualizations)
- **Icons**: Lucide React
- **Hosting**: Vercel (free tier)

**Bundle size target**: <200KB gzipped

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js (minimal overhead)
- **Language**: TypeScript
- **Database**: PostgreSQL (DigitalOcean managed)
- **Cache**: Redis (DigitalOcean managed)
- **Auth**: JWT + bcrypt
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Email**: SendGrid
- **Storage**: DigitalOcean Spaces (S3-compatible)
- **Job Queue**: Bull (for async tax calculations)

### Infrastructure
- **VPS**: DigitalOcean Droplet ($6-12/month)
- **Database**: PostgreSQL Managed ($15/month)
- **Redis**: Redis Managed ($15/month)
- **Storage**: DigitalOcean Spaces ($5/month)
- **Email**: SendGrid (100/day free, paid after)
- **Domain**: ~$0.50/month (bulk discount)

**Total infrastructure:** ~$40/month

---

## Architecture Patterns

### 1. Core Flow: Expense Tracking
```
User Input (form)
  → Validation
  → Store in DB
  → Update cache
  → Return to frontend
  → Real-time dashboard update
```

### 2. Tax Calculation Flow
```
Trigger: User clicks "Calculate Tax"
  → Fetch all expenses from DB
  → Group by category (deductible, non-deductible)
  → Calculate: Total Income - Deductions = Taxable Income
  → Apply: State + Federal tax rates
  → Queue: Send confirmation email
  → Return: JSON with breakdown
```

### 3. AI Guidance Flow
```
User Question: "Can I deduct my home office?"
  → Validate question
  → Send to Claude API with context (user's business type, income)
  → Claude returns: Explanation + deduction estimate
  → Cache response (same question = instant reply)
  → Log for analytics
  → Return to user
```

### 4. Report Generation Flow
```
Trigger: User exports quarterly report
  → Fetch data (last 3 months expenses)
  → Calculate tax liability
  → Generate PDF with:
    - Expense breakdown
    - Tax estimate
    - Payment due dates
    - AI recommendations
  → Email to user
  → Store in S3
```

---

## API Design

### Core Endpoints

```javascript
// Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout

// Expenses (Main Feature)
POST   /api/expenses                    // Add expense
GET    /api/expenses                    // List expenses
GET    /api/expenses/:id                // Get single
PUT    /api/expenses/:id                // Update expense
DELETE /api/expenses/:id                // Delete expense
POST   /api/expenses/import-csv         // Bulk import

// Categories
GET    /api/categories                  // List tax categories
POST   /api/categories/custom           // Add custom category

// Tax Calculations
POST   /api/tax/calculate-quarterly     // Quarterly estimate
POST   /api/tax/calculate-annual        // Year-end calculation
GET    /api/tax/quarterly-due-dates     // Payment schedule

// AI Guidance
POST   /api/ai/ask-tax-question         // Chat with AI
GET    /api/ai/deduction-suggestions    // Smart suggestions
POST   /api/ai/expense-categorize       // Auto-categorize

// Reports
GET    /api/reports/quarterly/:quarter  // Generate report
GET    /api/reports/annual              // Annual summary
GET    /api/reports/export/:format      // Export (PDF/CSV)

// Dashboard
GET    /api/dashboard/summary           // Key metrics
GET    /api/dashboard/charts            // Chart data

// User Management
GET    /api/users/profile
PUT    /api/users/profile
POST   /api/users/change-password

// Subscription
GET    /api/subscription/current
POST   /api/subscription/upgrade
POST   /api/subscription/cancel
```

---

## Database Schema (Simplified)

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  business_type VARCHAR(100), -- freelancer, contractor, consultant
  country VARCHAR(50) DEFAULT 'US',
  state VARCHAR(50),
  tax_id VARCHAR(50), -- SSN, EIN, etc
  fiscal_year_start DATE,
  currency VARCHAR(10) DEFAULT 'USD',
  email_verified BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### expenses
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100), -- office-supplies, software, mileage, meals, etc
  description TEXT,
  receipt_url VARCHAR(500),
  is_deductible BOOLEAN DEFAULT TRUE,
  tax_year INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expenses_user_id_date ON expenses(user_id, date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_tax_year ON expenses(tax_year);
```

### income_records
```sql
CREATE TABLE income_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  source VARCHAR(255), -- client name or project
  notes TEXT,
  currency VARCHAR(10),
  exchange_rate DECIMAL(10,6),
  amount_usd DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_income_user_id_date ON income_records(user_id, date);
```

### tax_calculations
```sql
CREATE TABLE tax_calculations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tax_year INTEGER,
  quarter INTEGER, -- 1-4 for quarterly, NULL for annual
  total_income DECIMAL(10,2),
  total_deductions DECIMAL(10,2),
  taxable_income DECIMAL(10,2),
  estimated_tax DECIMAL(10,2),
  federal_tax DECIMAL(10,2),
  state_tax DECIMAL(10,2),
  self_employment_tax DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_calculations_user_id ON tax_calculations(user_id);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50), -- free, basic, premium
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50), -- active, canceled, past_due
  current_period_start DATE,
  current_period_end DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

---

## Feature Breakdown

### MVP Features (Weeks 1-4)
- ✅ User registration/login
- ✅ Add/edit/delete expenses
- ✅ Categorize expenses (pre-built categories)
- ✅ Simple tax calculation (total income - deductions)
- ✅ View quarterly estimates
- ✅ Basic dashboard

### Early Stage Features (Weeks 5-8)
- ✅ AI guidance (Claude integration)
- ✅ Multi-currency support
- ✅ CSV import
- ✅ PDF export of reports
- ✅ Email notifications

### Growth Features (Month 3+)
- ✅ Receipt scanning (OCR)
- ✅ Bank account integration
- ✅ Smart categorization (ML)
- ✅ Tax filing integration
- ✅ Professional reports

---

## Cost Breakdown

### Monthly Operating Costs
```
DigitalOcean Droplet:          $6-12
PostgreSQL Managed:             $15
Redis Cache:                    $15
DigitalOcean Spaces:            $5
SendGrid Email:                 Free (100/day)
Domain & SSL:                   ~$1
Claude API (avg usage):         $30-50
Stripe Processing (2.9%):       Variable
─────────────────────────────────────
TOTAL FIXED:                    ~$70

Per user AI usage: ~$0.05-0.10/month
Per user storage: ~$0.01/month
```

### Revenue & Margins

```
Free Tier: 0 (lead gen)

Basic: $15/month
- Basic expense tracking
- Tax calculation
- 5 AI questions/month
- CSV export
- Target: 60% of users
- Margin: 88%

Premium: $30/month
- Everything in Basic
- Unlimited AI guidance
- Receipt scanning
- Multi-currency
- Tax filing prep
- Priority support
- Target: 35% of users
- Margin: 85%

Pro: $99/month
- Everything above
- Bookkeeper collaboration
- Advanced reporting
- Tax optimization recommendations
- API access
- White-label option
- Target: 5% of users
- Margin: 80%

Average ARPU (blended): $22/month
Gross margin: 86%

With 500 customers:
Revenue: $11,000/month
COGS: $1,500/month
Gross profit: $9,500/month
```

---

## Security & Compliance

### Data Protection
- ✅ All passwords hashed with bcrypt
- ✅ TLS 1.3 for all traffic
- ✅ Database encryption at rest
- ✅ No sensitive data in logs
- ✅ GDPR-compliant (data deletion on request)

### Tax Information Security
- ✅ Disclaimer: "Not tax advice"
- ✅ User data never shared with tax authorities
- ✅ Data retention: 7 years (IRS requirement)
- ✅ PII encrypted in database

### Compliance
- ✅ Privacy policy (clear about data use)
- ✅ Terms of service
- ✅ GDPR compliance (EU users)
- ✅ Liability insurance ($500/year)

---

## Scalability Plan

### Phase 1: MVP (Months 1-2)
- Single server
- Shared database
- Basic caching

### Phase 2: Growth (Months 3-6)
- 2-3 API servers (load balanced)
- Database replicas
- Redis cluster
- CDN for static assets

### Phase 3: Scale (Month 6+)
- Docker containers
- Kubernetes orchestration
- Database sharding by user_id
- Microservices for heavy operations (PDF generation, email)
- Multi-region (if international)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time | <200ms |
| Tax Calculation Time | <1 second |
| Page Load Time | <2 seconds |
| AI Guidance Response | <3 seconds |
| PDF Generation | <5 seconds |
| Uptime SLA | 99.5% |
| Concurrent Users | 100+ (easily) |

---

## Deployment & DevOps

### CI/CD Pipeline
```
1. Code Push → GitHub
2. Run Tests (Jest)
3. Lint Code (ESLint)
4. Build Docker Image
5. Deploy to DigitalOcean
6. Health Checks
7. Email notification
```

### Environment Variables
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CLAUDE_API_KEY=xxx
STRIPE_SECRET_KEY=xxx
SENDGRID_API_KEY=xxx
JWT_SECRET=xxx
NODE_ENV=production
```

### Monitoring
- Sentry for error tracking
- Datadog for performance
- Uptime monitoring (UptimeRobot)
- Cloud logging for audit trail

---

## Why This Architecture Wins

1. **Simple** - Single codebase, minimal services
2. **Cheap** - $40/month base infrastructure
3. **Fast** - No heavy dependencies, Vite builds in <1s
4. **Scalable** - Easy to add servers/replicas
5. **Reliable** - PostgreSQL is proven, Redis is battle-tested
6. **Secure** - Standard practices, no novel infrastructure
7. **Developer-friendly** - Node.js + TypeScript everywhere
