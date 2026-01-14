# Profiles Table Auto-Population Setup

## Problem
Kolom `full_name` dan `role` di tabel `profiles` masih null, meskipun auth metadata sudah tersimpan dengan baik.

## Solution
Gunakan **Supabase Triggers** untuk auto-populate `profiles` table saat user metadata di-update.

## Setup Steps

### 1. Open Supabase SQL Editor
- Buka [Supabase Console](https://app.supabase.com)
- Pilih project Anda
- Pergi ke **SQL Editor**

### 2. Copy & Run SQL Script
- Buka file `SUPABASE_PROFILES_SETUP.sql`
- Copy semua query
- Paste ke Supabase SQL Editor
- Jalankan (run)

### 3. Verify Hasilnya
- Tunggu ~2 detik
- Pergi ke **Table Editor** → `profiles`
- Check kolom `full_name` dan `role`
- Seharusnya sudah ter-isi data

## How It Works

### Trigger Flow:
```
User update auth metadata 
  (via updateUser)
    ↓
Supabase trigger fire
  (on_auth_user_update)
    ↓
Function upsert_profile_from_auth()
  extract username/full_name/role dari metadata
    ↓
Auto-INSERT/UPDATE profiles table
    ↓
profiles.full_name & role ter-isi ✅
```

### Supported Metadata Fields:
Frontend dapat set salah satu dari:
```json
{
  "summary_mode": "patologi" | "dokter_hewan",
  "username": "Full Name",
  "full_name": "Full Name",
  "role": "patologi" | "dokter_hewan"
}
```

Trigger akan prioritas:
- `username` → `full_name` (gunakan sebagai full_name)
- `summary_mode` → `role` (gunakan sebagai role)

## Features

✅ **Automatic sync** - Profiles auto-update saat auth metadata berubah  
✅ **Backward compatible** - Existing users dapat di-backfill  
✅ **Smart merging** - Tidak overwrite data yang sudah ada  
✅ **RLS Policies** - Secure dengan RLS untuk row-level access control  
✅ **Logging** - Debug via Supabase logs

## After Setup

### Frontend Changes (Sudah Done)
- Onboarding page only update auth metadata
- Trigger handles profiles table update
- No more backend API call needed untuk profiles

### Testing
1. Buka `http://localhost:3000/login`
2. Login Google
3. Set role + nama di onboarding
4. Redirect ke dashboard
5. Check Supabase console:
   - Table `profiles` → check `full_name` dan `role`
   - Seharusnya sudah ter-isi! ✅

## Troubleshooting

### Profiles still null?
1. Check Supabase SQL logs:
   - SQL Editor → check query results
   - Run: `SELECT * FROM profiles WHERE id = 'USER_ID';`

2. Check trigger status:
   - Run: `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'on_auth%';`

3. Check function:
   - Run: `SELECT * FROM information_schema.routines WHERE routine_name = 'upsert_profile_from_auth';`

### Rollback if needed:
```sql
DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_insert ON auth.users;
DROP FUNCTION IF EXISTS public.upsert_profile_from_auth();
```

## Files Modified
- `src/app/onboarding/role/page.tsx` - Simplified, only update auth metadata
- `backend/api.py` - Endpoint masih ada, tapi tidak digunakan (backup)

## Next Steps
1. Run SQL script di Supabase
2. Test onboarding flow
3. Check profiles table - should be populated! 🎉
