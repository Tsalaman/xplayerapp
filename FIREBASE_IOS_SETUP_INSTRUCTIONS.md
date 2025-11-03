# Firebase iOS Setup Instructions

## 📱 GoogleService-Info.plist Setup

### ✅ Αυτόματα Συμπληρωμένα:

- ✅ `API_KEY`: `AIzaSyAowfCGZGmd16Dj9wKLZseJpbs5WhKA80Q`
- ✅ `GCM_SENDER_ID`: `473699043329`
- ✅ `BUNDLE_ID`: `com.xplayer.app`
- ✅ `PROJECT_ID`: `xplayer-prod`
- ✅ `STORAGE_BUCKET`: `xplayer-prod.firebasestorage.app`

### 🔄 Χρειάζονται (από Firebase Console):

1. **`CLIENT_ID`** - Format: `473699043329-XXXXX.apps.googleusercontent.com`
2. **`REVERSED_CLIENT_ID`** - Format: `com.googleusercontent.apps.473699043329-XXXXX`
3. **`GOOGLE_APP_ID`** - Format: `1:473699043329:ios:XXXXX`

## 📥 Πώς να τα βρεις:

### Επιλογή 1: Κατέβασε το πλήρες αρχείο (Προτείνεται)

1. Πηγαίνετε στο [Firebase Console](https://console.firebase.google.com/)
2. Επιλέξτε το project **xplayer-prod**
3. Πηγαίνετε στο ⚙️ **Project Settings**
4. Κάντε scroll down στο **"Your apps"** section
5. Βρείτε την **iOS app** (ή δημιουργήστε μια αν δεν υπάρχει)
6. Κατεβάστε το **GoogleService-Info.plist**
7. Αντικαταστήστε το `GoogleService-Info.plist` στο root directory

### Επιλογή 2: Συμπλήρωσε τις τιμές

Αν θέλεις να συμπληρώσεις χειροκίνητα:

1. **Firebase Console** → **Project Settings** → **Your apps** → **iOS app**
2. Βρες το **CLIENT_ID** (από το OAuth client)
3. Βρες το **GOOGLE_APP_ID** (από το app info)
4. Αντικατέστησε στο `GoogleService-Info.plist`:
   - `YOUR_CLIENT_ID` με το πραγματικό CLIENT_ID
   - `YOUR_IOS_APP_ID` με το πραγματικό iOS app ID

## 🔍 Πού να βρεις τις τιμές:

### GOOGLE_APP_ID:
- Firebase Console → Project Settings → Your apps → iOS app
- Βρες το **App ID** (format: `1:473699043329:ios:XXXXX`)

### CLIENT_ID:
- Firebase Console → Project Settings → Your apps → iOS app
- Scroll down στο **OAuth 2.0 Client IDs** section
- Βρες το **iOS Client ID** (format: `473699043329-XXXXX.apps.googleusercontent.com`)

### REVERSED_CLIENT_ID:
- Αυτό είναι το αντίστροφο του CLIENT_ID
- Format: `com.googleusercontent.apps.473699043329-XXXXX`

## ✅ Verification

Μετά την ενημέρωση, το αρχείο θα πρέπει να έχει:

- ✅ Όλα τα keys συμπληρωμένα
- ✅ Χωρίς `YOUR_*` placeholders
- ✅ Valid XML format

## 🚀 Next Steps

1. Κατέβασε ή συμπλήρωσε το `GoogleService-Info.plist`
2. Εκτέλεσε: `npx expo prebuild --clean`
3. Build για iOS: `npx expo run:ios` ή `eas build -p ios`
4. Test push notifications σε physical iOS device

## 📝 Note

Αν δημιουργήσεις νέα iOS app στο Firebase:
1. Προσθήκη iOS app στο Firebase project
2. Bundle ID: `com.xplayer.app`
3. Κατέβασε το `GoogleService-Info.plist`
4. Τοποθέτησε το στο root directory

