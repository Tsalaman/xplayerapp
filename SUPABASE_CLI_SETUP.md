# 🚀 Supabase CLI Setup - Step by Step

## ✅ Τι Έγινε Ήδη
- [x] Δημιουργήθηκε η function `send_fcm_push` στο `supabase/functions/send_fcm_push/index.ts`
- [x] Ο κώδικας είναι έτοιμος με error handling και validation

---

## 📋 Βήματα που Πρέπει να Ακολουθήσεις

### 1️⃣ Εγκατάσταση Supabase CLI

Αν δεν το έχεις ήδη, άνοιξε Terminal και γράψε:

```bash
npm install -g supabase
```

**Έλεγχος:**
```bash
supabase --version
```

---

### 2️⃣ Login στο Supabase CLI

```bash
supabase login
```

**➡️ Θα σου ζητήσει access token:**

1. Πήγαινε στο: https://supabase.com/account/tokens
2. Πάτα **"Generate new token"**
3. Δώσε όνομα π.χ. `xplayer-cli`
4. Copy τον κωδικό
5. Επικόλλησέ τον στο terminal

---

### 3️⃣ Σύνδεση με το Project σου

Βεβαιώσου ότι είσαι μέσα στο φάκελο του project σου:

```bash
cd /Users/dimitriostsalamanios/Desktop/x1,1
```

Έπειτα γράψε:

```bash
supabase link --project-ref <your-project-ref>
```

**👉 Πώς να βρεις το Project Ref:**

- Πήγαινε στο Supabase Dashboard
- Στο URL θα δεις: `https://ueadvfdlchlitvjeqoj.supabase.co` (ή παρόμοιο)
- Το project ref είναι το μέρος πριν το `.supabase.co`
- **Παράδειγμα:**
  ```bash
  supabase link --project-ref ueadvfdlchlitvjeqoj
  ```

---

### 4️⃣ ✅ Function Δημιουργήθηκε

Η function `send_fcm_push` έχει ήδη δημιουργηθεί στο:
- 📁 `supabase/functions/send_fcm_push/index.ts`

---

### 5️⃣ Ρύθμιση Περιβάλλοντος (Secret Binding)

**Σύνδεσε το FCM key με τη function:**

**Επιλογή 1:** Αν έχεις το key στο Vault:
```bash
supabase secrets set FCM_SERVER_KEY=$(supabase secrets get fcm_server_key)
```

**Επιλογή 2:** Χειροκίνητα (προτείνεται):
```bash
supabase secrets set FCM_SERVER_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"
```

**Verification:**
```bash
supabase secrets list
```

Θα πρέπει να βλέπεις το `FCM_SERVER_KEY` στη λίστα.

---

### 6️⃣ Deploy της Function

Κάνε deploy στο Supabase project σου:

```bash
supabase functions deploy send_fcm_push --project-ref <your-project-ref>
```

**Παράδειγμα:**
```bash
supabase functions deploy send_fcm_push --project-ref ueadvfdlchlitvjeqoj
```

**✅ Αν όλα πάνε καλά → θα δεις:**
```
Deployed function 'send_fcm_push' successfully!
```

Θα λάβεις ένα URL όπως:
```
https://ueadvfdlchlitvjeqoj.functions.supabase.co/send_fcm_push
```

**Σημείωση:** Κράτα αυτό το URL! Θα το χρειαστείς για να καλείς τη function.

---

### 7️⃣ Δοκιμή (Test Notification)

**Μπορείς να τεστάρεις με SQL μέσα στο Supabase:**

1. Πήγαινε στο Supabase Dashboard → **SQL Editor**
2. Εκτέλεσε αυτό το query:

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

**Αντικατέστησε:**
- `<your-project-ref>` με το project ref σου
- `<YOUR_DEVICE_TOKEN>` με ένα πραγματικό FCM token από device

---

## 🔍 Troubleshooting

### "command not found: supabase"
- Βεβαιώσου ότι έτρεξες `npm install -g supabase`
- Έλεγξε το PATH: `echo $PATH`

### "Project not found"
- Ελέγξε ότι το project ref είναι σωστό
- Βεβαιώσου ότι έχεις access στο project

### "Missing FCM key"
- Ελέγξε ότι έτρεξες `supabase secrets set FCM_SERVER_KEY=...`
- Verification: `supabase secrets list`

### "Function deployment failed"
- Ελέγξε ότι είσαι στο root directory του project
- Ελέγξε το internet connection
- Δες τα logs: `supabase functions logs send_fcm_push`

---

## 📝 Quick Commands Reference

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <ref>

# Set secret
supabase secrets set FCM_SERVER_KEY="..."

# List secrets
supabase secrets list

# Deploy function
supabase functions deploy send_fcm_push --project-ref <ref>

# View logs
supabase functions logs send_fcm_push
```

---

## ✅ Checklist

- [ ] Supabase CLI εγκατεστημένο
- [ ] Login στο Supabase CLI
- [ ] Link με project
- [ ] FCM secret ορισμένο
- [ ] Function deployed
- [ ] Test notification εκτελεσμένο

---

## 🎯 Επόμενα Βήματα

Μετά το deploy:

1. **Χρησιμοποίησε τη function από triggers** - Τροποποίησε τα triggers στο `PUSH_NOTIFICATION_TRIGGERS.sql` για να καλούν τη function
2. **Χρησιμοποίησε από την εφαρμογή** - Καλεί τη function μέσω Supabase client
3. **Monitor τα logs** - Ελέγξε τα logs για errors

---

**Σημείωση:** Η function `send_fcm_push` είναι έτοιμη και περιμένει το deploy. Ακολούθησε τα βήματα 1-6 για να την κάνεις live!

