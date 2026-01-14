import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Supabase JS di browser akan ambil token dari hash URL.
  // Check apakah user sudah punya role dan nama di metadata
  // Jika belum, redirect ke onboarding
  // Jika sudah, redirect ke dashboard
  
  // Redirect ke onboarding untuk setup role & nama (Google OAuth akan masuk sini)
  const response = NextResponse.redirect(new URL("/onboarding/role", req.url));
  return response;
}
