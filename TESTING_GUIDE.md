# Testing Guide - Location Features

## ✅ Testing Checklist

### 1. Physical Device Testing
**ΣΗΜΑΝΤΙΚΟ:** Test σε πραγματικό device, όχι simulator!

**iOS:**
- Σύνδεσε iPhone με USB
- `npm run ios` ή select device από Expo
- Test location accuracy

**Android:**
- Enable Developer Mode στο phone
- USB Debugging enabled
- `npm run android` ή select device

---

### 2. Permission Flow Testing

#### Test Case 1: First Time Permission Request
1. Διαγραφή app από device
2. Reinstall app
3. Πάτα "Update Location" στο Profile
4. ✅ Περίμενε permission popup
5. ✅ Πάτα "Allow" / "While Using App"
6. ✅ Location should update

#### Test Case 2: Permission Denied
1. Deny permission στο popup
2. ✅ Πρέπει να δείξει error message
3. ✅ "Location permission denied. Please enable in settings."
4. Go to Settings → Enable permission manually
5. ✅ Retry update location → Should work

#### Test Case 3: Permission Already Granted
1. Grant permission (allow)
2. Close app
3. Reopen app
4. ✅ Location should load automatically
5. ✅ No permission popup (already granted)

---

### 3. Location Update Testing

#### Test Case 1: Manual Update (Profile Screen)
1. Go to Profile screen
2. Πάτα "Update Location"
3. ✅ Loading indicator shows
4. ✅ Success message appears
5. ✅ "Last updated: X min ago" updates
6. ✅ Coordinates display

#### Test Case 2: Auto-Watch (if enabled)
1. Enable auto-watch (`useLocation(true)`)
2. Move device > 50 meters
3. ✅ Location updates automatically
4. ✅ Throttling: max 1 update / 30s

#### Test Case 3: Throttling Check
1. Update location manually
2. Immediately update again
3. ✅ Should throttle (wait 30s or move > 50m)
4. ✅ Database updates max once per 30s

---

### 4. Database Verification

#### Check in Supabase Console:
1. Go to Table Editor → `users`
2. Find your user record
3. ✅ Verify `latitude` field has value
4. ✅ Verify `longitude` field has value
5. ✅ Verify `last_location_ts` updates
6. ✅ Verify `location_privacy` field (exact/coarse/hidden)

#### Test Updates:
1. Update location in app
2. Refresh Supabase Table Editor
3. ✅ `last_location_ts` should update
4. ✅ Coordinates should match device location

---

### 5. Privacy Settings Testing

#### Test Case 1: Privacy Toggle
1. Go to Profile → Location Privacy
2. Select "Exact Location"
3. ✅ Setting saves
4. ✅ Success message
5. ✅ Database `location_privacy` = 'exact'

#### Test Case 2: Change Privacy
1. Change to "Coarse Location"
2. ✅ Setting updates
3. ✅ Database updates correctly
4. Change to "Hidden"
5. ✅ Setting updates

---

### 6. Location Display Testing

#### Profile Screen:
1. ✅ Location status shows
2. ✅ "Last updated: X min ago" displays
3. ✅ Coordinates show (if enabled)
4. ✅ "Update Location" button works
5. ✅ Loading state works
6. ✅ Error messages display

---

## ❌ Common Issues & Solutions

### Issue: "Location permission denied"
**Solution:**
- Go to device Settings → App → Location
- Enable "While Using App"
- Restart app

### Issue: Location not updating
**Solution:**
- Check if device has GPS enabled
- Check if device is outdoors (better GPS signal)
- Check if throttling is active (wait 30s)

### Issue: Coordinates not showing in Supabase
**Solution:**
- Check RLS policies (should allow UPDATE for own row)
- Check if user is authenticated
- Check network connection
- Check error logs in console

### Issue: Throttling too aggressive
**Solution:**
- Adjust `UPDATE_THROTTLE_MS` in `hooks/useLocation.ts`
- Adjust `DISTANCE_THRESHOLD_METERS`

---

## 📱 Testing on Simulator vs Device

### iOS Simulator:
- ❌ **Does NOT provide real GPS location**
- ✅ Good for UI testing
- ✅ Good for permission flow
- ❌ Bad for location accuracy testing

### Android Emulator:
- ❌ **Does NOT provide real GPS location**
- ✅ Good for UI testing
- ✅ Can simulate location manually
- ❌ Bad for real-world testing

### Physical Device:
- ✅ **Real GPS location**
- ✅ Real permission flow
- ✅ Real location accuracy
- ✅ Best for production testing

**Recommendation:** Always test location features on physical device!

---

## 🔍 Debugging Tips

### Check Location State:
```typescript
const { loc } = useLocation(false);
console.log('Location:', loc);
```

### Check Supabase:
- Go to Supabase Dashboard → Table Editor
- Filter by your user ID
- Check `latitude`, `longitude`, `last_location_ts`

### Check Permissions:
- iOS: Settings → Privacy → Location Services
- Android: Settings → Apps → App Name → Permissions → Location

---

## ✅ Success Criteria

- [ ] Permission request works correctly
- [ ] Location updates successfully
- [ ] Database stores coordinates correctly
- [ ] Throttling works (max 1 update / 30s)
- [ ] Privacy settings save correctly
- [ ] UI displays location status
- [ ] Error handling works
- [ ] Works on both iOS and Android

---

**Happy Testing! 🚀**

