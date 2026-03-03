# Freelancer Tax AI - Implementation Roadmap

## Timeline: 4-6 Weeks to MVP → 6 Months to $5k MRR

---

## PHASE 1: Foundation (Weeks 1-2)

### Week 1: Setup & Authentication

#### 1.1 Repository & Project Setup
```bash
# Create project structure
mkdir -p backend frontend docs

# Backend
cd backend && npm init -y
npm install express dotenv pg axios bcrypt jsonwebtoken
npm install -D typescript ts-node @types/node @types/express

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install tailwindcss zustand axios react-hook-form zod recharts
```

#### 1.2 Database Setup
- [ ] Create DigitalOcean PostgreSQL instance
- [ ] Run initial schema migrations
- [ ] Set up database credentials in .env

**Key file: `backend/migrations/001_init.sql`**
```sql
-- Run all schema from DATABASE_SCHEMA.md
CREATE TABLE users (...)
CREATE TABLE expenses (...)
CREATE TABLE income_records (...)
-- ... etc
```

#### 1.3 Backend API - Authentication Endpoints
**File: `backend/src/controllers/authController.ts`**

Implement:
- [ ] `POST /api/auth/register` - Create user account
- [ ] `POST /api/auth/login` - JWT token generation
- [ ] `POST /api/auth/refresh-token` - Token refresh
- [ ] `POST /api/auth/logout` - Session cleanup

**Example:**
```typescript
export const register = async (req, res) => {
  const { email, password, firstName, lastName, businessType } = req.body;

  // Validate input
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await db.query(
    'INSERT INTO users (email, password_hash, first_name, last_name, business_type) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
    [email, passwordHash, firstName, lastName, businessType]
  );

  // Generate JWT
  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET);

  res.status(201).json({ token, user: user.rows[0] });
};
```

#### 1.4 Middleware Setup
- [ ] JWT authentication middleware
- [ ] Error handling middleware
- [ ] Request validation middleware
- [ ] CORS configuration

**File: `backend/src/middleware/auth.ts`**
```typescript
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
```

### Week 2: Expense Tracking - MVP

#### 2.1 Expense API Endpoints
**File: `backend/src/controllers/expenseController.ts`**

Implement:
- [ ] `POST /api/expenses` - Add expense
- [ ] `GET /api/expenses` - List expenses (paginated, filterable)
- [ ] `PUT /api/expenses/:id` - Update expense
- [ ] `DELETE /api/expenses/:id` - Delete expense

**Example Create Expense:**
```typescript
export const createExpense = async (req, res) => {
  const { date, amount, currency, category, description } = req.body;
  const userId = req.userId;

  // Get tax_year from date
  const taxYear = new Date(date).getFullYear();

  const result = await db.query(
    `INSERT INTO expenses (user_id, date, amount, currency, category, description, tax_year)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, date, amount, currency, category, description, taxYear]
  );

  res.status(201).json(result.rows[0]);
};

export const listExpenses = async (req, res) => {
  const userId = req.userId;
  const { taxYear = new Date().getFullYear(), category, limit = 50, offset = 0 } = req.query;

  const result = await db.query(
    `SELECT * FROM expenses
     WHERE user_id = $1 AND tax_year = $2 AND deleted_at IS NULL
     ${category ? 'AND category = $3' : ''}
     ORDER BY date DESC
     LIMIT $${category ? 4 : 3} OFFSET $${category ? 5 : 4}`,
    [userId, taxYear, category, limit, offset]
  );

  res.json(result.rows);
};
```

#### 2.2 Frontend - Authentication Pages
**File: `frontend/src/pages/Login.tsx`**

Create:
- [ ] Login page with form
- [ ] Register page with form
- [ ] Password reset page
- [ ] Email verification page

**Store setup: `frontend/src/store/authStore.ts`**
```typescript
import { create } from 'zustand';
import axios from 'axios';

interface AuthStore {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, businessType: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token'),
  user: null,

