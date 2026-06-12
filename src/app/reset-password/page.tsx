"use client";

import { Suspense, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const supabase = createBrowserClient();

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Password updated! Redirecting..." });
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
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
            Set a new password
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
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 12 }}>
              <input
                id="reset-password"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={inputStyle}
              />
              <input
                id="reset-confirm"
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={inputStyle}
              />
            </div>

            {/* Password strength hint */}
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-faint)",
                marginTop: 8,
                fontFamily: "DM Mono, monospace",
              }}
            >
              min 6 characters
            </p>

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
              id="reset-submit"
              type="submit"
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
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: "100vh", background: "var(--paper)" }} />}
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
