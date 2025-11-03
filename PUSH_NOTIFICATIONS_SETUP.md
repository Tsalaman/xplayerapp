# Push Notifications Setup - XPlayer

## ✅ Εγκατάσταση

Οι βιβλιοθήκες `expo-notifications` και `expo-device` έχουν εγκατασταθεί και ενσωματωθεί στην εφαρμογή.

## 📁 Αρχεία

### 1. Service: `services/pushNotifications.ts`
- `registerForPushNotificationsAsync(userId)`: Εγγραφή συσκευής για push notifications
- `removePushToken(userId, token)`: Αφαίρεση token κατά logout
- `scheduleLocalNotification(title, body, data, trigger)`: Προγραμματισμός local notification
- `savePushToken(userId, token)`: Αποθήκευση token στο Supabase

### 2. Context: `contexts/AuthContext.tsx`
- Εγγραφή για push notifications αυτόματα μετά το login
- Αφαίρεση token κατά logout

### 3. Context: `contexts/NotificationsContext.tsx`
- Listeners για incoming push notifications
- Προβολή local notifications όταν έρχεται νέα ειδοποίηση
- Navigation handling όταν ο χρήστης πατήσει σε notification

### 4. Root Layout: `app/_layout.tsx`
- Global notification handler configuration
- Root-level notification listeners

### 5. Database Schema: `PUSH_NOTIFICATIONS_SCHEMA.sql`
- Table `user_push_tokens` για αποθήκευση των tokens
- RLS policies για ασφάλεια
- Indexes για γρήγορη αναζήτηση

## 🚀 Configuration

### 1. Ενημέρωση `app.json`
- ✅ iOS: `useFrameworks: "static"` για notifications support
- ✅ Android: Permissions και notification configuration
- ✅ Plugin: `expo-notifications` με mint color (#5CE1E6)

### 2. Environment Variables
Πρέπει να προσθέσετε στο `.env`:
```env
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

**Σημείωση**: Αν χρησιμοποιείτε EAS Build, το `projectId` είναι optional.

### 3. Database Setup
Εκτελέστε το `PUSH_NOTIFICATIONS_SCHEMA.sql` στο Supabase SQL Editor για να δημιουργήσετε τον πίνακα `user_push_tokens`.

## 🔄 Flow

### Login Flow
1. User κάνει login
2. `AuthContext` καλεί `loadUserProfile`
3. `loadUserProfile` καλεί `registerForPushNotificationsAsync`
4. Ζητάει permissions από το device
5. Παίρνει Expo push token
6. Αποθηκεύει token στο Supabase (`user_push_tokens`)

### New Notification Flow
1. Supabase δημιουργεί notification στο `notifications` table
2. Real-time subscription στο `NotificationsContext` εντοπίζει νέα notification
3. Καλεί `scheduleLocalNotification` για να δείξει local notification
4. Update το unread count badge

### Logout Flow
1. User κάνει logout
2. `AuthContext` καλεί `removePushToken`
3. Διαγράφει token από το Supabase
4. Cleanup listeners

## 📱 Testing

### Physical Device Only
Push notifications **δεν** λειτουργούν σε simulator/emulator. Χρειάζεται πραγματική συσκευή.

### Permissions
Το app θα ζητήσει αυτόματα permissions την πρώτη φορά που κάνει register.

### Android Channel
Το Android channel είναι configured με:
- Name: "Default"
- Importance: MAX
- Vibration Pattern: [0, 250, 250, 250]
- Light Color: #5CE1E6 (mint)

## 🔔 Sending Push Notifications

Για να στείλετε push notification από τον server, χρησιμοποιήστε το Expo Push Notification API:

```typescript
// Example: Send notification to user
const tokens = await getPushTokensForUser(userId);
const messages = tokens.map(token => ({
  to: token,
  sound: 'default',
  title: 'XPlayer',
  body: 'You have a new notification!',
  data: { link: '/notifications' },
}));

await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(messages),
});
```

## 📝 Notes

- Το notification handler είναι configured να δείχνει alerts, sound και badge
- Local notifications είναι προγραμματισμένες όταν έρχεται νέα notification από Supabase
- Το token αποθηκεύεται με `UNIQUE(user_id, token)` για να μην υπάρχουν duplicates
- Το token ενημερώνεται (updated_at) αν υπάρχει ήδη για τον ίδιο user

## ⚠️ Important

1. **Project ID**: Πρέπει να ορίσετε `EXPO_PUBLIC_PROJECT_ID` στο `.env` ή να χρησιμοποιήσετε EAS
2. **Database**: Εκτελέστε το `PUSH_NOTIFICATIONS_SCHEMA.sql` στο Supabase
3. **Assets**: Μπορείτε να προσθέσετε notification icon και sound στα `assets/` αν θέλετε
4. **Testing**: Test μόνο σε physical device, όχι simulator

