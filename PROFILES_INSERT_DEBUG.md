# Debugging: Profiles Table Insert/Update Issue

## Problem
Data dari onboarding tidak masuk ke tabel `profiles` (masih null untuk `full_name` dan `role`).

## Root Causes

1. **RLS Policy tidak tepat** - User tidak punya permission untuk insert/update row mereka sendiri
2. **Tabel structure salah** - Kolom `role` atau `updated_at` mungkin tidak ada
3. **Foreign key constraint** - User ID tidak exist di table (jika ada FK ke auth.users)

## Solutions

### 1. Check Tabel Structure di Supabase
Buka Supabase Console → SQL Editor, jalankan:

```sql
-- Check struktur profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

### 2. Setup/Fix RLS Policies

Run SQL queries di Supabase Console:

```sql
-- Enable RLS jika belum
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada (opsional)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- CREATE Policies
-- 1. SELECT - User bisa lihat profile mereka sendiri
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 2. INSERT - User bisa insert profile mereka sendiri
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. UPDATE - User bisa update profile mereka sendiri
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 3. Add Missing Columns (if needed)

Jika kolom `role` atau `updated_at` belum ada:

```sql
-- Add role column jika belum ada
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'patologi';

-- Add updated_at column jika belum ada
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create index untuk performance
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC);
```

### 4. Test Manual Insert

```sql
-- Test insert (replace dengan actual user ID)
INSERT INTO profiles (id, full_name, role, updated_at)
VALUES (
  'USER_ID_HERE',
  'Test User',
  'patologi',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Test User',
  role = 'patologi',
  updated_at = now();

-- Check hasil
SELECT * FROM profiles WHERE id = 'USER_ID_HERE';
```

## Debugging Steps

1. **Open Browser Console** (F12)
   - Buka onboarding page
   - Lihat console.log output
   - Check error messages

2. **Check Supabase Logs**
   - Buka Supabase Console
   - Pilih project → Logs
   - Check untuk insert/update errors

3. **Check Profiles Table Directly**
   - Buka Supabase Console
   - Buka table `profiles`
   - Check apakah row ada untuk user yang baru login

## Current Implementation

- `src/app/onboarding/role/page.tsx` - Client-side direct insert ke profiles
- Console logging untuk debugging
- Fallback: continue meski profile insert gagal (auth metadata tetap update)

## Next: If still not working

Jika masih tidak masuk, akan ubah ke:
1. Server-side API route (dengan service role key) - lebih reliable
2. Supabase Edge Function (real-time trigger)
3. Manual backend insert via Python API
