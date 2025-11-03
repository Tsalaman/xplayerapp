# ⚠️ Setup - Χρειάζεται Access Token

## 🔐 Για να Συνεχίσω, Χρειάζομαι το Access Token

Δεν μπορώ να κάνω login αυτόματα γιατί χρειάζεται **Access Token** από εσένα.

---

## ✅ Τι Έγινε Ήδη

- ✅ Supabase CLI εγκαταστάθηκε
- ✅ Function `send_fcm_push` δημιουργήθηκε
- ✅ Project ref βρέθηκε: `ueadvfdlichltivzjoeq`
- ✅ Scripts έτοιμα

---

## 🚀 Γρήγορη Λύση (1 Command)

**1. Πάρε Access Token:**
- Πήγαινε: https://supabase.com/account/tokens
- Generate new token
- Copy τον token

**2. Τρέξε στο Terminal:**

```bash
cd /Users/dimitriostsalamanios/Desktop/x1,1
export SUPABASE_ACCESS_TOKEN="YOUR_TOKEN_HERE"
./quick_setup.sh $SUPABASE_ACCESS_TOKEN
```

Ή πιο απλά:
```bash
SUPABASE_ACCESS_TOKEN="YOUR_TOKEN" ./quick_setup.sh YOUR_TOKEN
```

---

## 📝 Εναλλακτικά (Χειροκίνητα)

Αν προτιμάς, μπορείς να τρέξεις τα commands ένα-ένα:

```bash
# 1. Login (θα ζητήσει token)
supabase login

# 2. Link
supabase link --project-ref ueadvfdlichltivzjoeq

# 3. Set secret
supabase secrets set FCM_SERVER_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"

# 4. Deploy
supabase functions deploy send_fcm_push --project-ref ueadvfdlichltivzjoeq
```

---

## 🎯 Quick Command (Με Token)

Αν έχεις ήδη το token:

```bash
SUPABASE_ACCESS_TOKEN="sbp_your_token_here" \
supabase link --project-ref ueadvfdlichltivzjoeq && \
supabase secrets set FCM_SERVER_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE" && \
supabase functions deploy send_fcm_push --project-ref ueadvfdlichltivzjoeq
```

---

**Σημείωση:** Χρειάζεται μόνο το access token για να συνεχίσω! Όλα τα άλλα είναι έτοιμα.

