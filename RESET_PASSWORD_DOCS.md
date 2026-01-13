# Password Reset Feature Documentation

## Overview
Fitur reset password sudah diimplementasikan menggunakan Supabase Authentication.

## Flow

### 1. User Request Reset Password
- User pergi ke halaman login
- Klik tombol **"Forgot Password?"**
- Enter email address
- Klik tombol untuk mengirim reset link
- Email akan dikirimkan dengan link reset password

### 2. Email Link
Link di email akan mengarahkan ke:
```
https://yourapp.com/auth/update-password#type=recovery&access_token=...&refresh_token=...
```

### 3. Reset Password Page
- User akan diarahkan ke `/auth/update-password`
- Page ini akan validate token dari URL
- User masukkan password baru dan confirm password
- Klik **"Update Password"**
- Password akan di-update di Supabase
- Auto redirect ke login dalam 2 detik

## Configuration

### Di Login Page (`login/page.tsx`)
Sudah ada:
```typescript
const onForgot = async () => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/auth/update-password`,
  });
};
```

### Di Supabase Console
1. Buka [Supabase Console](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Authentication > Email Templates**
4. Edit template **Confirm signup** atau **Reset Password**
5. Pastikan link sudah correctly configured

## Features

✅ Password validation (min 6 characters)
✅ Password confirmation matching
✅ Token validation from URL
✅ Auto redirect to login after success
✅ Error handling and user feedback
✅ Loading states

## Testing

### Manual Testing
1. Buka `http://localhost:3000/login`
2. Klik "Forgot Password?"
3. Enter test email
4. Check email inbox untuk link reset
5. Klik link dari email
6. Enter new password
7. Verify password sudah terupdate

### Important Notes
- Email harus benar-benar valid di Supabase
- Check spam folder jika email tidak masuk
- Token berlaku selama waktu tertentu (default Supabase: beberapa jam)
- Session user harus aktif saat update password (handled by Supabase)

## File Created
- `/src/app/auth/update-password/page.tsx` - Reset password page

## Next Steps (Optional)
Jika ingin tambahan fitur:
1. Add password strength indicator
2. Add resend email option
3. Add rate limiting untuk prevent abuse
4. Add analytics/logging untuk security monitoring
