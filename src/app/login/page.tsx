"use client";

import { Suspense, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import {
  compose,
  required,
  isEmail,
  minLength,
  maxLength,
  noScript,
  checkPasswordStrength,
  validateForm,
  hasErrors,
} from "@/lib/formValidation";

// ─── Inline error label ───────────────────────────────────────────────────

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <span
      role="alert"
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 11.5,
        color: "#ef4444",
        fontFamily: "Instrument Sans, sans-serif",
        fontWeight: 500,
        lineHeight: 1.4,
      }}
    >
      {msg}
    </span>
  );
}

// ─── Password Strength Meter ──────────────────────────────────────────────

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const s = checkPasswordStrength(password);

  return (
    <div style={{ marginTop: 6 }}>
      {/* Bar */}
      <div
        style={{
          display: "flex",
          gap: 3,
          marginBottom: 4,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 10,
              background: i < s.score ? s.color : "var(--border)",
              transition: "background 0.25s ease",
            }}
          />
        ))}
      </div>
      {/* Label */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: 10.5,
            fontFamily: "DM Mono, monospace",
            fontWeight: 700,
            color: s.color,
            transition: "color 0.2s",
          }}
        >
          {s.label}
        </span>
        {s.suggestions.length > 0 && (
          <span style={{ fontSize: 10, color: "var(--ink-faint)", fontFamily: "DM Mono, monospace" }}>
            {s.suggestions[0]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Validation rules ─────────────────────────────────────────────────────

const emailRules = compose(required("Email"), isEmail(), noScript());
const loginPasswordRules = compose(required("Password"), minLength(6, "Password"));
const signupPasswordRules = compose(
  required("Password"),
  minLength(8, "Password"),
  maxLength(128, "Password"),
  noScript()
);

// ─── Inner form component ─────────────────────────────────────────────────

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const errorParam = searchParams.get("error");

  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    errorParam ? { type: "error", text: errorParam } : null
  );

  const supabase = createBrowserClient();

  // Compute errors live
  const errors = validateForm({ email, password }, {
    email: emailRules,
    password: mode === "login" ? loginPasswordRules : signupPasswordRules,
  });

  const touch = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Only show an error if the field has been touched
  const fieldError = (field: "email" | "password") =>
    touched[field] ? errors[field] : null;

  async function handleSubmit() {
    // Touch all fields to surface errors
    setTouched({ email: true, password: true });
    if (hasErrors(errors)) return;

    setLoading(true);
    setMessage(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage({
            type: "error",
            text:
              error.message === "Invalid login credentials"
                ? "Incorrect email or password. Please try again."
                : error.message,
          });
          return;
        }
        window.location.href = next;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) {
          setMessage({ type: "error", text: error.message });
          return;
        }
        setMessage({ type: "success", text: "Check your email for a confirmation link." });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to start Google sign-in" });
    }
  }

  function handleModeSwitch() {
    setMode(mode === "login" ? "signup" : "login");
    setTouched({});
    setMessage(null);
  }

  const canSubmit = !loading;

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6"
      style={{ background: "var(--paper)" }}
    >
      {/* Background glow blobs */}
      <div className="glow-blob top-[-50px] right-[-50px] w-[300px] h-[300px]" />
      <div
        className="glow-blob bottom-[-50px] left-[-50px] w-[300px] h-[300px]"
        style={{ animationDelay: "-1.5s" }}
      />

      <main className="relative z-10 w-full max-w-[400px] min-w-0 fade-up">
        <div className="text-center mb-8">
          <a
            href="/"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight no-underline text-ink inline-block"
          >
            Resume<span style={{ color: "var(--accent)" }}>Lens</span>
          </a>
          <p className="text-ink-muted text-xs sm:text-sm mt-2">
            {mode === "login"
              ? "Welcome back to your dashboard"
              : "Create your account for unlimited reviews"}
          </p>
        </div>

        <div className="glass-card bg-paper-card border border-border p-5 sm:p-8 rounded-2xl shadow-premium">
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-paper hover:bg-paper-warm border border-border-strong rounded-xl py-3 px-4 text-sm font-medium text-ink cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
              <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.9 6.3 14.7z" fill="#FF3D00"/>
              <path d="M24 45c5.5 0 10.5-1.9 14.3-5.2l-6.6-5.6C29.6 35.9 27 37 24 37c-6.1 0-10.7-3.1-11.7-8.5L5.2 34c3.4 6.7 10 11 18.8 11z" fill="#4CAF50"/>
              <path d="M44.5 20H24v8.5h11.8c-1.1 3.1-4.1 5.5-7.8 6.7l6.6 5.6c4.5-4.1 7.4-10.1 7.4-16.8 0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="font-mono text-[10px] tracking-wider text-ink-faint uppercase">or email</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-[11px] font-mono font-bold tracking-wider text-ink-muted uppercase mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => touch("email")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("login-password")?.focus();
                  }
                }}
                className="premium-input"
                style={fieldError("email") ? { borderColor: "#ef4444" } : undefined}
                aria-invalid={!!fieldError("email")}
                aria-describedby="login-email-error"
                autoComplete="email"
              />
              <FieldError msg={fieldError("email")} />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-mono font-bold tracking-wider text-ink-muted uppercase"
                >
                  Password
                </label>
                {mode === "login" && (
                  <a
                    href="/forgot-password"
                    className="text-xs text-accent hover:text-accent-hover font-semibold no-underline transition-colors duration-150"
                  >
                    Forgot?
                  </a>
                )}
              </div>
              <input
                id="login-password"
                type="password"
                placeholder={mode === "signup" ? "min. 8 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch("password")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="premium-input"
                style={fieldError("password") ? { borderColor: "#ef4444" } : undefined}
                aria-invalid={!!fieldError("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <FieldError msg={fieldError("password")} />
              {/* Password strength meter — only on signup */}
              {mode === "signup" && <PasswordStrengthMeter password={password} />}
            </div>
          </div>

          {/* Server-level message */}
          {message && (
            <div
              className="mt-4 p-3.5 rounded-xl text-sm leading-relaxed border"
              role="alert"
              style={{
                background: message.type === "error" ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                color: message.type === "error" ? "#ef4444" : "#10b981",
                borderColor: message.type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
              }}
            >
              {message.text}
            </div>
          )}

          <button
            id="login-submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full btn-gradient py-3.5 rounded-xl text-sm font-semibold cursor-pointer mt-6 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-xs text-ink-muted mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={handleModeSwitch}
              className="bg-transparent border-none text-accent hover:text-accent-hover font-bold cursor-pointer text-xs transition-colors duration-150"
            >
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

// Page export wraps with Suspense (required by Next.js App Router for useSearchParams)
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--paper)" }} />}>
      <LoginForm />
    </Suspense>
  );
}
