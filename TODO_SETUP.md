# 📋 TODO List - Setup & Configuration

## 🎯 Προτεραιότητα 1: Supabase Edge Function (Push Notifications)

### ✅ Ήδη Ολοκληρωμένα
- [x] Δημιουργήθηκε η Edge Function: `supabase/functions/sendPushNotification/index.ts`
- [x] Το αρχείο είναι έτοιμο για deploy

### ⏳ Πρέπει να Κάνεις:

- [ ] **Εγκατάσταση Supabase CLI**
  ```bash
  npm install -g supabase
  ```
  Έλεγχος: `supabase --version`

- [ ] **Login στο Supabase CLI**
  ```bash
  supabase login
  ```
  Θα ανοίξει browser για login

- [ ] **Σύνδεση με το Project**
  ```bash
  supabase link --project-ref YOUR_PROJECT_REF
  ```
  Πού να βρεις το Project Ref:
  - Supabase Dashboard → Στο URL θα δεις: `https://app.supabase.com/project/YOUR_PROJECT_REF`
  - Αντιγράψε το `YOUR_PROJECT_REF`

- [ ] **Ορισμός FCM Secret**
  ```bash
  supabase secrets set FCM_SERVER_KEY=BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE
  ```
  Verification: `supabase secrets list`

- [ ] **Deploy της Function**
  ```bash
  supabase functions deploy sendPushNotification
  ```
  Κράτα το URL που θα σου δώσει (π.χ. `https://xxxxx.functions.supabase.co/sendPushNotification`)

---

## 🎯 Προτεραιότητα 2: Google Sign-In Setup

### ✅ Ήδη Ολοκληρωμένα
- [x] Προστέθηκε Google Sign-In button στο `app/(auth)/login.tsx`
- [x] Δημιουργήθηκε `app/auth-callback.tsx`
- [x] Το `app.json` έχει ήδη `"scheme": "xplayer"`

### ⏳ Πρέπει να Κάνεις:

