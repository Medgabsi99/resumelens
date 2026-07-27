"use client";
import { useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

// ─── Segment types ────────────────────────────────────────────────────────────

interface Segment {
  type: "text" | "match";
  content: string;
}

/**
 * Tokenise a single line of text into alternating plain-text / keyword-match
 * segments. Keywords are matched case-insensitively at word boundaries.
 */
function buildSegments(line: string, keywords: string[]): Segment[] {
  if (!keywords.length || !line.trim()) return [{ type: "text", content: line }];

  // Sort longest-first to prevent partial matches swallowing longer phrases
  const escaped = keywords
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const regex = new RegExp(`\\b(?:${escaped.join("|")})\\b`, "gi");

  const segments: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) segments.push({ type: "text", content: line.slice(last, m.index) });
    segments.push({ type: "match", content: m[0] });
    last = m.index + m[0].length;
  }
  if (last < line.length) segments.push({ type: "text", content: line.slice(last) });

  return segments;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  resumeText: string;
  matched: string[];
  missing: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KeywordHighlighter({ resumeText, matched, missing }: Props) {
  const [activeHint, setActiveHint] = useState<string | null>(null);

  /* Keywords that do NOT appear anywhere in the resume text */
  const trulyMissing = useMemo(
    () => missing.filter(kw => !resumeText.toLowerCase().includes(kw.toLowerCase())),
    [missing, resumeText]
  );

  /* Split into non-empty paragraphs */
  const paragraphs = useMemo(
    () => resumeText.split(/\n+/).filter(p => p.trim()),
    [resumeText]
  );

  /* Highlight segments per paragraph */
  const highlighted = useMemo(
    () => paragraphs.map(p => buildSegments(p, matched)),
    [paragraphs, matched]
  );

  const matchCount = matched.length;
  const missCount  = trulyMissing.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      style={{ marginTop: 16 }}
    >
      {/* ── Truly-missing bar ─────────────────────────────────────────────── */}
      {trulyMissing.length > 0 && (
        <div
          role="region"
          aria-label="Missing keywords"
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: 10,
          }}
        >
          <div style={{
            fontSize: 10,
            fontFamily: "DM Mono, monospace",
            color: "#b91c1c",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            fontWeight: 700,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <Zap size={11} />
            <span>Not found in your resume — add these to boost ATS score</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(trulyMissing || []).map(kw => (
              <button
                key={kw}
                type="button"
                onClick={() => setActiveHint(activeHint === kw ? null : kw)}
                aria-pressed={activeHint === kw}
                style={{
                  background: activeHint === kw ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.07)",
                  color: "#b91c1c",
                  border: `1px dashed ${activeHint === kw ? "#dc2626" : "#fca5a5"}`,
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "DM Mono, monospace",
                  transition: "all 0.15s ease",
                }}
              >
                + {kw}
              </button>
            ))}
          </div>

          {activeHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "#7f1d1d",
                fontStyle: "italic",
                background: "rgba(239,68,68,0.06)",
                padding: "7px 11px",
                borderRadius: 6,
                borderLeft: "3px solid #fca5a5",
              }}
            >
              💡 Weave &ldquo;<strong>{activeHint}</strong>&rdquo; naturally into your{" "}
              <strong>Summary</strong> or <strong>Skills</strong> section to raise your ATS match rate.
            </motion.div>
          )}
        </div>
      )}

      {/* ── Highlighted resume text ───────────────────────────────────────── */}
      <div
        role="region"
        aria-label="Resume text with keywords highlighted"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "18px 20px",
          maxHeight: 440,
          overflowY: "auto",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 13.5,
          lineHeight: 1.85,
          color: "var(--ink)",
          scrollbarWidth: "thin",
        }}
      >
        {highlighted.length === 0 && (
          <p style={{ color: "var(--ink-faint)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>
            No resume text available to highlight.
          </p>
        )}

        {highlighted.map((segments, pi) => (
          <p key={pi} style={{ margin: "0 0 0.6em 0", padding: 0 }}>
            {segments.map((seg, si) =>
              seg.type === "match" ? (
                <mark
                  key={si}
                  title={`✓ JD keyword match: "${seg.content}"`}
                  style={{
                    background: "rgba(224, 93, 46, 0.15)",
                    color: "var(--accent)",
                    borderRadius: 3,
                    padding: "1px 4px",
                    fontWeight: 700,
                    boxShadow: "0 0 0 1.5px rgba(224,93,46,0.22)",
                    cursor: "default",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(224,93,46,0.28)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(224,93,46,0.15)"; }}
                >
                  {seg.content}
                </mark>
              ) : (
                <span key={si}>{seg.content}</span>
              )
            )}
          </p>
        ))}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        marginTop: 10,
        alignItems: "center",
        fontSize: 10,
        fontFamily: "DM Mono, monospace",
        color: "var(--ink-muted)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <mark style={{
            background: "rgba(224, 93, 46, 0.15)",
            color: "var(--accent)",
            borderRadius: 3,
            padding: "0 4px",
            fontWeight: 700,
            boxShadow: "0 0 0 1.5px rgba(224,93,46,0.22)",
            fontSize: 10,
          }}>keyword</mark>
          <span>= found in JD</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            background: "rgba(239,68,68,0.07)",
            color: "#b91c1c",
            border: "1px dashed #fca5a5",
            borderRadius: 4,
            padding: "0 6px",
            fontSize: 10,
            fontWeight: 700,
          }}>+ missing</span>
          <span>= add to resume</span>
        </div>
        <div style={{ marginLeft: "auto", color: "var(--ink-faint)" }}>
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>{matchCount}</span> matched
          {" · "}
          <span style={{ color: "#b91c1c", fontWeight: 700 }}>{missCount}</span> missing
        </div>
      </div>
    </motion.div>
  );
}
