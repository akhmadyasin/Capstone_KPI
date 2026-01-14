"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/app/lib/supabaseClient";

type SummaryMode = "patologi" | "dokter_hewan";

export default function OnboardingRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser();

  const [selectedMode, setSelectedMode] = useState<SummaryMode>("patologi");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check apakah user sudah authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      
      if (userErr || !user) {
        // Tidak ada user, redirect ke login
        router.push("/login");
        return;
      }

      // Check apakah sudah punya summary_mode & username di metadata
      const metadata = user.user_metadata as any;
      if (metadata?.summary_mode && metadata?.username) {
        // Sudah punya, redirect ke dashboard
        router.push("/dashboard");
        return;
      }

      // Set initial values dari user metadata jika ada
      if (metadata?.summary_mode) {
        setSelectedMode(metadata.summary_mode);
      }
      if (metadata?.username) {
        setFullName(metadata.username);
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setLoading(true);

    try {
      // Get session (bukan hanya user)
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr || !session?.user) {
        console.error("Session error:", sessionErr);
        setError("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      const user = session.user;
      console.log("=== Onboarding Submit ===");
      console.log("User ID:", user.id);
      console.log("User email:", user.email);
      console.log("User authenticated:", !!session.access_token);
      console.log("Full name to save:", fullName.trim());
      console.log("Role to save:", selectedMode);

      // 1. Update user metadata dengan summary_mode dan username
      console.log("[STEP 1] Updating auth metadata...");
      const { error: updateErr } = await supabase.auth.updateUser({
        data: {
          summary_mode: selectedMode,
          username: fullName.trim(),
        },
      });

      if (updateErr) {
        console.error("[STEP 1] Auth update error:", updateErr);
        setError(updateErr.message);
        setLoading(false);
        return;
      }

      console.log("[STEP 1] ✅ Auth metadata updated successfully");

      // 2. Direct update ke tabel profiles
      console.log("[STEP 2] Updating profiles table...");
      console.log("Update payload:", {
        full_name: fullName.trim(),
        role: selectedMode,
        updated_at: new Date().toISOString(),
      });

      const { data: updateData, error: profileDbErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          role: selectedMode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select();

      if (profileDbErr) {
        console.error("[STEP 2] Profiles update error:", profileDbErr);
        console.error("[STEP 2] Error details:", {
          message: profileDbErr.message,
          code: (profileDbErr as any).code,
          status: (profileDbErr as any).status,
        });

        // Coba insert jika update gagal (user baru, belum ada row)
        console.log("[STEP 2] Trying insert instead...");
        const { data: insertData, error: insertErr } = await supabase
          .from("profiles")
          .insert([{
            id: user.id,
            full_name: fullName.trim(),
            role: selectedMode,
            updated_at: new Date().toISOString(),
          }])
          .select();

        if (insertErr) {
          console.error("[STEP 2] Profiles insert error:", insertErr);
          console.error("[STEP 2] Insert error details:", {
            message: insertErr.message,
            code: (insertErr as any).code,
            status: (insertErr as any).status,
          });
          // Tetap lanjut, auth metadata sudah update
        } else {
          console.log("[STEP 2] ✅ Profile inserted successfully:", insertData);
        }
      } else {
        console.log("[STEP 2] ✅ Profile updated successfully:", updateData);
      }

      // 3. Verify hasil
      console.log("[STEP 3] Verifying profile...");
      const { data: verifyData, error: verifyErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (verifyErr) {
        console.warn("[STEP 3] Verify error:", verifyErr);
      } else {
        console.log("[STEP 3] ✅ Profile verified:", verifyData);
      }

      // Persist ke localStorage
      try {
        localStorage.setItem("summaryMode", selectedMode);
      } catch {}

      console.log("=== Onboarding Complete ===");

      // Redirect ke dashboard
      const nextUrl = searchParams.get("next") || "/dashboard";
      router.push(nextUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="auth-container">
        <div className="form-side">
          <div className="form-box">
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="form-side">
        <div className="form-box">
          <h1>Welcome! 👋</h1>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
            Let's set up your profile. Choose your role and enter your name.
          </p>

          {error && (
            <div className="alert" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Role Selection */}
            <label style={{ marginTop: 0 }}>Select Your Role</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {/* Pathologist Option */}
              <div
                onClick={() => setSelectedMode("patologi")}
                style={{
                  padding: 16,
                  border:
                    selectedMode === "patologi"
                      ? "2px solid #3b82f6"
                      : "2px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor:
                    selectedMode === "patologi" ? "#eff6ff" : "#f9fafb",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 8,
                  }}
                >
                  🔬
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: selectedMode === "patologi" ? "#3b82f6" : "#1f2937",
                    marginBottom: 4,
                  }}
                >
                  Pathologist
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Medical Analysis
                </div>
              </div>

              {/* Veterinarian Option */}
              <div
                onClick={() => setSelectedMode("dokter_hewan")}
                style={{
                  padding: 16,
                  border:
                    selectedMode === "dokter_hewan"
                      ? "2px solid #3b82f6"
                      : "2px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor:
                    selectedMode === "dokter_hewan" ? "#eff6ff" : "#f9fafb",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 8,
                  }}
                >
                  🐾
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color:
                      selectedMode === "dokter_hewan" ? "#3b82f6" : "#1f2937",
                    marginBottom: 4,
                  }}
                >
                  Veterinarian
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Animal Medicine
                </div>
              </div>
            </div>

            {/* Name Input */}
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              autoComplete="name"
            />

            <button
              className="btn primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 24 }}
            >
              {loading ? "Setting up..." : "Continue to Dashboard"}
            </button>
          </form>
        </div>
      </div>

      <div className="image-side">
        <img src="/login.jpg" alt="Onboarding Illustration" />
      </div>
    </div>
  );
}
