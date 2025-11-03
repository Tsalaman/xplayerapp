# Οδηγίες Εγκατάστασης - Setup Instructions

## 🇬🇷 Ελληνικά / 🇬🇧 English

---

## 🇬🇷 Τι χρειάζεται να κάνεις:

### 1. Εγκατάσταση Node.js
- Πήγαινε στο https://nodejs.org/
- Κάνε download και εγκατάστησε τη LTS έκδοση
- Άνοιξε Terminal και γράψε: `node --version` για να επιβεβαιώσεις

### 2. Εγκατάσταση Expo CLI
Άνοιξε Terminal και τρέξε:
```bash
npm install -g expo-cli
```

### 3. Εγκατάσταση Dependencies
Πήγαινε στο folder του project (στο Terminal):
```bash
cd "/Users/dimitriostsalamanios/Desktop/x1,1"
npm install
```

### 4. Εκκίνηση του App
```bash
npm start
```

Θα ανοίξει το Expo Developer Tools. Μπορείς:
- **Για iOS**: Πάτησε `i` ή σκανάρε QR code με Expo Go app (iOS)
- **Για Android**: Πάτησε `a` ή σκανάρε QR code με Expo Go app (Android)
- **Για Web**: Πάτησε `w` (για testing)

### 5. Testing στο Simulator/Emulator
**iOS (μόνο Mac):**
```bash
npm run ios
```

**Android:**
- Πρέπει πρώτα να εγκαταστήσεις Android Studio
- Άνοιξε Android Studio → Tools → Device Manager
- Δημιούργησε ένα emulator
- Μετά: `npm run android`

---

## 🇬🇧 What you need to do:

### 1. Install Node.js
- Go to https://nodejs.org/
- Download and install the LTS version
- Open Terminal and type: `node --version` to verify

### 2. Install Expo CLI
Open Terminal and run:
```bash
npm install -g expo-cli
```

### 3. Install Dependencies
Navigate to the project folder in Terminal:
```bash
cd "/Users/dimitriostsalamanios/Desktop/x1,1"
npm install
```

### 4. Start the App
```bash
npm start
```

This will open Expo Developer Tools. You can:
- **For iOS**: Press `i` or scan QR code with Expo Go app (iOS)
- **For Android**: Press `a` or scan QR code with Expo Go app (Android)
- **For Web**: Press `w` (for testing)

### 5. Testing on Simulator/Emulator
**iOS (Mac only):**
```bash
npm run ios
```

**Android:**
- First install Android Studio
- Open Android Studio → Tools → Device Manager
- Create an emulator
- Then run: `npm run android`

---

## 📱 Για να βάλεις το App στο App Store / Play Store:

### iOS App Store:
1. Κάνε build: `expo build:ios`
2. Χρειάζεσαι Apple Developer Account ($99/έτος)
3. Ακολούθησε τις οδηγίες του Expo

### Android Play Store:
1. Κάνε build: `expo build:android`
2. Χρειάζεσαι Google Play Developer Account ($25 μια φορά)
3. Ακολούθησε τις οδηγίες του Expo

---

## ⚠️ Σημαντικά:
- Πρέπει να δημιουργήσεις assets (εικόνες) για το icon και splash screen
- Το app χρησιμοποιεί AsyncStorage (local storage). Για production χρειάζεσαι backend API
- Για admin functionality (posting tournaments) θα χρειαστεί να προσθέσεις authentication

---

## 📝 Assets που χρειάζονται:
Δημιούργησε αυτές τις εικόνες στο folder `assets/`:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1284x2778) - Splash screen  
- `adaptive-icon.png` (1024x1024) - Android icon
- `favicon.png` (48x48) - Web favicon

