#!/bin/bash

# 🚀 Interactive Supabase Setup
# Αυτό το script κάνει τα πάντα - απλά ζητάει το token!

set -e

PROJECT_REF="ueadvfdlichltivzjoeq"
FCM_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"

echo ""
echo "🚀 Supabase Setup - Quick Setup"
echo "================================"
echo ""
echo "📋 Χρειάζομαι το Access Token σου για να συνεχίσω."
echo ""
echo "1️⃣  Πήγαινε στο: https://supabase.com/account/tokens"
echo "2️⃣  Κάνε 'Generate new token'"
echo "3️⃣  Αντιγράψε τον token"
echo ""
read -p "📝 Επικόλλησε το Access Token εδώ: " ACCESS_TOKEN

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Δεν δόθηκε token. Exit..."
    exit 1
fi

echo ""
echo "🔐 Setting up..."
export SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN"

echo ""
echo "1️⃣  Linking with project ($PROJECT_REF)..."
if supabase link --project-ref "$PROJECT_REF" 2>&1; then
    echo "✅ Linked successfully!"
else
    echo "❌ Failed to link. Check your token."
    exit 1
fi

echo ""
echo "2️⃣  Setting FCM Secret..."
if supabase secrets set FCM_SERVER_KEY="$FCM_KEY" 2>&1; then
    echo "✅ Secret set successfully!"
else
    echo "❌ Failed to set secret."
    exit 1
fi

echo ""
echo "3️⃣  Verifying secrets..."
supabase secrets list

echo ""
echo "4️⃣  Deploying function send_fcm_push..."
if supabase functions deploy send_fcm_push --project-ref "$PROJECT_REF" 2>&1; then
    echo ""
    echo "✅✅✅ SUCCESS! Function deployed! ✅✅✅"
    echo ""
    echo "📱 Function URL:"
    echo "   https://$PROJECT_REF.functions.supabase.co/send_fcm_push"
    echo ""
    echo "🎉 Όλα έτοιμα!"
else
    echo "❌ Failed to deploy function."
    exit 1
fi

