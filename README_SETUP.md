# 🚀 Quick Setup - Μόνο 2 Βήματα!

## ✅ Τι Έγινε Ήδη

- ✅ Supabase CLI εγκαταστάθηκε
- ✅ Function `send_fcm_push` δημιουργήθηκε  
- ✅ Project ref βρέθηκε: `ueadvfdlichltivzjoeq`
- ✅ Scripts έτοιμα

---

## 🎯 Τι Χρειάζεται - Μόνο 2 Βήματα!

### **Βήμα 1: Πάρε Token** (1 λεπτό)

1. Άνοιξε: **https://supabase.com/account/tokens**
2. Κάνε **"Generate new token"**
3. Αντιγράψε τον token

---

### **Βήμα 2: Τρέξε το Script** (30 δευτερόλεπτα)

Άνοιξε Terminal και γράψε:

```bash
cd /Users/dimitriostsalamanios/Desktop/x1,1
./run_setup.sh
```

Θα σου ζητήσει το token - απλά επικόλλησέ το!

---

## ✅ Αποτέλεσμα

Μετά το setup θα έχεις:

- ✅ Function deployed
- ✅ URL: `https://ueadvfdlichltivzjoeq.functions.supabase.co/send_fcm_push`
- ✅ Ready to use!

---

## 📝 Άλλοι Τρόποι

### Εάν προτιμάς να δώσεις token στο command:

```bash
SUPABASE_ACCESS_TOKEN="your_token_here" ./quick_setup.sh your_token_here
```

### Εάν προτιμάς χειροκίνητα:

```bash
supabase login  # Θα ζητήσει token
supabase link --project-ref ueadvfdlichltivzjoeq
supabase secrets set FCM_SERVER_KEY="BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE"
supabase functions deploy send_fcm_push --project-ref ueadvfdlichltivzjoeq
```

---

## 🎉 Γρήγορη Απάντηση

**Τρέξε αυτό:**
```bash
./run_setup.sh
```

Θα σου ζητήσει το token - δώσ' το και θα γίνουν όλα!

