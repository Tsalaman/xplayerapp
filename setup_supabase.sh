#!/bin/bash

# 🚀 Supabase Setup Script
# Αυτό το script βοηθάει με τη ρύθμιση του Supabase CLI και deploy της function

set -e  # Exit on error

echo "🚀 Supabase CLI Setup Script"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI δεν είναι εγκατεστημένο${NC}"
    echo "Εγκατάσταση με Homebrew..."
    brew install supabase/tap/supabase
else
    echo -e "${GREEN}✅ Supabase CLI είναι εγκατεστημένο${NC}"
    supabase --version
fi

echo ""
echo -e "${YELLOW}📋 Τα επόμενα βήματα χρειάζονται χειροκίνητη ενέργεια:${NC}"
echo ""
echo "1️⃣  Κάνε login στο Supabase:"
echo "   ${GREEN}supabase login${NC}"
echo "   (Θα χρειαστεί access token από: https://supabase.com/account/tokens)"
echo ""
echo "2️⃣  Σύνδεσε με το project σου:"
echo "   ${GREEN}supabase link --project-ref <your-project-ref>${NC}"
echo "   (Βρες το project ref από το Supabase Dashboard URL)"
echo ""
echo "3️⃣  Ορίστε το FCM Secret:"
echo "   ${GREEN}supabase secrets set FCM_SERVER_KEY=\"BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE\"${NC}"
echo ""
echo "4️⃣  Κάνε deploy τη function:"
echo "   ${GREEN}supabase functions deploy send_fcm_push --project-ref <your-project-ref>${NC}"
echo ""
echo -e "${GREEN}✅ Το script έχει ολοκληρωθεί!${NC}"
echo "Ακολούθησε τα παραπάνω βήματα."

