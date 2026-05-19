"use client";

import { Suspense, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

// Inner component that uses useSearchParams — must be inside Suspense
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const supabase = createBrowserClient();

  async function handleSubmit() {
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setMessage({ type: "error", text: error.message }); return; }
        window.location.href = next;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) { setMessage({ type: "error", text: error.message }); return; }
        setMessage({ type: "success", text: "Check your email for a confirmation link." });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="/" style={{ fontFamily: "DM Serif Display, serif", fontSize: 26, textDecoration: "none", color: "var(--ink)" }}>
            Resume<em style={{ color: "var(--accent)" }}>Lens</em>
          </a>
          <p style={{ color: "var(--ink-muted)", fontSize: 14, marginTop: 8 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <div style={{ background: "var(--paper-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            style={{
              width: "100%",
              background: "white",
              border: "1.5px solid var(--border-strong)",
              borderRadius: 10,
              padding: "11px 0",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
              <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.9 6.3 14.7z" fill="#FF3D00"/>
              <path d="M24 45c5.5 0 10.5-1.9 14.3-5.2l-6.6-5.6C29.6 35.9 27 37 24 37c-6.1 0-10.7-3.1-11.7-8.5L5.2 34c3.4 6.7 10 11 18.8 11z" fill="#4CAF50"/>
              <path d="M44.5 20H24v8.5h11.8c-1.1 3.1-4.1 5.5-7.8 6.7l6.6 5.6c4.5-4.1 7.4-10.1 7.4-16.8 0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "DM Mono, monospace" }}>or email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Email + password */}
          <div style={{ display: "grid", gap: 12 }}>
            <input
              id="login-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
            />
          </div>

          {message && (
            <div style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background: message.type === "error" ? "#fff5f5" : "#edf7f2",
              color: message.type === "error" ? "#7a2020" : "#2d6a4f",
              border: `1px solid ${message.type === "error" ? "rgba(200,86,42,0.2)" : "rgba(45,106,79,0.2)"}`,
            }}>
              {message.text}
            </div>
          )}

          <button
            id="login-submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 16,
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-muted)", marginTop: 16 }}>
            {mode === "login" ? "No account? " : "Already have one? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border)",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  background: "var(--paper)",
  color: "var(--ink)",
  outline: "none",
  fontFamily: "Instrument Sans, sans-serif",
};

// Page export wraps with Suspense (required by Next.js App Router for useSearchParams)
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--paper)" }} />}>
      <LoginForm />
    </Suspense>
  );
}
