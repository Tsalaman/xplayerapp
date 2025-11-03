# 🚀 Quick Start - XPlayer App

## ✅ Status: App Running!

Το Metro bundler τρέχει και το app είναι έτοιμο! 🎉

---

## 📱 Πώς να το Ανοίξεις - 3 Τρόποι

### 🌟 Τρόπος 1: Expo Go App (Συνιστάται για Τηλέφωνο)

1. **Κατέβασε Expo Go:**
   - iOS: [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Άνοιξε το Expo Go app**

3. **Σκάνε το QR code:**
   - Στο terminal που τρέχει το `expo start` θα δεις ένα **QR code**
   - Άνοιξε το **Expo Go app** και πάτα **"Scan QR Code"**
   - Σκάνε το QR code από το terminal

4. **Το app θα φορτώσει!** 🎉

---

### 💻 Τρόπος 2: iOS Simulator (Mac Only)

1. **Πάτα `i` στο terminal** που τρέχει το expo start
   
   Ή:

2. **Τρέξε:**
   ```bash
   npx expo start --ios
   ```

Θα ανοίξει το iOS Simulator αυτόματα!

---

### 📱 Τρόπος 3: Android Emulator

1. **Βεβαιώσου ότι έχεις Android Studio εγκατεστημένο**

2. **Ξεκίνα ένα Android Emulator** από Android Studio

3. **Πάτα `a` στο terminal** που τρέχει το expo start

   Ή:

4. **Τρέξε:**
   ```bash
   npx expo start --android
   ```

---

### 🌐 Τρόπος 4: Web Browser

1. **Πάτα `w` στο terminal** που τρέχει το expo start

   Ή:

2. **Τρέξε:**
   ```bash
   npx expo start --web
   ```

Θα ανοίξει το browser!

---

## ⌨️  Keyboard Shortcuts

Ενώ τρέχει το `expo start`, μπορείς να πατήσεις:

- **`i`** → Ανοίγει iOS Simulator
- **`a`** → Ανοίγει Android Emulator  
- **`w`** → Ανοίγει Web Browser
- **`r`** → Reload app
- **`j`** → Open debugger
- **`c`** → Clear cache
- **`m`** → Toggle menu
- **`q`** → Quit

---

## 🎯 Τι Να Περιμένεις

Όταν ανοίξει το app:

1. **Splash Screen** → Αν δεν είσαι logged in
2. **Welcome/Login Screen** → Για login ή signup
3. **Home Screen** → Αν είσαι logged in

---

## ✅ Checklist

- [x] Metro bundler running ✅
- [x] Dependencies installed ✅
- [x] .env file exists ✅
- [ ] Open app στο device/simulator

---

## 🔍 Troubleshooting

### "Cannot connect to Metro"
- Έλεγξε ότι τρέχει `expo start`
- Κάνε reload: πάτα **`r`** στο terminal

### "Network request failed"
- Έλεγξε το `.env` file - έχει σωστά Supabase credentials;
- Ελέγξε το internet connection

### QR Code δεν φορτώνει
- Κάνε reload: πάτα **`r`** στο terminal
- Clear cache: πάτα **`c`** στο terminal
- Ξανά: `npx expo start --clear`

---

## 🎉 Ready!

Το app είναι έτοιμο! Επίλεξε έναν από τους τρόπους παραπάνω και άνοιξε το app! 🚀

