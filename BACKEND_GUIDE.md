# Backend Guide - Οδηγός Backend

## 🇬🇷 Τι Backend Χρειάζεται

Το app σου τώρα χρησιμοποιεί **AsyncStorage** (local storage) που σημαίνει ότι:
- ❌ Τα δεδομένα αποθηκεύονται μόνο στο κινητό
- ❌ Δεν μπορείς να μοιραστείς posts/tournaments μεταξύ χρηστών
- ❌ Τα δεδομένα χάνονται αν διαγράψεις το app

Για production χρειάζεσαι **Backend** για:
1. ✅ **Authentication** - Login/Signup με ασφαλή passwords
2. ✅ **Database** - Αποθήκευση users, posts, tournaments
3. ✅ **Real-time sync** - Όλοι βλέπουν τα ίδια posts
4. ✅ **Admin features** - Posting tournaments
5. ✅ **Cloud storage** - Profile pictures

---

## 🎯 Επιλογές Backend

### 1. **Supabase** (Συνιστάται - Πιο Εύκολο) ⭐
**Γιατί:** 
- ✅ Free tier (αρκετό για αρχή)
- ✅ Built-in authentication
- ✅ PostgreSQL database
- ✅ Real-time subscriptions
- ✅ File storage
- ✅ Εύκολη εγκατάσταση

**Κόστος:** Free έως $25/μήνα

---

### 2. **Firebase** (Google)
**Γιατί:**
- ✅ Popular και stable
- ✅ Real-time database
- ✅ Authentication built-in
- ✅ Cloud storage

**Κόστος:** Free tier, pay-as-you-go

---

### 3. **Custom Backend** (Node.js + PostgreSQL/MongoDB)
**Γιατί:**
- ✅ Πλήρης έλεγχος
- ✅ Custom logic

**Από:**
- ❌ Πιο πολύπλοκο setup
- ❌ Πρέπει να γράψεις API
- ❌ Χρειάζεσαι hosting

---

## 📋 Που χρησιμοποιείται Backend στο App

1. **Authentication** (`contexts/AuthContext.tsx`)
   - Login/Signup με hashed passwords
   - Session management
   - Token-based auth

2. **Posts** (`app/post/create.tsx`, `app/(tabs)/posts.tsx`)
   - Create posts
   - Fetch all posts
   - Update/Delete posts

3. **Tournaments** (`app/(tabs)/tournaments.tsx`)
   - Admin creates tournaments
   - Fetch active tournaments
   - Registration

4. **Users** (`app/profile/create.tsx`, `app/(tabs)/profile.tsx`)
   - Create/Update profile
   - Fetch user data
   - Profile pictures

---

## 🚀 Supabase Setup (Step-by-Step)

### Step 1: Δημιούργησε Account
1. Πήγαινε στο https://supabase.com
2. Κάνε Sign Up (free)
3. Δημιούργησε νέο Project

### Step 2: Database Schema
Δημιούργησε αυτά τα tables:

#### **users** table:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  sports TEXT[],
  bio TEXT,
  location TEXT,
  skill_level TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **posts** table:
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_nickname TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('teammate', 'opponent')),
  sport TEXT NOT NULL CHECK (sport IN ('football', 'basketball', 'tennis', 'padel')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  date TEXT,
  time TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **tournaments** table:
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('football', 'basketball', 'tennis', 'padel')),
  location TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  registration_deadline TIMESTAMP NOT NULL,
  max_participants INTEGER,
  entry_fee DECIMAL,
  prize TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 3: Enable Row Level Security (RLS)
- Users μπορούν να διαβάζουν όλα τα posts
- Users μπορούν να δημιουργούν posts μόνο αν είναι logged in
- Admin μπορεί να δημιουργεί tournaments

---

## 📦 Installation

Μετά το setup του Supabase, χρειάζεται να:

1. Εγκαταστήσεις Supabase client:
```bash
npm install @supabase/supabase-js
```

2. Δημιουργήσεις `.env` file με τα credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📝 Next Steps

Αν θέλεις, μπορώ να:
1. ✅ Φτιάξω Supabase integration code
2. ✅ Update το AuthContext για Supabase
3. ✅ Φτιάξω service layer για API calls
4. ✅ Update όλα τα screens για να χρησιμοποιούν API

Πες μου αν θέλεις να προχωρήσουμε με Supabase! 🚀

