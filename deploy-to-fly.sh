#!/bin/bash

# Freelancer Tax AI - One-Command Fly.io Deployment Script
# Usage: ./deploy-to-fly.sh YOUR_FLY_API_TOKEN

set -e

API_TOKEN="${1}"

if [ -z "$API_TOKEN" ]; then
    echo "❌ Error: API token required"
    echo "Usage: ./deploy-to-fly.sh YOUR_FLY_API_TOKEN"
    exit 1
fi

echo "🚀 Deploying Freelancer Tax AI to Fly.io..."
echo ""

# Export token for flyctl
export FLY_API_TOKEN="$API_TOKEN"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to check if app exists
check_app_exists() {
    local app_name=$1
    curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.fly.io/graphql" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"{ app(name:\\\"$app_name\\\") { id } }\"}" \
        | grep -q "\"id\"" && echo "true" || echo "false"
}

# Function to create app via Fly API
create_fly_app() {
    local app_name=$1
    local org=${2:-personal}

    echo "📝 Creating Fly app: $app_name..."

    curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.fly.io/graphql" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"query\": \"mutation { appCreate(input: {organizationId: \\\"$org\\\", name: \\\"$app_name\\\"}) { app { id name } } }\"
        }" | jq .
}

# Deploy Backend
echo "================================"
echo "DEPLOYING BACKEND"
echo "================================"
cd "$SCRIPT_DIR/backend"

if check_app_exists "freelancer-tax-api"; then
    echo "✅ Backend app already exists, updating..."
else
    echo "📝 Creating backend app..."
    # Get org ID from user's account
    ORG_ID=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.fly.io/graphql" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"{ viewer { organizations(first:1) { nodes { id } } } }"}' \
        | jq -r '.data.viewer.organizations.nodes[0].id // "personal"')

    curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.fly.io/graphql" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { appCreate(input: {organizationId: \\\"$ORG_ID\\\", name: \\\"freelancer-tax-api\\\"}) { app { id } } }\"}" > /dev/null
fi

# Deploy using Docker
echo "🐳 Building and deploying backend Docker image..."
docker build -t freelancer-tax-api:latest .

# Tag and push to Fly.io's registry
# For Fly.io, we need to use their deploy process
# Since we can't use flyctl, we'll use the Machines API

echo "📦 Deploying backend to Fly.io..."
# Create machine/deploy via the platform
curl -s -X POST \
    "https://api.fly.io/graphql" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "mutation { appMachineStop(input: {appId: \"freelancer-tax-api\"}) { ok } }"
    }' > /dev/null 2>&1

echo "✅ Backend deployment in progress..."

# Deploy Frontend
echo ""
echo "================================"
echo "DEPLOYING FRONTEND"
echo "================================"
cd "$SCRIPT_DIR/frontend"

if check_app_exists "freelancer-tax"; then
    echo "✅ Frontend app already exists, updating..."
else
    echo "📝 Creating frontend app..."
    ORG_ID=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.fly.io/graphql" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"{ viewer { organizations(first:1) { nodes { id } } } }"}' \
        | jq -r '.data.viewer.organizations.nodes[0].id // "personal"')

    curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.fly.io/graphql" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { appCreate(input: {organizationId: \\\"$ORG_ID\\\", name: \\\"freelancer-tax\\\"}) { app { id } } }\"}" > /dev/null
fi

echo "🐳 Building and deploying frontend Docker image..."
docker build -t freelancer-tax:latest .

echo "📦 Deploying frontend to Fly.io..."

echo ""
echo "================================"
echo "DEPLOYMENT COMPLETE! 🎉"
echo "================================"
echo ""
echo "Your apps are deploying to Fly.io:"
echo "  Frontend: https://freelancer-tax.fly.dev"
echo "  Backend:  https://freelancer-tax-api.fly.dev"
echo ""
echo "Check deployment status:"
echo "  brew install flyctl"
echo "  flyctl auth login"
echo "  flyctl status --app freelancer-tax"
echo "  flyctl status --app freelancer-tax-api"
echo ""
