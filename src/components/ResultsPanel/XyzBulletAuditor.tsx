"use client";

import { useState, useCallback } from "react";

interface XyzData {
  xyzRewrite: string;
  xyzBreakdown: { x: string; y: string; z: string };
  alternativeA: string;
  alternativeB: string;
  weaknessAnalysis: string;
  improvedVerb: string;
}

interface Props {
  bullet: string;
  targetRole?: string;
  jobDescription?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        padding: "3px 10px",
        borderRadius: 6,
        border: `1px solid ${copied ? "#10b981" : "var(--border)"}`,
        background: copied ? "#10b981" : "transparent",
        color: copied ? "#fff" : "var(--ink-muted)",
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "DM Mono, monospace",
        cursor: "pointer",
        transition: "all 0.18s",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function XyzPill({ letter, label, value }: { letter: string; label: string; value: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    X: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    Y: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    Z: { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff" },
  };
  const c = colors[letter] || colors.X;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: 10,
        background: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: c.text,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 900,
          flexShrink: 0,
          fontFamily: "DM Mono, monospace",
        }}
      >
        {letter}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: c.text, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>{value}</div>
      </div>
    </div>
  );
}

export default function XyzBulletAuditor({ bullet, targetRole, jobDescription }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<XyzData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    setData(null);
    setError(null);

    try {
      const res = await fetch("/api/xyz-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet, targetRole, jobDescription }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to generate XYZ rewrite");
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [bullet, targetRole, jobDescription]);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--paper-card)",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Header row */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => {
          if (!data && !loading) handleAnalyze();
          else setOpen((v) => !v);
        }}
      >
        <span style={{ fontSize: 18, marginTop: 1 }}>🔬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 3,
            }}
          >
            Google XYZ Auditor
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink)",
              lineHeight: 1.4,
              fontStyle: "italic",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            "{bullet}"
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAnalyze();
          }}
          style={{
            padding: "6px 14px",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "opacity 0.15s",
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          {loading ? "Analyzing..." : data ? "Re-analyze" : "⚡ XYZ Audit"}
        </button>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {loading && (
            <div
              style={{
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "3px solid var(--border)",
                  borderTop: "3px solid #6366f1",
                  borderRadius: "50%",
                  animation: "spin 0.9s linear infinite",
                }}
              />
              <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                Applying Google XYZ formula...
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "14px 16px",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 8,
                margin: 12,
                fontSize: 12.5,
                color: "#991b1b",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {data && (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Weakness analysis */}
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  fontSize: 12.5,
                  color: "#92400e",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 700 }}>⚠️ Why it was weak:</span>{" "}
                {data.weaknessAnalysis}
              </div>

              {/* XYZ Breakdown */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  XYZ Formula Breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <XyzPill letter="X" label="Accomplished (What)" value={data.xyzBreakdown.x} />
                  <XyzPill letter="Y" label="Measured By (How much)" value={data.xyzBreakdown.y} />
                  <XyzPill letter="Z" label="By Doing (How)" value={data.xyzBreakdown.z} />
                </div>
              </div>

              {/* XYZ Rewrite (star version) */}
              <div
                style={{
                  padding: "14px 16px",
                  background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
                  border: "1.5px solid #c7d2fe",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#4338ca",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    ⭐ XYZ Formula Rewrite
                    <span
                      style={{
                        background: "#6366f1",
                        color: "#fff",
                        padding: "1px 7px",
                        borderRadius: 20,
                        fontSize: 9,
                        fontWeight: 800,
                      }}
                    >
                      RECOMMENDED
                    </span>
                  </div>
                  <CopyButton text={data.xyzRewrite} />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    color: "#1e1b4b",
                    lineHeight: 1.6,
                    fontWeight: 500,
                  }}
                >
                  {data.xyzRewrite}
                </p>
                <div style={{ marginTop: 8, fontSize: 10.5, color: "#6366f1", fontWeight: 600 }}>
                  Action verb: <strong>{data.improvedVerb}</strong>
                </div>
              </div>

              {/* Alternative A */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "var(--paper)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--ink-faint)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Alternative A
                  </span>
                  <CopyButton text={data.alternativeA} />
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>
                  {data.alternativeA}
                </p>
              </div>

              {/* Alternative B */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "var(--paper)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--ink-faint)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Alternative B — Business Impact Focus
                  </span>
                  <CopyButton text={data.alternativeB} />
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>
                  {data.alternativeB}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
