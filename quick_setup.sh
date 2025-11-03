#!/bin/bash

# 🚀 Quick Supabase Setup - Run this after getting your access token

PROJECT_REF="ueadvfdlichltivzjoeq"
FCM_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"

echo "🚀 Quick Supabase Setup"
echo "======================="
echo ""
echo "Project Ref: $PROJECT_REF"
echo ""

# Check if token is provided as argument
if [ -z "$1" ]; then
    echo "Usage: $0 <your-access-token>"
    echo ""
    echo "Get your access token from: https://supabase.com/account/tokens"
    exit 1
fi

export SUPABASE_ACCESS_TOKEN="$1"

echo "1️⃣ Linking with project..."
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "2️⃣ Setting FCM Secret..."
supabase secrets set FCM_SERVER_KEY="$FCM_KEY"

echo ""
echo "3️⃣ Verifying secrets..."
supabase secrets list

echo ""
echo "4️⃣ Deploying function..."
supabase functions deploy send_fcm_push --project-ref "$PROJECT_REF"

echo ""
echo "✅ Done! Function URL:"
echo "https://$PROJECT_REF.functions.supabase.co/send_fcm_push"

