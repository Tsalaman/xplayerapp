#!/bin/bash

# 🚀 Automated Supabase Setup Script
# Αυτό το script κάνει όλα τα βήματα αυτόματα

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Automated Supabase Setup${NC}"
echo "=============================="
echo ""

# Project ref from .env file
PROJECT_REF="ueadvfdlichltivzjoeq"
FCM_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Installing Supabase CLI...${NC}"
    brew install supabase/tap/supabase
else
    echo -e "${GREEN}✅ Supabase CLI is installed${NC}"
    supabase --version
fi

echo ""
echo -e "${YELLOW}📋 Χρειάζεσαι Access Token για login${NC}"
echo ""
echo "Για να συνεχίσω, μου χρειάζεται το Supabase Access Token."
echo ""
echo "1️⃣  Πήγαινε στο: ${BLUE}https://supabase.com/account/tokens${NC}"
echo "2️⃣  Κάνε 'Generate new token'"
echo "3️⃣  Αντιγράψε τον token"
echo ""
read -p "Επικόλλησε το Access Token εδώ (ή Enter για skip): " ACCESS_TOKEN
echo ""

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}⏭️  Skipping login...${NC}"
    echo "Θα χρειαστεί να κάνεις login χειροκίνητα:"
    echo "   ${GREEN}supabase login${NC}"
else
    echo -e "${BLUE}🔐 Logging in...${NC}"
    export SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN"
    echo -e "${GREEN}✅ Access token set${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Linking with project...${NC}"
echo "Project Ref: ${GREEN}$PROJECT_REF${NC}"

if supabase link --project-ref "$PROJECT_REF" 2>&1; then
    echo -e "${GREEN}✅ Project linked successfully!${NC}"
else
    echo -e "${RED}❌ Failed to link project${NC}"
    echo "Πιθανότατα χρειάζεται login πρώτα."
    exit 1
fi

echo ""
echo -e "${BLUE}🔒 Setting FCM Secret...${NC}"
if supabase secrets set FCM_SERVER_KEY="$FCM_KEY" 2>&1; then
    echo -e "${GREEN}✅ FCM Secret set successfully!${NC}"
else
    echo -e "${RED}❌ Failed to set secret${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Verifying secrets...${NC}"
supabase secrets list

echo ""
echo -e "${BLUE}🚀 Deploying function send_fcm_push...${NC}"
if supabase functions deploy send_fcm_push --project-ref "$PROJECT_REF" 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Function deployed successfully!${NC}"
    echo ""
    echo "Function URL:"
    echo -e "${GREEN}https://$PROJECT_REF.functions.supabase.co/send_fcm_push${NC}"
else
    echo -e "${RED}❌ Failed to deploy function${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "📝 Next steps:"
echo "   - Test the function with SQL query"
echo "   - Use the function URL in your triggers"

