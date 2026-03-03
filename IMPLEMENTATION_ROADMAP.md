# Implementation Roadmap - Step-by-Step Development Guide

## Overview Timeline: 8-10 Weeks
This is a phased rollout plan to get from zero to MVP (Minimum Viable Product) to paying customers.

---

## PHASE 1: Foundation & Setup (Weeks 1-2)

### Week 1: Development Environment & Backend Setup

#### 1.1 Repository Setup
- [ ] Create project structure
```bash
ai-phone-agent/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   └── index.ts
│   ├── migrations/
│   ├── tests/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── styles/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── docs/
    └── API.md
```

#### 1.2 Backend Initialization
```bash
# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express dotenv pg axios
npm install -D typescript ts-node @types/node @types/express

# Create database connection
# src/config/database.ts
```

**Key File: `src/config/database.ts`**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
```

#### 1.3 Database Setup
- [ ] Set up DigitalOcean PostgreSQL managed database
- [ ] Create database credentials
- [ ] Run initial schema migration
```sql
-- migrations/001_init.sql
CREATE TABLE users (...)
CREATE TABLE agents (...)
CREATE TABLE calls (...)
-- ... (see DATABASE_SCHEMA.md)
```

#### 1.4 Environment Configuration
```bash
# .env
DATABASE_URL=postgresql://user:password@host:5432/aiphone
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
JWT_SECRET=your_secret_key_here
PLIVO_AUTH_ID=xxx
PLIVO_AUTH_TOKEN=xxx
CLAUDE_API_KEY=xxx
GOOGLE_CLOUD_TTS_KEY=xxx
STRIPE_SECRET_KEY=xxx
```

### Week 2: User Authentication & Database Migrations

#### 2.1 User Authentication System
**File: `src/controllers/authController.ts`**

Tasks:
- [ ] Implement user registration endpoint
- [ ] Implement login endpoint
- [ ] Implement JWT token generation
- [ ] Implement password hashing (bcrypt)
- [ ] Implement password reset flow
- [ ] Create middleware for JWT verification

```typescript
// Example structure
export const register = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Validate input
  // Hash password
  // Create user in database
  // Generate JWT token
  // Return token
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user
  // Verify password
  // Generate JWT token
  // Return token
};
```

#### 2.2 Database Migrations
- [ ] Create migration system (simple file-based)
- [ ] Run all schema migrations
- [ ] Create indexes
- [ ] Set up database triggers (optional)

#### 2.3 API Routes Setup
**File: `src/routes/index.ts`**

Routes to implement:
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout
GET    /api/users/profile
```

#### 2.4 Middleware
- [ ] JWT authentication middleware
- [ ] Error handling middleware
- [ ] Request validation middleware
- [ ] Logging middleware

---

## PHASE 2: Phone Integration & Agent Setup (Weeks 3-4)

### Week 3: Plivo Integration & Phone Number Provisioning

#### 3.1 Plivo API Integration
**File: `src/services/plivoService.ts`**

```typescript
import plivo from 'plivo';

export const plivoClient = plivo.RestClient(
  process.env.PLIVO_AUTH_ID,
  process.env.PLIVO_AUTH_TOKEN
);

export const buyPhoneNumber = async (country: string = 'US') => {
  // Find available numbers
  // Purchase number
  // Store in database
  // Return number
};

export const setupWebhook = async (phoneNumber: string) => {
  // Configure incoming call webhook
  // Set answer URL to our endpoint
};

export const makeCall = async (toNumber: string, callback: string) => {
  // Initiate outbound call
};
```

#### 3.2 Phone Number Management
**Endpoints:**
```
POST   /api/phone-numbers - Buy number
GET    /api/phone-numbers - List user's numbers
DELETE /api/phone-numbers/:id - Release number
PUT    /api/phone-numbers/:id - Update settings
```

Tasks:
- [ ] Create phone_numbers table
- [ ] Implement number purchase flow
- [ ] Store Plivo provider IDs
- [ ] Implement number release/cancellation

#### 3.3 Incoming Call Webhook
**File: `src/routes/callWebhooks.ts`**

