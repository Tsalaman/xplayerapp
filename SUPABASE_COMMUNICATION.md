# 🔗 Supabase - Επικοινωνία με την Εφαρμογή

## ✅ Κατάσταση Σύνδεσης

**Το Supabase επικοινωνεί επιτυχώς με την εφαρμογή!**

Το `.env` file έχει τα σωστά credentials:
- ✅ `EXPO_PUBLIC_SUPABASE_URL` - Ρυθμισμένο
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Ρυθμισμένο

---

## 🏗️ Αρχιτεκτονική Σύνδεσης

### 1. **Supabase Client Configuration**
Το Supabase client δημιουργείται στο `services/supabase.ts`:

```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Αυτό το client χρησιμοποιείται σε **όλη** την εφαρμογή!

---

## 📡 Πόντους Επικοινωνίας

### 1. **Authentication (AuthContext)**
**Αρχείο:** `contexts/AuthContext.tsx`

- ✅ **Sign Up / Login** - Authentication μέσω Supabase
- ✅ **Auth State Changes** - Real-time ακρόαση για αλλαγές session
- ✅ **Password Reset** - Reset password μέσω Supabase
- ✅ **User Session** - Διαχείριση session state

**Πώς λειτουργεί:**
```typescript
// Ακρόαση για auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    loadUserProfile(session.user.id);
  }
});
```

---

### 2. **API Services**
**Αρχείο:** `services/api.ts`

#### **Users Service**
- ✅ `getUser(userId)` - Ανάκτηση user profile
- ✅ `updateUser(userId, data)` - Ενημέρωση profile

#### **Posts Service**
- ✅ `getPosts()` - Λήψη posts
- ✅ `getPostsPaginated()` - Pagination για posts
- ✅ `createPost()` - Δημιουργία post
- ✅ `updatePost()` - Ενημέρωση post
- ✅ `deletePost()` - Διαγραφή post

#### **Tournaments Service**
- ✅ `getTournaments()` - Λήψη tournaments
- ✅ `getTournamentsPaginated()` - Pagination για tournaments
- ✅ `createTournament()` - Δημιουργία tournament
- ✅ `getTournament()` - Ανάκτηση tournament

---

### 3. **Chat Service**
**Αρχείο:** `services/chat.ts`

- ✅ `getOrCreateChat(userId1, userId2)` - Δημιουργία/λήψη chat
- ✅ `getMessages(chatId, limit, cursor)` - Pagination για μηνύματα
- ✅ `sendMessage()` - Αποστολή μηνύματος
- ✅ `getUserChats(userId)` - Λήψη όλων των chats

**Real-time:**
- ✅ Real-time subscriptions για νέα μηνύματα στο `app/chat/[chatId].tsx`

---

### 4. **Notifications Service**
**Αρχείο:** `services/notifications.ts`

- ✅ `getNotificationsPaginated()` - Pagination για notifications
- ✅ `markAsRead()` - Σήμανση ως διαβασμένο
- ✅ `createNotification()` - Δημιουργία notification
- ✅ `subscribeToNotifications()` - Real-time subscriptions

**Real-time:**
- ✅ Real-time subscriptions στο `contexts/NotificationsContext.tsx`

---

### 5. **Matches Service**
**Αρχείο:** `services/matches.ts`

- ✅ `getMatches()` - Λήψη matches
- ✅ `createMatch()` - Δημιουργία match
- ✅ `updateMatch()` - Ενημέρωση match

**Real-time:**
- ✅ Real-time subscriptions για live match updates στο `app/matches/[matchId]/live.tsx`

---

### 6. **Teams Service**
**Αρχείο:** `services/teams.ts`

- ✅ `getTeams()` - Λήψη teams
- ✅ `createTeam()` - Δημιουργία team
- ✅ `joinTeam()` - Προσθήκη στο team
- ✅ `leaveTeam()` - Αποχώρηση από team
- ✅ RPC functions για team management

---

### 7. **Venues Service**
**Αρχείο:** `services/venues.ts`

- ✅ `getNearbyVenues()` - Αναζήτηση venues κοντά
- ✅ Geo-spatial queries με PostGIS

---

### 8. **Follows Service**
**Αρχείο:** `services/follows.ts`

- ✅ `followUser()` - Follow user
- ✅ `unfollowUser()` - Unfollow user
- ✅ `getFollowers()` - Λήψη followers
- ✅ `getFollowing()` - Λήψη following

---

### 9. **Tournament Participation**
**Αρχείο:** `services/tournamentParticipation.ts`

- ✅ `joinTournament()` - Σύμμετοχή σε tournament
- ✅ `leaveTournament()` - Αποχώρηση από tournament
- ✅ `getParticipants()` - Λήψη συμμετεχόντων

---

## 🔄 Real-time Subscriptions

Το Supabase υποστηρίζει **real-time updates** μέσω subscriptions:

### 1. **Chat Messages**
```typescript
// app/chat/[chatId].tsx
supabase
  .channel(`chat:${chatId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `chat_id=eq.${chatId}`,
  }, (payload) => {
    // Νέα μηνύματα εμφανίζονται αυτόματα!
  })
  .subscribe();
```

### 2. **Notifications**
```typescript
// contexts/NotificationsContext.tsx
notificationsService.subscribeToNotifications(
  userId,
  (notification) => {
    // Νέα notifications εμφανίζονται real-time!
  }
);
```

### 3. **Live Matches**
```typescript
// app/matches/[matchId]/live.tsx
supabase
  .channel(`match:${matchId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'matches',
    filter: `id=eq.${matchId}`,
  }, (payload) => {
    // Match updates εμφανίζονται real-time!
  })
  .subscribe();
