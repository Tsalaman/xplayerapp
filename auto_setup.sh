#!/bin/bash

# 🚀 Auto Setup Script - Runs everything automatically
# Usage: SUPABASE_ACCESS_TOKEN="your_token" ./auto_setup.sh

set -e

PROJECT_REF="ueadvfdlichltivzjoeq"
FCM_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"

echo ""
echo "🚀 Auto Setup - Supabase Functions"
echo "=================================="
echo ""

# Check if token is provided
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN not set"
    echo ""
    echo "Usage:"
    echo "  SUPABASE_ACCESS_TOKEN=\"your_token\" ./auto_setup.sh"
    echo ""
    echo "Get your token from: https://supabase.com/account/tokens"
    exit 1
fi

echo "✅ Token found"
echo "🔗 Project: $PROJECT_REF"
echo ""

# Step 1: Link project
echo "1️⃣  Linking with project..."
if supabase link --project-ref "$PROJECT_REF" 2>&1; then
    echo "✅ Linked successfully!"
else
    echo "❌ Failed to link"
    exit 1
fi

echo ""

# Step 2: Set FCM secret
echo "2️⃣  Setting FCM Secret..."
if supabase secrets set FCM_SERVER_KEY="$FCM_KEY" 2>&1; then
    echo "✅ Secret set successfully!"
else
    echo "❌ Failed to set secret"
    exit 1
fi

echo ""

# Step 3: Verify secrets
echo "3️⃣  Verifying secrets..."
supabase secrets list

echo ""

# Step 4: Deploy function
echo "4️⃣  Deploying function send_fcm_push..."
if supabase functions deploy send_fcm_push --project-ref "$PROJECT_REF" 2>&1; then
    echo ""
    echo "✅✅✅ SUCCESS! ✅✅✅"
    echo ""
    echo "📱 Function URL:"
    echo "   https://$PROJECT_REF.functions.supabase.co/send_fcm_push"
    echo ""
    echo "🎉 All done!"
else
    echo "❌ Failed to deploy function"
    exit 1
fi