```typescript
app.post('/webhooks/plivo/incoming-call', async (req, res) => {
  const { From, To, CallUUID } = req.body;

  // Find agent associated with To number
  // Find business hours / availability
  // If open: route to AI agent
  // If closed: route to voicemail
  // Send response with XML instructions
});
```

### Week 4: Agent Management & Voice Setup

#### 4.1 Agent CRUD Operations
**File: `src/controllers/agentController.ts`**

Endpoints:
```
POST   /api/agents - Create agent
GET    /api/agents - List agents
GET    /api/agents/:id - Get agent details
PUT    /api/agents/:id - Update agent
DELETE /api/agents/:id - Delete agent
```

#### 4.2 Voice Configuration
Store voice settings in agents table:
- Voice provider (Google Cloud, ElevenLabs, Azure)
- Language, accent, speed, pitch
- System prompt for AI behavior

#### 4.3 Google Cloud TTS Setup
**File: `src/services/ttsService.ts`**

```typescript
import textToSpeech from '@google-cloud/text-to-speech';

const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_CLOUD_TTS_KEY
});

export const synthesizeSpeech = async (text: string, voiceConfig: any) => {
  const request = {
    input: { text },
    voice: {
      languageCode: voiceConfig.language,
      name: voiceConfig.voiceName
    },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: voiceConfig.pitch,
      speakingRate: voiceConfig.speed
    }
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
};
```

#### 4.4 Google Cloud Speech-to-Text Setup
**File: `src/services/sttService.ts`**

```typescript
import speech from '@google-cloud/speech';

const speechClient = new speech.SpeechClient();

export const transcribeAudio = async (audioBuffer: Buffer) => {
  const request = {
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US'
    }
  };

  const [response] = await speechClient.recognize(request);
  return response.results[0].alternatives[0].transcript;
};
```

---

## PHASE 3: AI Conversation Engine (Weeks 5-6)

### Week 5: Claude API Integration & Conversation Logic

#### 5.1 Claude API Integration
**File: `src/services/claudeService.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export const generateResponse = async (
  conversationHistory: any[],
  systemPrompt: string
) => {
  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: conversationHistory
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
};
```

#### 5.2 Call State Management
**File: `src/services/callService.ts`**

Track call state in Redis for fast access:
```typescript
export const initializeCall = async (callId: string, agentId: number) => {
  const callState = {
    callId,
    agentId,
    startTime: Date.now(),
    transcript: [],
    state: 'ringing'
  };

  // Store in Redis with 1-hour expiry
  await redis.set(`call:${callId}`, JSON.stringify(callState), 'EX', 3600);
};

export const addMessage = async (callId: string, speaker: 'agent' | 'caller', text: string) => {
  const state = await getCallState(callId);
  state.transcript.push({ speaker, text, timestamp: Date.now() });
  await updateCallState(callId, state);
};
```

#### 5.3 Real-time Conversation Loop
**File: `src/services/conversationEngine.ts`**

```typescript
export const processIncomingAudio = async (callId: string, audioBuffer: Buffer) => {
  // 1. Transcribe audio to text
  const callerText = await transcribeAudio(audioBuffer);

  // 2. Add to conversation history
  await addMessage(callId, 'caller', callerText);

  // 3. Get agent's system prompt
  const callState = await getCallState(callId);
  const agent = await db.agents.findById(callState.agentId);

  // 4. Get conversation history from Redis
  const history = await getConversationHistory(callId);

  // 5. Generate AI response
  const aiResponse = await generateResponse(history, agent.system_prompt);

  // 6. Add agent response to history
  await addMessage(callId, 'agent', aiResponse);

  // 7. Synthesize to speech
  const audioUrl = await synthesizeSpeech(aiResponse, agent.voice_profile);

  // 8. Return audio URL to play
  return audioUrl;
};
```

### Week 6: Business Logic & Advanced Features

#### 6.1 Business Hours Management
**File: `src/services/businessHoursService.ts`**

