"use client";

import { useState, useCallback } from "react";

interface Props {
  bullet: string;
  resumeContext?: string;
  targetRole?: string;
}

// Parse streamed text into up to 3 rewrite strings
function parseRewrites(raw: string): string[] {
  const rewrites: string[] = [];
  const pattern = /REWRITE\s+\d+:\s*\n([\s\S]*?)(?=REWRITE\s+\d+:|$)/gi;
  let match;
  while ((match = pattern.exec(raw)) !== null) {
    const text = match[1].trim();
    if (text) rewrites.push(text);
  }
  return rewrites;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        border: `1px solid ${copied ? "#10b981" : "var(--border)"}`,
        background: copied ? "#10b981" : "transparent",
        color: copied ? "#fff" : "var(--ink-muted)",
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "DM Mono, monospace",
        letterSpacing: "0.05em",
        cursor: "pointer",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function BulletRewriterCard({ bullet, resumeContext, targetRole }: Props) {
  const [open, setOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [rawStream, setRawStream] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rewrites = parseRewrites(rawStream);
  // While streaming, show partial last rewrite
  const isComplete = !streaming && rawStream.length > 0;

  const handleRewrite = useCallback(async () => {
    setOpen(true);
    setStreaming(true);
    setRawStream("");
    setError(null);

    try {
      const res = await fetch("/api/rewrite-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet, resumeContext, targetRole }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate rewrites");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setRawStream((prev) => prev + chunk);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate rewrites";
      setError(msg);
    } finally {
      setStreaming(false);
    }
  }, [bullet, resumeContext, targetRole]);

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1.5px solid ${open ? "var(--accent-border)" : "var(--border)"}`,
        background: open ? "var(--accent-bg)" : "var(--paper-card)",
        transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }}
    >
      {/* ── Bullet row ───────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "11px 14px",
        }}
      >
        {/* Warning dot */}
        <span
          style={{
            marginTop: 5,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#f59e0b",
            flexShrink: 0,
            boxShadow: "0 0 6px rgba(245,158,11,0.4)",
          }}
        />

        {/* Bullet text */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--ink)",
            fontFamily: "Instrument Sans, sans-serif",
          }}
        >
          {bullet}
        </span>

        {/* Rewrite trigger */}
        <button
          onClick={open && isComplete ? handleRewrite : !open ? handleRewrite : undefined}
          disabled={streaming}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 11px",
            borderRadius: 7,
            border: "1.5px solid var(--accent-border)",
            background: "var(--accent-bg)",
            color: "var(--accent)",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "Instrument Sans, sans-serif",
            cursor: streaming ? "default" : "pointer",
            opacity: streaming ? 0.6 : 1,
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!streaming) (e.currentTarget.style.background = "rgba(99,102,241,0.12)");
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.style.background = "var(--accent-bg)");
          }}
        >
          {streaming ? (
            <>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: "2px solid rgba(99,102,241,0.3)",
                  borderTopColor: "var(--accent)",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Writing...
            </>
          ) : open && isComplete ? (
            <>↺ Regenerate</>
          ) : (
            <>✨ Rewrite</>
          )}
        </button>

        {/* Collapse toggle when open */}
        {open && (
          <button
            onClick={() => setOpen(false)}
            aria-label="Collapse rewriter panel"
            style={{
              padding: "5px 8px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--ink-faint)",
              fontSize: 11,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Rewrites panel ───────────────────────────── */}
      {open && (
        <div
          style={{
            borderTop: "1px solid var(--accent-border)",
            padding: "14px 14px 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "rgba(99,102,241,0.02)",
          }}
        >
          {/* Label */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              fontFamily: "DM Mono, monospace",
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 2,
            }}
          >
            ✨ AI-Powered Rewrites — pick your favourite
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.05)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
                fontSize: 12,
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Show parsed rewrites */}
          {rewrites.map((r, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: "var(--paper-card)",
                border: "1px solid var(--border)",
                animation: "fadeUp 0.3s ease both",
                animationDelay: `${idx * 60}ms`,
              }}
            >
              {/* Number badge */}
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent-border)",
                  color: "var(--accent)",
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: "DM Mono, monospace",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                {idx + 1}
              </span>

              {/* Rewrite text */}
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#10b981",
                  fontFamily: "Instrument Sans, sans-serif",
                  fontWeight: 500,
                }}
              >
                {r}
              </span>

              <CopyButton text={r} />
            </div>
          ))}

          {/* Streaming partial text — shows the in-progress rewrite */}
          {streaming && rewrites.length === 0 && rawStream.length > 0 && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--paper-card)",
                border: "1px dashed var(--accent-border)",
                color: "var(--ink-muted)",
                fontSize: 12,
                fontFamily: "DM Mono, monospace",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {rawStream}
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: "1.1em",
                  background: "var(--accent)",
                  borderRadius: 1,
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                  animation: "sl-cursor-blink 0.75s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Loading state before first text arrives */}
          {streaming && rawStream.length === 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 14px",
                borderRadius: 10,
                background: "var(--paper-card)",
                border: "1px dashed var(--accent-border)",
                color: "var(--ink-muted)",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: "2px solid rgba(99,102,241,0.2)",
                  borderTopColor: "var(--accent)",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              Generating high-impact rewrites...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
