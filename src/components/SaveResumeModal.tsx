"use client";

import { useState } from "react";

interface Props {
  resumeText: string;
  currentScore?: number;
  targetRole?: string;
  jobDescription?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveResumeModal({
  resumeText,
  currentScore,
  targetRole,
  jobDescription,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(
    targetRole ? `Resume — ${targetRole}` : "My Resume"
  );
  const [targetCompany, setTargetCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Please give your resume a name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          resumeText,
          targetRole: targetRole || undefined,
          targetCompany: targetCompany || undefined,
          jobDescription: jobDescription || undefined,
          lastScore: currentScore ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save");
      }

      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,26,24,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper-card)",
          borderRadius: 16,
          maxWidth: 460,
          width: "100%",
          padding: 28,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close save modal"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "var(--ink-faint)",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div
          style={{
            fontFamily: "DM Serif Display, serif",
            fontSize: 22,
            marginBottom: 20,
          }}
        >
          Save to Resume Library
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                color: "var(--ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Resume Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software Engineer Resume 2026"
              style={{
                width: "100%",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                fontFamily: "Instrument Sans, sans-serif",
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                color: "var(--ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Target Company (optional)
            </label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="e.g. Google, Stripe, Airbnb"
              style={{
                width: "100%",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                fontFamily: "Instrument Sans, sans-serif",
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>

          {targetRole && (
            <div
              style={{
                fontSize: 13,
                color: "var(--ink-muted)",
                background: "var(--paper-warm)",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              Target role: <strong>{targetRole}</strong>
              {currentScore && (
                <span style={{ marginLeft: 8 }}>
                  · Last score: <strong>{currentScore}</strong>
                </span>
              )}
            </div>
          )}

          {error && (
            <p style={{ color: "#7a2020", fontSize: 13, margin: 0 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                background: "transparent",
                color: "var(--ink-muted)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 0",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Instrument Sans, sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              style={{
                flex: 1,
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 0",
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || !name.trim() ? "not-allowed" : "pointer",
                opacity: saving || !name.trim() ? 0.6 : 1,
                fontFamily: "Instrument Sans, sans-serif",
              }}
            >
              {saving ? "Saving..." : "Save to Library"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}