```typescript
export const isAgentAvailable = async (agentId: number) => {
  const agent = await db.agents.findById(agentId);
  const now = new Date();

  // Check if within business hours
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const time = now.toTimeString().slice(0, 5); // HH:MM

  const dayHours = agent.business_hours[dayOfWeek];
  if (!dayHours) return false;

  return time >= dayHours.start && time <= dayHours.end;
};
```

#### 6.2 Appointment Scheduling
**File: `src/services/schedulingService.ts`**

Integrate with Google Calendar:
```typescript
export const bookAppointment = async (
  agentId: number,
  customerName: string,
  customerEmail: string,
  requestedTime: Date,
  duration: number
) => {
  // Check availability
  const isAvailable = await checkCalendarAvailability(agentId, requestedTime, duration);

  if (!isAvailable) {
    return { success: false, message: 'Not available at that time' };
  }

  // Create calendar event
  const event = await createCalendarEvent(agentId, {
    title: `Appointment with ${customerName}`,
    startTime: requestedTime,
    endTime: new Date(requestedTime.getTime() + duration * 60000),
    attendees: [{ email: customerEmail }]
  });

  // Send confirmation email
  await sendEmail(customerEmail, `Appointment Confirmed`, `...`);

  return { success: true, eventId: event.id };
};
```

#### 6.3 Sentiment Analysis
**File: `src/services/sentimentService.ts`**

Analyze call sentiment post-call:
```typescript
export const analyzeSentiment = async (transcript: string) => {
  // Use Claude to analyze sentiment
  const response = await generateResponse([
    { role: 'user', content: `Analyze the sentiment of this conversation: ${transcript}` }
  ], 'You are a sentiment analysis expert.');

  // Extract score from response
  return extractSentimentScore(response);
};
```

---

## PHASE 4: Frontend & Dashboard (Weeks 7-8)

### Week 7: Frontend Setup & Authentication Pages

#### 7.1 React + Vite Setup
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

#### 7.2 UI Components & Styling
```bash
npm install tailwindcss shadcn/ui zustand axios react-query
```

#### 7.3 Authentication Pages
Create these pages:
- [ ] `src/pages/Login.tsx`
- [ ] `src/pages/Register.tsx`
- [ ] `src/pages/ForgotPassword.tsx`
- [ ] `src/pages/ResetPassword.tsx`

#### 7.4 Layout Components
- [ ] `src/components/Layout.tsx` (main layout)
- [ ] `src/components/Sidebar.tsx` (navigation)
- [ ] `src/components/Header.tsx` (top bar)

#### 7.5 Store Setup (Zustand)
**File: `src/store/authStore.ts`**

```typescript
import { create } from 'zustand';

interface AuthStore {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    set({ token: response.data.token, user: response.data.user });
    localStorage.setItem('token', response.data.token);
  },
  register: async (email, password, firstName, lastName) => {
    const response = await axios.post('/api/auth/register', {
      email, password, firstName, lastName
    });
    set({ token: response.data.token, user: response.data.user });
    localStorage.setItem('token', response.data.token);
  },
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  }
}));
```

### Week 8: Dashboard Pages

#### 8.1 Dashboard Home Page
**File: `src/pages/Dashboard.tsx`**
- Welcome message
- Key metrics (calls today, minutes used, agents status)
- Recent calls list
- Quick actions

#### 8.2 Agent Management Page
**File: `src/pages/Agents.tsx`**
- List all agents
- Create new agent form
- Edit agent settings
- Test agent with voice call
- Delete agent

#### 8.3 Call History Page
**File: `src/pages/Calls.tsx`**
- Filter by agent, date, status
- View call details
- Play recordings
- View transcripts
- Sentiment analysis visualization

#### 8.4 Calendar Page
**File: `src/pages/Calendar.tsx`**
- Display calendar
- Show business hours
- View booked appointments
- Connect Google Calendar

#### 8.5 Analytics Page
**File: `src/pages/Analytics.tsx`**
- Charts: calls per day, average duration
- Success rate metrics
- Sentiment trends
- Top contacts

#### 8.6 Settings Page
**File: `src/pages/Settings.tsx`**
- Account settings
- Phone number management
- API keys management
- Webhook management

---

