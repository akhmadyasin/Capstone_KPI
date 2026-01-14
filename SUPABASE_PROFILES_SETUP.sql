-- ====================================
-- Supabase SQL Setup untuk Profiles
-- ====================================
-- Run semua query ini di Supabase SQL Editor

-- 1. Enable RLS pada tabel profiles (jika belum)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Add kolom yang mungkin belum ada
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 3. Create or replace function untuk extract metadata dari auth.users
CREATE OR REPLACE FUNCTION public.upsert_profile_from_auth()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_role text;
BEGIN
  -- Extract data dari user_metadata
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', '');
  v_role := COALESCE(NEW.raw_user_meta_data->>'summary_mode', NEW.raw_user_meta_data->>'role', 'patologi');

  -- Debug log
  RAISE LOG '[TRIGGER] Upserting profile for user % with full_name=% role=%', NEW.id, v_full_name, v_role;

  -- UPSERT ke profiles table
  INSERT INTO profiles (id, full_name, role, updated_at)
  VALUES (NEW.id, v_full_name, v_role, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(v_full_name, profiles.full_name),
    role = COALESCE(v_role, profiles.role),
    updated_at = now()
  WHERE profiles.full_name IS NULL OR profiles.role IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger pada tabel auth.users untuk call function saat user update
DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users;
CREATE TRIGGER on_auth_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_profile_from_auth();

-- 5. Create trigger untuk INSERT (user baru)
DROP TRIGGER IF EXISTS on_auth_user_insert ON auth.users;
CREATE TRIGGER on_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_profile_from_auth();

-- 6. Create atau update RLS Policies pada profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- SELECT policy
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- INSERT policy
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE policy
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 7. Backfill existing profiles dari auth.users metadata
-- Run ini SETELAH setup trigger di atas
UPDATE profiles p
SET 
  full_name = COALESCE(p.full_name, COALESCE(u.raw_user_meta_data->>'username', u.raw_user_meta_data->>'full_name', '')),
  role = COALESCE(p.role, COALESCE(u.raw_user_meta_data->>'summary_mode', u.raw_user_meta_data->>'role', 'patologi')),
  updated_at = now()
FROM auth.users u
WHERE p.id = u.id
AND (p.full_name IS NULL OR p.role IS NULL);

-- 8. Verify hasil
SELECT id, full_name, role, updated_at FROM profiles ORDER BY updated_at DESC LIMIT 10;
