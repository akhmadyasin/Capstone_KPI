"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/app/lib/supabaseClient";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Check if token is valid (dari URL)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const token = hashParams.get("access_token");

    // Jika tidak ada token atau type bukan password recovery, redirect
    if (!token || type !== "recovery") {
      setTokenValid(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validasi password
    if (!password) {
      setError("Password cannot be empty");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Update password menggunakan Supabase
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="form-side">
          <div className="form-box">
            <h1>Invalid Reset Link</h1>
            <p style={{ textAlign: "center", color: "#6b7280", marginTop: 16 }}>
              The password reset link is invalid or has expired. Please request
              a new one.
            </p>
            <button
              className="btn primary"
              onClick={() => router.push("/login")}
              style={{ marginTop: 24 }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="form-side">
        <div className="form-box">
          <h1>Reset Password</h1>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 24 }}>
            Enter your new password below
          </p>

          {error && (
            <div className="alert" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          {success && (
            <div className="alert success" style={{ marginBottom: 16 }}>
              Password updated successfully! Redirecting to login...
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />

              <label style={{ marginTop: 16 }}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                className="btn primary"
                type="submit"
                disabled={loading}
                style={{ marginTop: 24 }}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="image-side">
        <img src="/login.jpg" alt="Reset Password Illustration" />
      </div>
    </div>
  );
}
