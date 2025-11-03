# ✅ Setup Status - Supabase CLI

## ✅ Τι Έγινε Ήδη (Αυτόματα)

- [x] **Supabase CLI εγκαταστάθηκε** ✅
  - Version: `2.54.11`
  - Εγκατάσταση: Homebrew (`brew install supabase/tap/supabase`)
  
- [x] **Function `send_fcm_push` δημιουργήθηκε** ✅
  - Location: `supabase/functions/send_fcm_push/index.ts`
  - Κώδικας: Έτοιμος με validation και error handling

- [x] **Setup script δημιουργήθηκε** ✅
  - Location: `setup_supabase.sh`
  - Εκτελέσιμο: `chmod +x` applied

---

## ⏳ Τι Πρέπει να Κάνεις Εσύ (Χειροκίνητα)

### 1️⃣ Login στο Supabase CLI

```bash
supabase login
```

**Τι θα γίνει:**
- Θα σου ζητήσει access token
- Πήγαινε στο: https://supabase.com/account/tokens
- Κάνε "Generate new token"
- Αντιγράψε τον token και επικόλλησέ τον στο terminal

---

### 2️⃣ Σύνδεση με το Project

```bash
supabase link --project-ref <your-project-ref>
```

**Πώς να βρεις το Project Ref:**
1. Άνοιξε το Supabase Dashboard
2. Στο URL θα δεις: `https://app.supabase.com/project/YOUR_PROJECT_REF`
3. Αντιγράψε το `YOUR_PROJECT_REF`

**Παράδειγμα:**
```bash
supabase link --project-ref ueadvfdlchlitvjeqoj
```

---

### 3️⃣ Ορισμός FCM Secret

```bash
supabase secrets set FCM_SERVER_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"
```

**Verification:**
```bash
supabase secrets list
```
Θα πρέπει να βλέπεις το `FCM_SERVER_KEY` στη λίστα.

---

### 4️⃣ Deploy της Function

```bash
supabase functions deploy send_fcm_push --project-ref <your-project-ref>
```

**Αντικατέστησε `<your-project-ref>`** με το project ref σου.

**Αν επιτυχεί:**
```
Deployed function 'send_fcm_push' successfully!
```

Θα λάβεις ένα URL όπως:
```
https://ueadvfdlchlitvjeqoj.functions.supabase.co/send_fcm_push
```

---

## 🧪 Testing

Μετά το deploy, μπορείς να testάρεις με SQL στο Supabase:

```sql
select net.http_post(
  url := 'https://<your-project-ref>.functions.supabase.co/send_fcm_push',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := jsonb_build_object(
    'token', '<YOUR_DEVICE_TOKEN>',
    'title', 'XPlayer Test Notification',
    'body', 'This is a test from Supabase 🚀'
  )
);
```

---

## 📝 Quick Commands Reference

```bash
# 1. Login
supabase login

# 2. Link project
supabase link --project-ref <ref>

# 3. Set secret
supabase secrets set FCM_SERVER_KEY="..."

# 4. Verify secret
supabase secrets list

# 5. Deploy function
supabase functions deploy send_fcm_push --project-ref <ref>

# 6. View logs
supabase functions logs send_fcm_push
```

---

## ✅ Checklist

- [x] Supabase CLI εγκατεστημένο ✅
- [x] Function `send_fcm_push` δημιουργήθηκε ✅
- [ ] Login στο Supabase CLI
- [ ] Link με project
- [ ] FCM secret ορισμένο
- [ ] Function deployed
- [ ] Test notification εκτελεσμένο

---

## 🚀 Next Steps

Μετά την ολοκλήρωση των χειροκίνητων βημάτων:

1. Χρησιμοποίησε τη function από triggers
2. Monitor τα logs για errors
3. Test με πραγματικά devices

---

**Σημείωση:** Το Supabase CLI είναι έτοιμο! Απλά ακολούθησε τα 4 βήματα παραπάνω για να ολοκληρώσεις το setup.

