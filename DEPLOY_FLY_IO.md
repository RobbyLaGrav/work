# Deploy to Fly.io - Complete Guide

## Prerequisites
1. Fly.io account (https://fly.io)
2. Fly CLI installed: https://fly.io/docs/getting-started/installing-flyctl/
3. Your Fly API token ready

## Quick Deploy (5 minutes)

### Step 1: Authenticate with Fly.io
```bash
flyctl auth login
# Paste your API token when prompted
```

### Step 2: Deploy Backend
```bash
cd backend

# Create the app on Fly.io
flyctl launch --no-deploy --name freelancer-tax-api --region ord

# Deploy
flyctl deploy

# Get the backend URL (you'll need this)
flyctl status
# Note the URL - should be something like: https://freelancer-tax-api.fly.dev
```

### Step 3: Update Frontend Config
Get your backend URL from Step 2, then update `frontend/fly.toml`:

```toml
[env]
VITE_API_URL = "https://freelancer-tax-api.fly.dev"  # Replace with your actual URL
```

Also update `backend/fly.toml` if you changed the frontend app name:

```toml
[env]
FRONTEND_URL = "https://freelancer-tax.fly.dev"  # Your frontend URL
```

### Step 4: Deploy Frontend
```bash
cd frontend

# Create the app on Fly.io
flyctl launch --no-deploy --name freelancer-tax --region ord

# Deploy
flyctl deploy
```

### Step 5: Verify Both Apps Are Running
```bash
# Check backend
flyctl status --app freelancer-tax-api

# Check frontend
flyctl status --app freelancer-tax
```

## Environment Variables

If you need to add your Claude API key for AI features:

```bash
# For backend
flyctl secrets set CLAUDE_API_KEY=sk-ant-your-key-here --app freelancer-tax-api
```

## Useful Commands

```bash
# View logs
flyctl logs --app freelancer-tax-api
flyctl logs --app freelancer-tax

# Scale down to save costs (free tier)
flyctl scale memory 256 --app freelancer-tax-api
flyctl scale memory 256 --app freelancer-tax

# SSH into the app
flyctl ssh console --app freelancer-tax-api

# Destroy apps when done
flyctl apps destroy freelancer-tax-api
flyctl apps destroy freelancer-tax
```

## Accessing Your App

After both deploy successfully:
- **Frontend**: https://freelancer-tax.fly.dev
- **Backend API**: https://freelancer-tax-api.fly.dev/health

## Free Tier Limits (Fly.io)
- 3 shared-cpu-1x 256MB VMs
- 3GB persistent storage
- That's enough for both apps!

## Database
SQLite database persists in a mounted volume, so your data is saved between deploys.

## Cost
- **Free tier**: $0 (3 VMs included)
- **Beyond**: Only pay for additional resources, typically $5-10/month for small usage

---

**You're all set!** Just follow the steps above and your app will be live on the internet. 🚀
