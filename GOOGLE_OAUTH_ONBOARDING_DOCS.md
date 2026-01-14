# Google OAuth + Onboarding Flow Documentation

## Overview
Fitur Google OAuth login dengan mandatory onboarding untuk memilih role (Pathologist/Veterinarian) dan mengisi nama.

## Flow

### Before
```
Login dengan Google → Langsung ke Dashboard (tanpa role/nama)
```

### After
```
Login dengan Google → /auth/callback → /onboarding/role 
→ Pilih Role + Isi Nama → Update metadata di Supabase 
→ /dashboard
```

## New Features

### 1. **Onboarding Page** (`/onboarding/role`)
- ✅ Muncul setelah Google OAuth login
- ✅ Visual role selection dengan emoji dan deskripsi
  - 🔬 Pathologist (Patologi)
  - 🐾 Veterinarian (Dokter Hewan)
- ✅ Input field untuk Full Name
- ✅ Validasi nama (minimal 2 karakter)
- ✅ Simpan ke Supabase user metadata
- ✅ Auto redirect ke dashboard setelah sukses

### 2. **Smart Auth Callback** (`/auth/callback`)
- ✅ Cek apakah user sudah punya role & nama
- ✅ Jika belum → redirect ke `/onboarding/role`
- ✅ Jika sudah → redirect ke `/dashboard`

### 3. **Local Storage Persistence**
- ✅ Simpan `summaryMode` ke localStorage
- ✅ Digunakan untuk UI consistency

## Data Stored in Supabase

User metadata akan disimpan:
```json
{
  "summary_mode": "patologi" | "dokter_hewan",
  "username": "Nama User"
}
```

## Testing Flow

### Google OAuth Testing
1. Buka `http://localhost:3000/login`
2. Klik **"Log in with Google"**
3. Masukkan email & password Google
4. Akan redirect ke `/onboarding/role`
5. Pilih role (Pathologist atau Veterinarian)
6. Masukkan Full Name
7. Klik **"Continue to Dashboard"**
8. Auto redirect ke `/dashboard` ✅

### Local Login (Already has role/name)
- Login dengan email/password seperti biasa
- Jika sudah punya role → langsung ke dashboard
- Jika belum → redirect ke onboarding

## Pages Modified/Created

### Modified
- `src/app/login/page.tsx` - Updated Google OAuth flow
- `src/app/auth/callback/route.ts` - Now redirects to onboarding

### Created
- `src/app/onboarding/role/page.tsx` - New onboarding page

## Next Steps (Optional)

Jika ingin tambahan fitur:
1. Add profile photo upload
2. Add email verification check
3. Add username uniqueness validation
4. Add "Skip for now" button (optional)
5. Add progress indicator (Step 1 of 2, etc)

## Important Notes

- Setiap Google login baru harus melalui onboarding
- User yang sudah punya role/nama akan skip onboarding
- Metadata di Supabase akan terupdate otomatis
- Session user tetap aktif selama onboarding