## PHASE 5: Billing & Subscription (Weeks 9)

### Stripe Integration

#### 9.1 Subscription Setup
**File: `src/services/billingService.ts`**

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createSubscription = async (userId: number, planId: string) => {
  // Get or create Stripe customer
  const user = await db.users.findById(userId);
  let stripeCustomerId = user.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.first_name + ' ' + user.last_name
    });
    stripeCustomerId = customer.id;
    await db.users.update(userId, { stripe_customer_id: customer.id });
  }

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: planId }]
  });

  // Store in database
  await db.subscriptions.create({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    status: subscription.status
  });

  return subscription;
};
```

#### 9.2 Webhook Handlers
**File: `src/routes/stripeWebhooks.ts`**

Handle these events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

#### 9.3 Frontend Billing Page
**File: `src/pages/Billing.tsx`**
- Show current subscription
- List available plans
- Upgrade/downgrade options
- Invoice history

---

## PHASE 6: Deployment & Testing (Week 10)

### 10.1 Backend Deployment
- [ ] Set up Docker containerization
- [ ] Deploy to DigitalOcean App Platform or Droplet
- [ ] Configure environment variables
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure domain name

### 10.2 Frontend Deployment
- [ ] Build for production (`npm run build`)
- [ ] Deploy to Vercel or DigitalOcean
- [ ] Configure CDN
- [ ] Set up error tracking (Sentry)

### 10.3 Testing
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] End-to-end tests (Cypress)
- [ ] Load testing (k6)
- [ ] Security audit

### 10.4 Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up logging (ELK stack or Cloud Logging)
- [ ] Configure alerts

---

## Development Milestones Checklist

### End of Week 2: MVP Core
- [ ] User authentication working
- [ ] Database fully migrated
- [ ] Basic API structure in place
- **Demo**: User can register and login

### End of Week 4: Phone System
- [ ] Phone numbers can be purchased
- [ ] Incoming calls are routed
- [ ] Voicemail system working
- **Demo**: Phone rings and can answer

### End of Week 6: AI Conversations
- [ ] Claude integration working
- [ ] Speech-to-text functional
- [ ] Text-to-speech working
- [ ] Full conversation loop operational
- **Demo**: Phone agent can have real conversations

### End of Week 8: Dashboard
- [ ] All dashboard pages built
- [ ] Call history displayed
- [ ] Analytics visible
- [ ] Calendar synced
- **Demo**: User can manage everything from dashboard

### End of Week 9: Payments
- [ ] Stripe integration working
- [ ] Subscription tiers available
- [ ] Billing page functional
- **Demo**: Users can subscribe and pay

### End of Week 10: Production Ready
- [ ] All tests passing
- [ ] Deployed to production
- [ ] Monitoring configured
- [ ] Ready for beta launch

---

## Quick Start Commands

### Backend Setup
```bash
cd backend
npm install
npm run migrate  # Run database migrations
npm run dev     # Start development server
npm run build   # Build for production
npm run test    # Run tests
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev     # Start dev server on http://localhost:5173
npm run build   # Build for production
npm run preview # Preview production build
```

### Docker Setup
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

---

## Key Files to Create by Week

| Week | Critical Files |
|------|----------------|
| 1-2 | `config/database.ts`, `controllers/authController.ts`, migrations |
| 3-4 | `services/plivoService.ts`, `services/ttsService.ts`, `routes/callWebhooks.ts` |
| 5-6 | `services/claudeService.ts`, `services/conversationEngine.ts` |
| 7-8 | All React pages, store setup, components |
| 9 | `services/billingService.ts`, Stripe webhooks |
| 10 | Docker config, tests, production setup |

---

## Success Criteria

By end of implementation:
- ✅ User can register, login, verify email
- ✅ User can purchase phone number within minutes
- ✅ Incoming calls routed to AI agent
- ✅ Agent understands context and has conversations
- ✅ Calendar integration for appointments
- ✅ Full analytics dashboard
- ✅ Stripe billing with multiple tiers
- ✅ Deployed to production
- ✅ <200ms API response times
- ✅ 99.5% uptime
