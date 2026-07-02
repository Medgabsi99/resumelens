"use client";

import { Suspense, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import {
  compose,
  required,
  minLength,
  maxLength,
  noScript,
  matchesField,
  checkPasswordStrength,
} from "@/lib/validate";

// ─── Shared UI pieces ─────────────────────────────────────────────────────

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

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const s = checkPasswordStrength(password);

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: 10.5,
            fontFamily: "DM Mono, monospace",
            fontWeight: 700,
            color: s.color,
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

// ─── Match indicator ──────────────────────────────────────────────────────

function MatchIndicator({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const match = password === confirm;
  return (
    <div
      style={{
        marginTop: 4,
        fontSize: 11,
        fontFamily: "DM Mono, monospace",
        fontWeight: 700,
        color: match ? "#10b981" : "#ef4444",
        display: "flex",
        alignItems: "center",
        gap: 4,
        transition: "color 0.2s",
      }}
    >
      {match ? "✓ Passwords match" : "✗ Passwords don't match"}
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const supabase = createBrowserClient();

  const passwordRule = compose(
    required("Password"),
    minLength(8, "Password"),
    maxLength(128, "Password"),
    noScript()
  );
  const confirmRule = compose(required("Confirm password"), matchesField(password));

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const passwordError = touched.password ? passwordRule(password) : null;
  const confirmError = touched.confirm ? confirmRule(confirm) : null;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setTouched({ password: true, confirm: true });

    if (passwordRule(password) || confirmRule(confirm)) return;

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
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: "grid", gap: 16 }}>
              {/* New password */}
              <div>
                <label
                  htmlFor="reset-password"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "DM Mono, monospace",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--ink-muted)",
                    marginBottom: 6,
                  }}
                >
                  New Password
                </label>
                <input
                  id="reset-password"
                  type="password"
                  placeholder="min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch("password")}
                  autoFocus
                  autoComplete="new-password"
                  aria-invalid={!!passwordError}
                  style={{
                    ...inputStyle,
                    borderColor: passwordError ? "#ef4444" : undefined,
                  }}
                />
                <PasswordStrengthMeter password={password} />
                <FieldError msg={passwordError} />
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="reset-confirm"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "DM Mono, monospace",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--ink-muted)",
                    marginBottom: 6,
                  }}
                >
                  Confirm Password
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => touch("confirm")}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="new-password"
                  aria-invalid={!!confirmError}
                  style={{
                    ...inputStyle,
                    borderColor: confirmError ? "#ef4444" : confirm && !confirmError ? "#10b981" : undefined,
                  }}
                />
                <MatchIndicator password={password} confirm={confirm} />
                <FieldError msg={confirmError} />
              </div>
            </div>

            {message && (
              <div
                role="alert"
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
                {message.type === "success" && <span style={{ marginRight: 6 }}>✅</span>}
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
  transition: "border-color 0.2s",
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
