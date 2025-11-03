# Supabase Setup Guide - Οδηγός Εγκατάστασης

## 🇬🇷 Βήμα-Βήμα Οδηγίες

### Step 1: Δημιούργησε Supabase Account
1. Πήγαινε στο **https://supabase.com**
2. Κάνε **Sign Up** (free)
3. Κάνε **Create New Project**
4. Όνομα Project: `sports-match-app` (ή ό,τι θέλεις)
5. Database Password: Επίλεξε ένα δυνατό password (γράψτο κάπου!)
6. Region: Επίλεξε την πιο κοντινή (π.χ. `West EU` για Ελλάδα)
7. Κάνε **Create new project** (παίρνει ~2 λεπτά)

---

### Step 2: Ρύθμιση Database

1. Στο Supabase Dashboard, πάτα στο **SQL Editor** (αριστερό menu)
2. Πάτα **New Query**
3. Άνοιξε το αρχείο `supabase-schema.sql` από το project
4. Αντιγράψε όλο το περιεχόμενο
5. Επικόλλησε στο SQL Editor
6. Πάτα **Run** (ή F5)

✅ Αν δεις "Success", το database είναι έτοιμο!

---

### Step 3: Πάρε τα API Keys

1. Στο Supabase Dashboard, πάτα στο **Settings** (αριστερό menu)
2. Πάτα **API**
3. Βρες το **Project URL** και **anon public** key

**Παράδειγμα:**
- Project URL: `https://abcdefghijklmnop.supabase.co`
- anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### Step 4: Ρύθμιση Environment Variables

1. Δημιούργησε αρχείο `.env` στο root του project:
```bash
cd "/Users/dimitriostsalamanios/Desktop/x1,1"
touch .env
```

2. Άνοιξε το `.env` και γράψε:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Αντικατέστησε τα `your-project-url` και `your-anon-key-here` με τα πραγματικά από το Supabase

---

### Step 5: Εγκατάσταση Dependencies

```bash
npm install
```

Αυτό θα εγκαταστήσει το `@supabase/supabase-js`

---

### Step 6: Update Supabase Client

Άνοιξε το `services/supabase.ts` και βεβαιώσου ότι τα URLs είναι σωστά (θα τα πάρει από το `.env`)

---

## ✅ Έλεγχος

Μετά το setup, μπορείς να ελέγξεις αν δουλεύει:

1. Κάνε **restart** το app: `npm start`
2. Στο Supabase Dashboard → **Table Editor**, θα πρέπει να βλέπεις:
   - `users` table
   - `posts` table
   - `tournaments` table

---

## 🔐 Security Notes

- ✅ Το **anon key** είναι public, αλλά το Supabase έχει Row Level Security (RLS) για protection
- ✅ Μην μοιράζεσαι το **service_role key** (αυτό είναι secret!)
- ✅ Το `.env` file είναι στο `.gitignore`, οπότε δεν θα ανέβει στο GitHub

---

## 🚀 Next Steps

Μετά το setup, μπορώ να:

1. ✅ Update το `AuthContext` να χρησιμοποιεί Supabase
2. ✅ Update όλα τα screens να χρησιμοποιούν API calls αντί για AsyncStorage
3. ✅ Προσθέσω real-time updates με Supabase subscriptions

**Πες μου αν θέλεις να προχωρήσουμε!** 🎯

---

## ❓ Troubleshooting

**Error: "Invalid API key"**
- Βεβαιώσου ότι το `.env` file έχει τα σωστά credentials
- Κάνε restart το app μετά το .env update

**Error: "relation does not exist"**
- Βεβαιώσου ότι έτρεξες το `supabase-schema.sql` στο SQL Editor

**Error: "Row Level Security policy violation"**
- Οι RLS policies επιτρέπουν μόνο authenticated users να δημιουργούν posts
- Βεβαιώσου ότι έχεις κάνει login πρώτα

