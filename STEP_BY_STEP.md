# Βήμα-Βήμα Οδηγίες - Step by Step Guide

## ✅ Βήμα 1: Έλεγχος Database (Completed!)
Ελπίζω να είδες "Success" στο SQL Editor! 🎉

---

## 📋 Βήμα 2: Πάρε τα API Keys

### 2.1 Πάτα στο Supabase Dashboard:
1. **Settings** (αριστερό menu - το γρανάζι)
2. **API** (στο submenu)

### 2.2 Βρες αυτά τα 2:
- **Project URL** - Κάτι σαν: `https://abcdefghijklmnop.supabase.co`
- **anon public key** - Κάτι που ξεκινάει με: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2.3 Αντιγράψε τα και κράτα τα κάπου (θα τα χρειαστούμε!)

---

## 📝 Βήμα 3: Δημιούργησε .env file

### 3.1 Άνοιξε Terminal:
```bash
cd "/Users/dimitriostsalamanios/Desktop/x1,1"
```

### 3.2 Δημιούργησε .env file:
```bash
touch .env
```

### 3.3 Άνοιξε το .env file στο editor σου

### 3.4 Γράψε μέσα (αντικατέστησε με τα δικά σου):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Παράδειγμα:**
```
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **ΣΗΜΑΝΤΙΚΟ:** Μην κάνεις copy-paste το παράδειγμα! Χρησιμοποίησε τα **ΠΡΑΓΜΑΤΙΚΑ** από το Supabase Dashboard!

---

## 📦 Βήμα 4: Install Dependencies

### 4.1 Στο Terminal (ακόμα στο project folder):
```bash
npm install
```

Αυτό θα εγκαταστήσει το `@supabase/supabase-js` package.

---

## ✅ Βήμα 5: Έλεγχος

### 5.1 Έλεγξε αν το .env file έχει τα σωστά credentials

### 5.2 Έλεγξε στο Supabase Dashboard → **Table Editor**:
- Θα πρέπει να βλέπεις:
  - ✅ `users` table
  - ✅ `posts` table  
  - ✅ `tournaments` table

---

## 🚀 Επόμενο Βήμα:

Μόλις τελειώσεις τα βήματα 2-4, πες μου και θα:
1. ✅ Update το `AuthContext` να χρησιμοποιεί Supabase
2. ✅ Update όλα τα screens να χρησιμοποιούν API calls
3. ✅ Test το app με το backend!

---

## ❓ Αν έχεις πρόβλημα:

**"Cannot find module '@supabase/supabase-js'"**
→ Τρέξε: `npm install`

**"Invalid API key"**
→ Έλεγξε το `.env` file - τα credentials είναι σωστά;

**"Table does not exist"**
→ Έτρεξες το SQL; Πάτα στο Table Editor στο Supabase - βλέπεις τα tables;

---

## 📍 Τρέξε μου:

Πες μου σε ποιο βήμα είσαι τώρα και τι έχεις κάνει! 😊

