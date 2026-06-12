"use client";

import { Suspense, useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const supabase = createBrowserClient();

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter your email address." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        const isRateLimit = error.message.toLowerCase().includes("rate limit");
        setMessage({
          type: "error",
          text: isRateLimit
            ? "Too many requests. Please wait a minute before trying again."
            : error.message,
        });
        if (isRateLimit) setCooldown(60);
      } else {
        setMessage({
          type: "success",
          text: "Password reset link sent! Check your inbox (and spam folder).",
        });
        setCooldown(60);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a
            href="/"
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 26,
              textDecoration: "none",
              color: "var(--ink)",
            }}
          >
            Resume<em style={{ color: "var(--accent)" }}>Lens</em>
          </a>
          <p style={{ color: "var(--ink-muted)", fontSize: 14, marginTop: 8 }}>
            Reset your password
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 28,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-muted)",
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            Enter the email address linked to your account and we&apos;ll send you a link to reset
            your password.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              id="forgot-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              style={inputStyle}
            />

            {message && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  background: message.type === "error" ? "#fff5f5" : "#edf7f2",
                  color: message.type === "error" ? "#7a2020" : "#2d6a4f",
                  border: `1px solid ${
                    message.type === "error"
                      ? "rgba(200,86,42,0.2)"
                      : "rgba(45,106,79,0.2)"
                  }`,
                  lineHeight: 1.5,
                }}
              >
                {message.text}
              </div>
            )}

            <button
              id="forgot-submit"
              type="submit"
              disabled={loading || cooldown > 0}
              style={{
                width: "100%",
                marginTop: 16,
                background: cooldown > 0 ? "var(--ink-faint)" : "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "12px 0",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || cooldown > 0 ? "not-allowed" : "pointer",
                opacity: loading || cooldown > 0 ? 0.7 : 1,
                transition: "background 0.3s, opacity 0.2s",
              }}
            >
              {loading
                ? "Sending..."
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Send reset link"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "var(--ink-muted)",
              marginTop: 20,
            }}
          >
            <a
              href="/login"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Back to sign in
            </a>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: "100vh", background: "var(--paper)" }} />}
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
