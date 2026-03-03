#!/bin/bash

# Simple deployment script - just install flyctl and run this with your token

API_TOKEN="${1}"

if [ -z "$API_TOKEN" ]; then
    echo "❌ Usage: ./DEPLOY_WITH_TOKEN.sh YOUR_FLY_API_TOKEN"
    exit 1
fi

# Set environment
export FLY_API_TOKEN="$API_TOKEN"

echo "🚀 Starting deployment to Fly.io..."
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "📥 Installing flyctl..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$PATH:$HOME/.fly/bin"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Deploy Backend
echo "================================"
echo "🔷 DEPLOYING BACKEND"
echo "================================"
cd "$SCRIPT_DIR/backend"

echo "Launching backend app..."
flyctl launch --no-deploy --name freelancer-tax-api --region ord --yes 2>/dev/null || true

echo "Deploying backend..."
flyctl deploy --remote-only

BACKEND_URL=$(flyctl status | grep "hostname:" | awk '{print $NF}' || echo "freelancer-tax-api.fly.dev")
echo "✅ Backend deployed: https://$BACKEND_URL"

# Deploy Frontend
echo ""
echo "================================"
echo "🔵 DEPLOYING FRONTEND"
echo "================================"
cd "$SCRIPT_DIR/frontend"

echo "Launching frontend app..."
flyctl launch --no-deploy --name freelancer-tax --region ord --yes 2>/dev/null || true

echo "Updating environment variables..."
flyctl secrets set VITE_API_URL="https://$BACKEND_URL" 2>/dev/null || true

echo "Deploying frontend..."
flyctl deploy --remote-only

FRONTEND_URL=$(flyctl status | grep "hostname:" | awk '{print $NF}' || echo "freelancer-tax.fly.dev")
echo "✅ Frontend deployed: https://$FRONTEND_URL"

echo ""
echo "================================"
echo "✨ DEPLOYMENT COMPLETE! ✨"
echo "================================"
echo ""
echo "Your app is LIVE:"
echo ""
echo "  🌐 Frontend: https://$FRONTEND_URL"
echo "  🔌 Backend:  https://$BACKEND_URL"
echo ""
echo "Open your browser: https://$FRONTEND_URL"
echo ""
echo "Test account:"
echo "  Email: test@example.com"
echo "  Password: password123"
echo ""
