# ⚡ Automated Setup - Quick Guide

## ✅ Τι Έγινε Ήδη

- [x] Supabase CLI εγκαταστάθηκε ✅
- [x] Function `send_fcm_push` δημιουργήθηκε ✅
- [x] Project Ref βρέθηκε: `ueadvfdlichltivzjoeq` ✅
- [x] Setup scripts δημιουργήθηκαν ✅

---

## 🚀 Γρήγορη Εγκατάσταση (1 Command)

### Μέθοδος 1: Με Access Token (Προτείνεται)

**1️⃣ Πάρε το Access Token:**
- Πήγαινε στο: https://supabase.com/account/tokens
- Κάνε "Generate new token"
- Αντιγράψε τον token

**2️⃣ Τρέξε:**
```bash
./quick_setup.sh YOUR_ACCESS_TOKEN
```

**Παράδειγμα:**
```bash
./quick_setup.sh sbp_xxxxxxxxxxxxxxxxxxxxx
```

Αυτό θα:
- ✅ Κάνει link με το project
- ✅ Ορίσει το FCM secret
- ✅ Deploy την function

---

### Μέθοδος 2: Χειροκίνητα (Step by Step)

Αν προτιμάς να κάνεις τα βήματα ένα-ένα:

```bash
# 1. Login
supabase login
# (Θα ζητήσει token - πάρε το από https://supabase.com/account/tokens)

# 2. Link project
supabase link --project-ref ueadvfdlichltivzjoeq

# 3. Set FCM secret
supabase secrets set FCM_SERVER_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"

# 4. Deploy function
supabase functions deploy send_fcm_push --project-ref ueadvfdlichltivzjoeq
```

---

## 📋 Scripts Διαθέσιμα

### `quick_setup.sh`
Γρήγορη εγκατάσταση με ένα command:
```bash
./quick_setup.sh <access-token>
```

### `setup_supabase_automated.sh`
Interactive script με prompts:
```bash
./setup_supabase_automated.sh
```

---

## ✅ Μετά το Setup

### Function URL
```
https://ueadvfdlichltivzjoeq.functions.supabase.co/send_fcm_push
```

### Test με SQL:
```sql
select net.http_post(
  url := 'https://ueadvfdlichltivzjoeq.functions.supabase.co/send_fcm_push',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := jsonb_build_object(
    'token', '<YOUR_DEVICE_TOKEN>',
    'title', 'XPlayer Test',
    'body', 'Test notification 🚀'
  )
);
```

---

## 🔍 Troubleshooting

### "Access token not provided"
- Πρέπει να κάνεις login πρώτα: `supabase login`
- Ή χρησιμοποίησε το `quick_setup.sh` με token

### "Project not found"
- Ελέγξε ότι το project ref είναι σωστό: `ueadvfdlichltivzjoeq`
- Ελέγξε ότι έχεις access στο project

### "Function deployment failed"
- Ελέγξε ότι είσαι στο root directory
- Ελέγξε το internet connection
- Δες τα logs: `supabase functions logs send_fcm_push`

---

## ✅ Checklist

- [x] Supabase CLI εγκατεστημένο ✅
- [x] Project ref βρέθηκε ✅
- [x] Function δημιουργήθηκε ✅
- [ ] Login με access token
- [ ] Link με project
- [ ] FCM secret ορισμένο
- [ ] Function deployed

---

**Σημείωση:** Το πιο γρήγορο τρόπος είναι να τρέξεις `./quick_setup.sh YOUR_TOKEN`!