  login: async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    set({ token: data.token, user: data.user });
    localStorage.setItem('token', data.token);
  },

  register: async (email, password, firstName, lastName, businessType) => {
    const { data } = await axios.post('/api/auth/register', {
      email, password, firstName, lastName, businessType
    });
    set({ token: data.token, user: data.user });
    localStorage.setItem('token', data.token);
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  }
}));
```

#### 2.3 Frontend - Expense Dashboard
**File: `frontend/src/pages/Expenses.tsx`**

Create:
- [ ] List all expenses (table view)
- [ ] Add expense form
- [ ] Edit expense modal
- [ ] Delete expense button
- [ ] Filter by category, date range
- [ ] Search by description

---

## PHASE 2: Tax Calculation Engine (Weeks 3-4)

### Week 3: Core Tax Logic

#### 3.1 Tax Calculation Service
**File: `backend/src/services/taxCalculationService.ts`**

```typescript
export interface TaxCalculation {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  taxableIncome: number;
  federalTax: number;
  stateIncome Tax: number;
  selfEmploymentTax: number;
  totalTax: number;
  estimatedQuarterlyPayment: number;
}

export const calculateQuarterlyTax = async (userId: number, quarter: number, year: number): Promise<TaxCalculation> => {
  // Get all expenses for this quarter
  const expenses = await db.query(
    `SELECT SUM(deductible_amount) as total_deductions
     FROM expenses
     WHERE user_id = $1 AND tax_year = $2 AND quarter = $3 AND is_deductible = true`,
    [userId, year, quarter]
  );

  // Get all income for this quarter
  const income = await db.query(
    `SELECT SUM(amount_usd) as total_income
     FROM income_records
     WHERE user_id = $1 AND tax_year = $2 AND quarter = $3`,
    [userId, year, quarter]
  );

  const totalIncome = income.rows[0].total_income || 0;
  const totalDeductions = expenses.rows[0].total_deductions || 0;
  const netIncome = totalIncome - totalDeductions;

  // Self-employment tax: 15.3% on 92.35% of net income
  const seIncome = netIncome * 0.9235;
  const selfEmploymentTax = seIncome * 0.153;

  // Federal income tax (simplified brackets for 2024)
  const federalTax = calculateFederalTax(netIncome);

  // Total quarterly estimate
  const totalAnnualTax = federalTax + selfEmploymentTax;
  const estimatedQuarterlyPayment = totalAnnualTax / 4;

  return {
    totalIncome,
    totalExpenses: totalDeductions,
    netIncome,
    taxableIncome: netIncome, // Simplified
    federalTax,
    stateIncomeTax: 0, // TODO: Add by state
    selfEmploymentTax,
    totalTax: totalAnnualTax,
    estimatedQuarterlyPayment
  };
};

const calculateFederalTax = (income: number): number => {
  // 2024 brackets (single filer, simplified)
  if (income <= 11600) return income * 0.10;
  if (income <= 47150) return 1160 + (income - 11600) * 0.12;
  if (income <= 100525) return 5426 + (income - 47150) * 0.22;
  // ... etc
  return 0; // Placeholder
};
```

#### 3.2 Tax Calculation Endpoint
**File: `backend/src/controllers/taxController.ts`**

```typescript
export const calculateQuarterly = async (req, res) => {
  const userId = req.userId;
  const { year = new Date().getFullYear() } = req.body;

  try {
    // Calculate for each quarter
    const calculations = [];
    for (let quarter = 1; quarter <= 4; quarter++) {
      const calc = await calculateQuarterlyTax(userId, quarter, year);
      calculations.push({ quarter, ...calc });

      // Store in database
      await db.query(
        `INSERT INTO tax_calculations (user_id, tax_year, quarter, ...)
         VALUES ($1, $2, $3, ...) ON CONFLICT (...) DO UPDATE SET ...`,
        [userId, year, quarter, ...]
      );
    }

    res.json({ year, calculations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### 3.3 Frontend - Tax Dashboard
**File: `frontend/src/pages/TaxEstimate.tsx`**

Create:
- [ ] Display quarterly tax estimates
- [ ] Show breakdown: income, deductions, tax owed
- [ ] Payment due dates calendar
- [ ] Progress bars for each quarter
- [ ] Annual summary

### Week 4: Claude AI Integration

#### 4.1 Claude API Setup
**File: `backend/src/services/claudeService.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export const askTaxQuestion = async (userId: number, question: string, context: any): Promise<string> => {
  const systemPrompt = `You are a friendly tax advisor for freelancers.
You help freelancers understand tax deductions and optimize their tax situation.
You are NOT a licensed tax attorney - always disclaim this and recommend consulting a CPA for important decisions.
Be specific, practical, and reference actual IRS rules when possible.

User context:
- Business type: ${context.businessType}
- Annual income: $${context.annualIncome}
- Current deductions: $${context.totalDeductions}`;

  const response = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: question
      }
    ]
  });

  const answer = response.content[0].type === "text" ? response.content[0].text : "";

  // Log for analytics
  await db.query(
    `INSERT INTO ai_conversations (user_id, topic, messages, tokens_used, cost_usd)
     VALUES ($1, 'tax_question', $2, $3, $4)`,
    [
      userId,
      JSON.stringify([
        { role: "user", content: question },
        { role: "assistant", content: answer }
      ]),
      response.usage.input_tokens + response.usage.output_tokens,
      (response.usage.input_tokens * 0.008 + response.usage.output_tokens * 0.024) / 1000000
    ]
  );

  return answer;
};

export const generateDeductionSuggestions = async (userId: number, expenses: any[]): Promise<string[]> => {
  const expenseList = expenses
    .map(e => `${e.category}: $${e.amount} (${e.description})`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Based on these freelance expenses, what additional deductions might this person be missing?\n\n${expenseList}\n\nProvide 3-5 specific suggestions with dollar estimates.`
      }
    ]
  });

  return (response.content[0].type === "text" ? response.content[0].text : "").split("\n").filter(s => s.trim());
};
```

#### 4.2 AI Chat Endpoint
**File: `backend/src/routes/aiRoutes.ts`**

```typescript
router.post('/api/ai/ask', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { question } = req.body;

  // Get user context
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const expenses = await db.query(
    'SELECT SUM(deductible_amount) as total FROM expenses WHERE user_id = $1',
    [userId]
  );

  const context = {
    businessType: user.rows[0].business_type,
    annualIncome: 50000, // TODO: Calculate from income_records
    totalDeductions: expenses.rows[0].total || 0
  };

  const answer = await askTaxQuestion(userId, question, context);
  res.json({ question, answer });
});