```

---

## 🔐 Security & Authentication

### Row Level Security (RLS)
Όλες οι ερωτήσεις προστατεύονται από RLS policies:
- ✅ Μόνο authenticated users μπορούν να δημιουργήσουν posts
- ✅ Users μπορούν να βλέπουν μόνο τα δικά τους data
- ✅ Public data (posts, tournaments) είναι προσβάσιμα σε όλους

### Authentication Flow
1. **Sign Up** → Supabase Auth → User Profile Creation
2. **Login** → Supabase Auth → Session Management
3. **API Calls** → Χρησιμοποιούν το session token αυτόματα
4. **Logout** → Καθαρισμός session

---

## 📊 Database Schema

Το Supabase database έχει τα παρακάτω tables:
- ✅ `users` - User profiles
- ✅ `posts` - Posts για teammates/opponents
- ✅ `tournaments` - Tournaments
- ✅ `matches` - Matches
- ✅ `teams` - Teams
- ✅ `team_members` - Team memberships
- ✅ `chat_messages` - Chat messages
- ✅ `chats` - Chat rooms
- ✅ `notifications` - Notifications
- ✅ `follows` - Follow relationships
- ✅ `venues` - Sports venues
- ✅ `tournament_participants` - Tournament participation

---

## ✅ Έλεγχος Σύνδεσης

### Πώς να ελέγξεις αν δουλεύει:

1. **Ελέγξε το `.env` file:**
   ```bash
   cat .env
   ```
   Θα πρέπει να βλέπεις:
   - `EXPO_PUBLIC_SUPABASE_URL=...`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=...`

2. **Test Authentication:**
   - Κάνε Sign Up
   - Κάνε Login
   - Αν δουλεύει, το Supabase είναι συνδεδεμένο! ✅

3. **Test Database:**
   - Δημιούργησε Post
   - Στο Supabase Dashboard → Table Editor → `posts`
   - Θα πρέπει να βλέπεις το post! ✅

4. **Test Real-time:**
   - Άνοιξε Chat
   - Στείλε μήνυμα
   - Το μήνυμα θα εμφανιστεί real-time! ✅

---

## 🚀 Summary

**Το Supabase επικοινωνεί με την εφαρμογή μέσω:**

1. ✅ **Supabase Client** (`services/supabase.ts`)
2. ✅ **Environment Variables** (`.env` file)
3. ✅ **Authentication** (AuthContext)
4. ✅ **Database Queries** (API Services)
5. ✅ **Real-time Subscriptions** (Chat, Notifications, Matches)

**Όλες οι λειτουργίες της εφαρμογής χρησιμοποιούν το Supabase:**
- ✅ User Authentication & Profiles
- ✅ Posts & Feed
- ✅ Tournaments
- ✅ Matches
- ✅ Teams
- ✅ Chat & Messaging
- ✅ Notifications
- ✅ Follows
- ✅ Venues Search

**Το Supabase είναι πλήρως ενεργοποιημένο και λειτουργικό!** 🎉

