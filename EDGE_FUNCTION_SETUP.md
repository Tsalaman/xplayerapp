# 🚀 Οδηγός Ρύθμισης Supabase Edge Function για Push Notifications

## ✅ Τι Έγινε Ήδη
- ✅ Δημιουργήθηκε η Edge Function: `supabase/functions/sendPushNotification/index.ts`
- ✅ Η function είναι έτοιμη για deploy

---

## 📋 Βήματα που Πρέπει να Ακολουθήσεις

### 1️⃣ Εγκατάσταση Supabase CLI

**Έλεγχος αν είναι εγκατεστημένο:**
```bash
supabase --version
```

**Αν δεν υπάρχει, εγκατάσταση:**
```bash
npm install -g supabase
```

---

### 2️⃣ Σύνδεση με το Supabase Project

**Βήμα 2.1: Login στο Supabase CLI**
```bash
supabase login
```
Θα ανοίξει browser για login.

**Βήμα 2.2: Link με το project σου**
```bash
cd /Users/dimitriostsalamanios/Desktop/x1,1
supabase link --project-ref YOUR_PROJECT_REF
```

**Πώς να βρεις το Project Ref:**
- Πήγαινε στο Supabase Dashboard
- Στο URL θα δεις: `https://app.supabase.com/project/YOUR_PROJECT_REF`
- Αντιγράψε το `YOUR_PROJECT_REF` (π.χ. `abcdefghijklmnop`)

---

### 3️⃣ Ορισμός FCM Server Key ως Secret

```bash
supabase secrets set FCM_SERVER_KEY=BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE
```

**Verification:**
```bash
supabase secrets list
```
Θα πρέπει να βλέπεις το `FCM_SERVER_KEY` στη λίστα.

---

### 4️⃣ Deploy της Edge Function

```bash
supabase functions deploy sendPushNotification
```

**Αν έχεις πρόβλημα, δοκίμασε:**
```bash
supabase functions deploy sendPushNotification --project-ref YOUR_PROJECT_REF
```

**Μετά το deploy, θα λάβεις ένα URL όπως:**
```
https://YOUR_PROJECT_REF.functions.supabase.co/sendPushNotification
```

**Σημείωση:** Κράτα αυτό το URL! Θα το χρειαστείς για να καλείς τη function.

---

### 5️⃣ (Optional) Συμπλήρωση GoogleService-Info.plist

Το `GoogleService-Info.plist` έχει κάποιες τιμές που λείπουν:
- `CLIENT_ID`: `473699043329-XXXXX.apps.googleusercontent.com`
- `REVERSED_CLIENT_ID`: `com.googleusercontent.apps.473699043329-XXXXX`

**Πώς να τις βρεις:**
1. Πήγαινε στο [Firebase Console](https://console.firebase.google.com/)
2. Επίλεξε project: **xplayer-prod**
3. Project Settings → Your apps → iOS app
4. Κάνε scroll down στο **OAuth 2.0 Client IDs**
5. Αντιγράψε το **iOS Client ID**
6. Αντικατέστησε τα `XXXXX` στο `GoogleService-Info.plist`

**Σημείωση:** Αυτό δεν είναι υποχρεωτικό για την Edge Function, αλλά χρειάζεται για το iOS app να λειτουργεί σωστά με FCM.

---

## ✅ Έλεγχος ότι Όλα Λειτουργούν

### Test της Edge Function

Μπορείς να δοκιμάσεις τη function με curl:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.functions.supabase.co/sendPushNotification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "token": "USER_FCM_TOKEN",
    "title": "Test Notification",
    "body": "This is a test"
  }'
```

---

## 🔗 Επόμενα Βήματα

Μετά το deploy, μπορείς να χρησιμοποιήσεις τη function:

1. **Από triggers στο Supabase** - Τροποποίηση των triggers στο `PUSH_NOTIFICATION_TRIGGERS.sql` για να καλούν τη function αντί για το `http_post`

2. **Από την εφαρμογή** - Κάλεσε τη function μέσω Supabase client:
   ```typescript
   const { data, error } = await supabase.functions.invoke('sendPushNotification', {
     body: { token, title, body }
   });
   ```

---

## ⚠️ Troubleshooting

### "command not found: supabase"
- Εγκατέστησε το CLI: `npm install -g supabase`

### "Project not found"
- Βεβαιώσου ότι έχεις κάνει `supabase link` με το σωστό project-ref

### "Secret not found"
- Ελέγξε ότι έχεις ορίσει το secret: `supabase secrets list`

### "Function deployment failed"
- Ελέγξε ότι είσαι στο root directory του project
- Ελέγξε ότι έχεις internet connection
- Δες τα logs: `supabase functions logs sendPushNotification`

---

## 📝 Σημειώσεις

- Το FCM Server Key είναι sensitive - μην το μοιράζεσαι
- Η Edge Function τρέχει σε Deno runtime
- Τα secrets αποθηκεύονται με ασφαλή τρόπο στο Supabase

