# 🚀 Πώς να Τρέξεις το App

## ✅ Τρέχει Τώρα!

Το app έχει ξεκινήσει! Θα δεις:

- 📱 QR code για Expo Go app
- 🌐 Metro bundler running
- ⌨️  Keyboard shortcuts (i για iOS, a για Android, w για web)

---

## 📱 Πώς να το Ανοίξεις

### Επιλογή 1: Expo Go App (Γρήγορη)

1. Κατέβασε **Expo Go** από App Store (iOS) ή Play Store (Android)
2. Σκάνε το **QR code** που εμφανίζεται στο terminal
3. Το app θα ανοίξει στο Expo Go

### Επιλογή 2: iOS Simulator

Στο terminal πάτα **`i`** (iOS) ή:
```bash
npx expo start --ios
```

### Επιλογή 3: Android Emulator

Στο terminal πάτα **`a`** (Android) ή:
```bash
npx expo start --android
```

### Επιλογή 4: Web Browser

Στο terminal πάτα **`w`** (Web) ή:
```bash
npx expo start --web
```

---

## ⌨️  Keyboard Shortcuts

Ενώ τρέχει το expo start:

- **`i`** - Open iOS simulator
- **`a`** - Open Android emulator
- **`w`** - Open in web browser
- **`r`** - Reload app
- **`m`** - Toggle menu
- **`j`** - Open debugger
- **`c`** - Clear cache
- **`q`** - Quit

---

## 🔍 Troubleshooting

### "Cannot connect to Metro bundler"
- Έλεγξε ότι τρέχει το `expo start`
- Κλείσε και άνοιξε το Expo Go app

### "Module not found"
- Κλείσε το Metro bundler (Ctrl+C)
- Τρέξε: `npm install`
- Ξανά: `npx expo start`

### "Invalid credentials"
- Έλεγξε το `.env` file
- Βεβαιώσου ότι έχει τα σωστά Supabase credentials

### App δεν φορτώνει
- Κάνε **`r`** για reload
- Κάνε **`c`** για clear cache
- Κάνε restart το Expo Go app

---

## 📝 Quick Commands

```bash
# Start app (σημερινή εντολή)
npx expo start

# Start με iOS simulator
npx expo start --ios

# Start με Android emulator
npx expo start --android

# Start στο web
npx expo start --web

# Clear cache και start
npx expo start --clear

# Start με tunnel (για testing σε device)
npx expo start --tunnel
```

---

## ✅ Checklist

- [x] Dependencies installed ✅
- [x] .env file exists ✅
- [x] App running ✅
- [ ] Open στο device/simulator

---

## 🎉 Ready!

Το app τρέχει! Άνοιξε το Expo Go app και σκάναρε το QR code, ή πάτα `i`/`a`/`w` για simulator/emulator/web!