router.get('/api/ai/suggestions', authMiddleware, async (req, res) => {
  const userId = req.userId;

  const expenses = await db.query(
    'SELECT * FROM expenses WHERE user_id = $1 AND tax_year = $2',
    [userId, new Date().getFullYear()]
  );

  const suggestions = await generateDeductionSuggestions(userId, expenses.rows);
  res.json({ suggestions });
});
```

#### 4.3 Frontend - AI Chat Page
**File: `frontend/src/pages/AiGuidance.tsx`**

Create:
- [ ] Chat interface
- [ ] Question input
- [ ] Conversation history
- [ ] Deduction suggestions display

---

## PHASE 3: Reports & Exports (Weeks 5-6)

### Week 5: Report Generation

#### 5.1 PDF Report Generation
**File: `backend/src/services/reportService.ts`**

```typescript
import PDFDocument from "pdfkit";
import { Readable } from "stream";

export const generateQuarterlyReport = async (userId: number, quarter: number, year: number) => {
  // Fetch data
  const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
  const calculation = await db.query(
    "SELECT * FROM tax_calculations WHERE user_id = $1 AND quarter = $2 AND tax_year = $3",
    [userId, quarter, year]
  );

  const expenses = await db.query(
    "SELECT * FROM expenses WHERE user_id = $1 AND quarter = $2 AND tax_year = $3",
    [userId, quarter, year]
  );

  // Create PDF
  const doc = new PDFDocument();

  doc.fontSize(20).text("Quarterly Tax Report", { align: "center" });
  doc.fontSize(12).text(`Q${quarter} ${year}`, { align: "center" });

  doc.moveDown().fontSize(14).text("Summary");
  doc.fontSize(11)
    .text(`Total Income: $${calculation.rows[0].total_income.toFixed(2)}`)
    .text(`Total Deductions: $${calculation.rows[0].total_deductions.toFixed(2)}`)
    .text(`Estimated Tax: $${calculation.rows[0].estimated_quarterly_payment.toFixed(2)}`)
    .text(`Due Date: ${getDueDate(quarter, year).toLocaleDateString()}`);

  // Add expenses table
  doc.moveDown().fontSize(14).text("Expenses");
  expenses.rows.forEach(expense => {
    doc.fontSize(10).text(`${expense.date}: ${expense.category} - $${expense.amount}`);
  });

  // Return as buffer
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
};
```

#### 5.2 Report Download Endpoint
```typescript
router.get("/api/reports/quarterly/:quarter/:year", authMiddleware, async (req, res) => {
  const { quarter, year } = req.params;
  const userId = req.userId;

  const pdf = await generateQuarterlyReport(userId, parseInt(quarter), parseInt(year));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="Q${quarter}-${year}-tax-report.pdf"`);
  res.send(pdf);
});
```

### Week 6: Export Formats & Polish

- [ ] CSV export
- [ ] JSON export
- [ ] Email reports
- [ ] Report history/downloads
- [ ] Payment tracking

---

## PHASE 4: Frontend Dashboard & UI (Weeks 5-6)

### 4.1 Dashboard Home
**File: `frontend/src/pages/Dashboard.tsx`**

Display:
- [ ] Key metrics (total income, total deductions, tax estimate)
- [ ] Quick actions (add expense, view report)
- [ ] Recent expenses list
- [ ] Upcoming payment dates
- [ ] Charts: income vs expenses over time

### 4.2 Complete App Layout
- [ ] Sidebar navigation
- [ ] Header with user menu
- [ ] Protected routes
- [ ] 404 page
- [ ] Loading states

---

## PHASE 5: Payments & Subscriptions (Weeks 7-8)

### 5.1 Stripe Integration
**File: `backend/src/services/billingService.ts`**

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createCheckoutSession = async (userId: number, planId: string) => {
  const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);

  const session = await stripe.checkout.sessions.create({
    customer_email: user.rows[0].email,
    line_items: [
      {
        price: planId, // premium_monthly, etc
        quantity: 1
      }
    ],
    mode: "subscription",
    success_url: `${process.env.BASE_URL}/dashboard?success=true`,
    cancel_url: `${process.env.BASE_URL}/pricing`
  });

  return session.url;
};
```

### 5.2 Webhook Handler
```typescript
router.post("/api/webhooks/stripe", async (req, res) => {
  const event = req.body;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      // Update subscription in DB
      const subscription = event.data.object;
      await db.query(
        "INSERT INTO subscriptions (...) VALUES (...) ON CONFLICT DO UPDATE SET ...",
        [subscription.customer, subscription.id, subscription.status, ...]
      );
      break;

    case "invoice.payment_succeeded":
      // Send receipt email
      break;
  }

  res.json({ received: true });
});
```

### 5.3 Pricing Page
**File: `frontend/src/pages/Pricing.tsx`**

Display:
- [ ] Free tier (limited features)
- [ ] Basic ($15/month)
- [ ] Premium ($30/month)
- [ ] Pro ($99/month)
- [ ] Feature comparison
- [ ] Purchase buttons

---

## PHASE 6: Testing & Deployment (Weeks 9-10)

### Week 9: Testing
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing
- [ ] Security audit

### Week 10: Deployment
- [ ] Docker setup
- [ ] Deploy to DigitalOcean
- [ ] Configure domain
- [ ] SSL certificates
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)

---

## Milestones & Success Criteria

### End of Week 2: MVP Core
- ✅ Users can register/login
- ✅ Add and view expenses
- ✅ Database fully functional
- **Demo**: "I can track my expenses"

### End of Week 4: Tax Calculations
- ✅ Calculate quarterly taxes
- ✅ AI Q&A working
- ✅ Dashboard shows estimates
- **Demo**: "I know how much tax I owe"

### End of Week 6: Reports
- ✅ Generate PDF reports
- ✅ Export data
- ✅ Polished UI
- **Demo**: "I can get my tax info in any format"

### End of Week 8: Payments
- ✅ Stripe working
- ✅ Paid tiers available
- ✅ Full feature parity
- **Demo**: "I can pay for the service"

### End of Week 10: Production Ready
- ✅ All tests passing
- ✅ Deployed & live
- ✅ Monitoring configured
- ✅ Ready for customers

---

## Quick Build Checklist

### Backend Commands
```bash
cd backend
npm install
npm run migrate  # Run migrations
npm run dev     # Start dev server (localhost:3000)
npm run test    # Run tests
npm run build   # Build for production
```

### Frontend Commands
```bash
cd frontend
npm install
npm run dev     # Start dev (localhost:5173)
npm run build   # Build for production
npm run preview # Preview prod build
```

### Deployment
```bash
# Docker
docker-compose up -d

# Logs
docker-compose logs -f backend

# Stop
docker-compose down
```

---

## Success Metrics

By end of implementation:
- ✅ MVP deployed to production
- ✅ 20+ beta users (friends, Twitter)
- ✅ <200ms API response times
- ✅ 99.5% uptime
- ✅ <500MB total database
- ✅ <100ms page loads

**Revenue milestone:**
- Month 2: 5-10 paid users ($75-150/month)
- Month 3: 20-30 paid users ($300-450/month)
- Month 4: 50+ paid users ($750+/month)
- Month 5-6: 200+ paid users ($3000+/month) → Approaching $5k MRR