- [ ] **Ρύθμιση Google OAuth στο Supabase**
  1. Πήγαινε στο [Supabase Dashboard](https://app.supabase.com)
  2. Authentication → **Providers** → **Google**
  3. Κάνε **Enable**
  4. Συμπλήρωσε:
     - **Client ID**: `473699043329-ad5gt2vi24m384jpelij44sg7q3fns9a.apps.googleusercontent.com`
     - **Client Secret**: (βρες το από Google Cloud Console - βλέπε παρακάτω)

- [ ] **Πάρε το Client Secret από Google Cloud Console**
  1. Πήγαινε στο [Google Cloud Console](https://console.cloud.google.com/)
  2. Επίλεξε project: **xplayer-prod**
  3. **APIs & Services** → **Credentials**
  4. Βρες το **OAuth 2.0 Client ID** (με το Client ID που έχεις)
  5. Κάνε κλικ για να δεις τα details
  6. Αντιγράψε το **Client Secret**
  7. Πρόσθεσέ το στο Supabase

- [ ] **Πρόσθεσε Redirect URL στο Google Cloud Console**
  1. Στο ίδιο OAuth 2.0 Client ID (Google Cloud Console)
  2. **Authorized redirect URIs** → **Add URI**
  3. Πρόσθεσε: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
  
  **Πώς να βρεις το Project Ref:**
  - Supabase Dashboard → **Settings** → **API**
  - Βρες το **Project URL**: `https://xxxxx.supabase.co`
  - Το redirect URL είναι: `https://xxxxx.supabase.co/auth/v1/callback`

- [ ] **Test Google Sign-In**
  ```bash
  npx expo start
  ```
  1. Άνοιξε την εφαρμογή
  2. Πήγαινε στη σελίδα Login
  3. Πάτα "Sign in with Google"
  4. Δοκίμασε login

---

## 🎯 Προτεραιότητα 3: GoogleService-Info.plist (iOS)

### ✅ Ήδη Ολοκληρωμένα
- [x] Το `GoogleService-Info.plist` βρίσκεται στο root directory
- [x] Το `app.json` έχει `"googleServicesFile": "./GoogleService-Info.plist"`
- [x] Τα βασικά keys είναι συμπληρωμένα

### ⏳ Πρέπει να Κάνεις:

- [ ] **Συμπλήρωση CLIENT_ID και REVERSED_CLIENT_ID**
  
  **Επιλογή 1: Κατέβασε το πλήρες αρχείο (Προτείνεται)**
  1. Πήγαινε στο [Firebase Console](https://console.firebase.google.com/)
  2. Επίλεξε project: **xplayer-prod**
  3. Project Settings (⚙️) → **Your apps** → **iOS app**
  4. Κάνε **Download GoogleService-Info.plist**
  5. Αντικατέστησε το `GoogleService-Info.plist` στο root directory

  **Επιλογή 2: Συμπλήρωσε χειροκίνητα**
  1. Firebase Console → **xplayer-prod** → Project Settings
  2. Your apps → **iOS app**
  3. Κάνε scroll down στο **OAuth 2.0 Client IDs**
  4. Βρες το **iOS Client ID**
  5. Αντικατέστησε στο `GoogleService-Info.plist`:
     - `473699043329-XXXXX` → πραγματικό CLIENT_ID
     - `com.googleusercontent.apps.473699043329-XXXXX` → πραγματικό REVERSED_CLIENT_ID

- [ ] **Εκτέλεσε Expo Prebuild** (όταν είσαι έτοιμος για iOS build)
  ```bash
  npx expo prebuild --clean
  ```
  Αυτό θα δημιουργήσει τον `ios/` φάκελο και θα μεταφέρει το plist

---

## 🎯 Προτεραιότητα 4: Testing & Verification

### ⏳ Πρέπει να Κάνεις:

- [ ] **Test Google Sign-In**
  - Δοκίμασε login με Google account
  - Ελέγξε ότι το session δημιουργείται
  - Ελέγξε ότι ο χρήστης μεταφέρεται στο home

- [ ] **Test Push Notifications** (μετά το deploy της Edge Function)
  - Δοκίμασε να στείλεις push notification
  - Ελέγξε ότι φτάνει στο device

- [ ] **Test iOS Build** (optional, αν έχεις iOS device)
  ```bash
  npx expo run:ios
  ```
  Ελέγξε ότι το `GoogleService-Info.plist` φορτώνεται σωστά

---

## 📝 Σημειώσεις

### Σχετικά με τις Προτεραιότητες:

1. **Supabase Edge Function** - Χρειάζεται για push notifications
2. **Google Sign-In** - Επιτρέπει στους χρήστες να συνδέονται με Google
3. **GoogleService-Info.plist** - Χρειάζεται μόνο αν κάνεις iOS build
4. **Testing** - Βεβαιώσου ότι όλα λειτουργούν

### Quick Reference:

- **Supabase Dashboard**: https://app.supabase.com
- **Firebase Console**: https://console.firebase.google.com/
- **Google Cloud Console**: https://console.cloud.google.com/

---

## ✅ Checklist Summary

### Supabase Edge Function
- [ ] Supabase CLI εγκατεστημένο
- [ ] Login στο Supabase CLI
- [ ] Link με project
- [ ] FCM secret ορισμένο
- [ ] Function deployed

### Google Sign-In
- [ ] Google provider enabled στο Supabase
- [ ] Client ID & Secret συμπληρωμένα
- [ ] Redirect URL στο Google Cloud Console
- [ ] Test Google Sign-In

### iOS Setup
- [ ] CLIENT_ID συμπληρωμένο
- [ ] REVERSED_CLIENT_ID συμπληρωμένο
- [ ] Prebuild εκτελεσμένο (αν χρειάζεται iOS build)

### Testing
- [ ] Google Sign-In test
- [ ] Push notifications test
- [ ] iOS build test (optional)

---

## 🚀 Next Steps After Setup

Μετά την ολοκλήρωση όλων των TODOs:

1. **Test όλες τις λειτουργίες**
2. **Build για production** (αν είσαι έτοιμος)
3. **Deploy στην App Store / Play Store**

---

**Σημείωση:** Οι οδηγίες είναι αναλυτικές. Ακολούθησε τα βήματα ένα-ένα και ελέγξε ότι κάθε βήμα ολοκληρώθηκε πριν προχωρήσεις στο επόμενο.

