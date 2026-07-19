"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, X, Loader2, ArrowRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface AnalysisSnapshot {
  id: string;
  score: number | null;
  target_role: string;
  created_at: string;
}

interface AnalysisDetail {
  resumeText: string;
  score: number | null;
  targetRole: string;
}

type DiffToken =
  | { type: "equal";   text: string }
  | { type: "insert";  text: string }
  | { type: "delete";  text: string };

// ─── Word-level diff (Myers LCS, simplified) ─────────────────
function wordDiff(a: string, b: string): DiffToken[] {
  const wordsA = a.match(/\S+|\s+/g) ?? [];
  const wordsB = b.match(/\S+|\s+/g) ?? [];

  // Build LCS table
  const m = wordsA.length;
  const n = wordsB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (wordsA[i] === wordsB[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Trace back
  const tokens: DiffToken[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && wordsA[i] === wordsB[j]) {
      tokens.push({ type: "equal", text: wordsA[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      tokens.push({ type: "insert", text: wordsB[j] });
      j++;
    } else {
      tokens.push({ type: "delete", text: wordsA[i] });
      i++;
    }
  }
  return tokens;
}

// Merge consecutive equal tokens to reduce DOM nodes
function mergeTokens(tokens: DiffToken[]): DiffToken[] {
  const out: DiffToken[] = [];
  for (const t of tokens) {
    const last = out[out.length - 1];
    if (last && last.type === t.type) {
      last.text += t.text;
    } else {
      out.push({ ...t });
    }
  }
  return out;
}

// ─── Render diff tokens as spans ─────────────────────────────
function DiffContent({ tokens, side }: { tokens: DiffToken[]; side: "left" | "right" }) {
  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "DM Mono, monospace",
        fontSize: 12.5,
        lineHeight: 1.9,
        margin: 0,
        color: "var(--ink)",
      }}
    >
      {tokens.map((t, i) => {
        if (t.type === "equal") {
          return <span key={i}>{t.text}</span>;
        }
        if (t.type === "insert" && side === "right") {
          return (
            <mark
              key={i}
              style={{
                background: "rgba(16,185,129,0.18)",
                color: "#10b981",
                borderRadius: 3,
                padding: "0 1px",
                textDecoration: "none",
              }}
            >
              {t.text}
            </mark>
          );
        }
        if (t.type === "delete" && side === "left") {
          return (
            <mark
              key={i}
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#ef4444",
                borderRadius: 3,
                padding: "0 1px",
                textDecoration: "line-through",
                textDecorationColor: "rgba(239,68,68,0.5)",
              }}
            >
              {t.text}
            </mark>
          );
        }
        // Hide inserts on left pane and deletes on right pane (show as ghosted)
        return (
          <span key={i} style={{ opacity: 0.25 }}>
            {t.text}
          </span>
        );
      })}
    </pre>
  );
}

// ─── Score Delta Badge ────────────────────────────────────────
function ScoreDelta({ from, to }: { from: number | null; to: number | null }) {
  if (from === null || to === null) return null;
  const delta = to - from;
  const color = delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "var(--ink-muted)";
  const sign = delta > 0 ? "+" : "";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "0 16px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color,
          fontFamily: "DM Mono, monospace",
          lineHeight: 1,
        }}
      >
        {sign}{delta}
      </div>
      <div style={{ fontSize: 9, color: "var(--ink-faint)", fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        pts
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {delta >= 0
          ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 5 5 12"/></>
          : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></>
        }
      </svg>
    </div>
  );
}

// ─── Panel Header ─────────────────────────────────────────────
function PanelHeader({
  label,
  score,
  date,
  role,
  side,
}: {
  label: string;
  score: number | null;
  date: string;
  role: string;
  side: "left" | "right";
}) {
  const scoreColor =
    score === null ? "var(--ink-faint)"
    : score >= 80 ? "#10b981"
    : score >= 60 ? "#f59e0b"
    : "#ef4444";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        background: side === "left" ? "rgba(239,68,68,0.04)" : "rgba(16,185,129,0.04)",
        borderRadius: "12px 12px 0 0",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            fontFamily: "DM Mono, monospace",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--ink-faint)",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-muted)" }}>
          {role || "Resume Analysis"}
        </div>
        <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 1 }}>
          {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
      {score !== null && (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `2.5px solid ${scoreColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor, fontFamily: "DM Mono, monospace" }}>
            {score}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────
function DiffLegend() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Legend:</span>
      <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
        <mark style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: 3, padding: "0 5px", textDecoration: "line-through" }}>removed</mark>
        <span style={{ color: "var(--ink-muted)" }}>Deleted text</span>
      </span>
      <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
        <mark style={{ background: "rgba(16,185,129,0.18)", color: "#10b981", borderRadius: 3, padding: "0 5px" }}>added</mark>
        <span style={{ color: "var(--ink-muted)" }}>New text</span>
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selected left analysis id (optional) */
  defaultLeftId?: string;
  /** Pre-selected right analysis id (optional) */
  defaultRightId?: string;
}

export default function ResumeDiffViewer({ isOpen, onClose, defaultLeftId, defaultRightId }: Props) {
  const [analyses, setAnalyses] = useState<AnalysisSnapshot[]>([]);
  const [leftId, setLeftId] = useState(defaultLeftId ?? "");
  const [rightId, setRightId] = useState(defaultRightId ?? "");
  const [leftDetail, setLeftDetail] = useState<AnalysisDetail | null>(null);
  const [rightDetail, setRightDetail] = useState<AnalysisDetail | null>(null);
  const [loadingLeft, setLoadingLeft] = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);
  const [tokens, setTokens] = useState<DiffToken[]>([]);

  // Fetch analysis list
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/analyses")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setAnalyses(j.data ?? []);
      })
      .catch(() => {});
  }, [isOpen]);

  // Fetch left detail
  useEffect(() => {
    if (!leftId) { setLeftDetail(null); return; }
    setLoadingLeft(true);
    fetch(`/api/analyses/${leftId}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setLeftDetail(j.data); })
      .finally(() => setLoadingLeft(false));
  }, [leftId]);

  // Fetch right detail
  useEffect(() => {
    if (!rightId) { setRightDetail(null); return; }
    setLoadingRight(true);
    fetch(`/api/analyses/${rightId}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setRightDetail(j.data); })
      .finally(() => setLoadingRight(false));
  }, [rightId]);

  // Recompute diff whenever both sides are loaded
  useEffect(() => {
    if (!leftDetail?.resumeText || !rightDetail?.resumeText) {
      setTokens([]);
      return;
    }
    const raw = wordDiff(leftDetail.resumeText, rightDetail.resumeText);
    setTokens(mergeTokens(raw));
  }, [leftDetail, rightDetail]);

  if (!isOpen) return null;

  const leftSnap = analyses.find((a) => a.id === leftId);
  const rightSnap = analyses.find((a) => a.id === rightId);
  const hasDiff = tokens.length > 0;
  const changeCount = tokens.filter((t) => t.type !== "equal").length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(6px)",
          zIndex: 9000,
          animation: "rdvFadeIn 0.15s ease",
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Resume diff viewer"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(1100px, calc(100vw - 32px))",
          height: "min(88vh, 820px)",
          background: "var(--paper-card)",
          border: "1px solid var(--accent-border)",
          borderRadius: 20,
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5), 0 0 60px -20px var(--brand-glow)",
          zIndex: 9001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "rdvSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)",
          fontFamily: "Instrument Sans, system-ui, sans-serif",
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes rdvFadeIn  { from { opacity:0 } to { opacity:1 } }
          @keyframes rdvSlideUp {
            from { opacity:0; transform:translate(-50%,-46%) scale(0.95); }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1);    }
          }
        `}} />

        {/* ── Header ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "var(--accent-bg)",
                border: "1px solid var(--accent-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ArrowLeftRight size={16} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Resume Diff Viewer</div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                Compare two analyses word-by-word
              </div>
            </div>
          </div>

          {hasDiff && (
            <div
              style={{
                fontSize: 11, fontFamily: "DM Mono, monospace",
                background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                borderRadius: 8, padding: "4px 10px", color: "var(--accent)",
              }}
            >
              {changeCount} changed token{changeCount !== 1 ? "s" : ""}
            </div>
          )}

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              lineHeight: 1, padding: "4px 6px", borderRadius: 6,
              color: "var(--ink-faint)", transition: "color 0.15s",
              marginLeft: "auto",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Selectors ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            background: "var(--paper-warm)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
            <span
              style={{
                fontSize: 10, fontFamily: "DM Mono, monospace", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "#ef4444", flexShrink: 0,
              }}
            >
              Before
            </span>
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 9,
                border: "1px solid var(--border)", background: "var(--paper-card)",
                color: "var(--ink)", fontSize: 12, cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">— Choose analysis —</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === rightId}>
                  {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {a.target_role ? ` · ${a.target_role}` : ""}
                  {a.score !== null ? ` · ${a.score}pts` : ""}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight size={18} color="var(--ink-faint)" />

          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
            <span
              style={{
                fontSize: 10, fontFamily: "DM Mono, monospace", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "#10b981", flexShrink: 0,
              }}
            >
              After
            </span>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 9,
                border: "1px solid var(--border)", background: "var(--paper-card)",
                color: "var(--ink)", fontSize: 12, cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">— Choose analysis —</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === leftId}>
                  {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {a.target_role ? ` · ${a.target_role}` : ""}
                  {a.score !== null ? ` · ${a.score}pts` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        {!leftId || !rightId ? (
          <div
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              color: "var(--ink-faint)",
            }}
          >
            <div style={{ fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-faint)" }}>
              <ArrowLeftRight size={36} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-muted)" }}>
              Select two analyses to compare
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              Choose a &quot;Before&quot; and an &quot;After&quot; analysis from the dropdowns above
            </div>
          </div>
        ) : loadingLeft || loadingRight ? (
          <div
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ink-faint)", gap: 10, fontSize: 13,
            }}
          >
            <span style={{ animation: "spin 1s linear infinite", display: "inline-flex" }}>
              <Loader2 size={15} />
            </span>
            Computing diff…
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
            {/* LEFT pane */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
              {leftSnap && (
                <PanelHeader
                  label="Before"
                  score={leftDetail?.score ?? leftSnap.score}
                  date={leftSnap.created_at}
                  role={leftDetail?.targetRole ?? leftSnap.target_role}
                  side="left"
                />
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
                {hasDiff
                  ? <DiffContent tokens={tokens} side="left" />
                  : <pre style={{ fontFamily: "DM Mono, monospace", fontSize: 12.5, lineHeight: 1.9, whiteSpace: "pre-wrap", color: "var(--ink)" }}>{leftDetail?.resumeText}</pre>
                }
              </div>
            </div>

            {/* Score delta column */}
            {hasDiff && (
              <div
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "0 4px",
                  background: "var(--paper-warm)", borderRight: "1px solid var(--border)",
                  flexShrink: 0,
                }}
              >
                <ScoreDelta
                  from={leftDetail?.score ?? leftSnap?.score ?? null}
                  to={rightDetail?.score ?? rightSnap?.score ?? null}
                />
              </div>
            )}

            {/* RIGHT pane */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {rightSnap && (
                <PanelHeader
                  label="After"
                  score={rightDetail?.score ?? rightSnap.score}
                  date={rightSnap.created_at}
                  role={rightDetail?.targetRole ?? rightSnap.target_role}
                  side="right"
                />
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
                {hasDiff
                  ? <DiffContent tokens={tokens} side="right" />
                  : <pre style={{ fontFamily: "DM Mono, monospace", fontSize: 12.5, lineHeight: 1.9, whiteSpace: "pre-wrap", color: "var(--ink)" }}>{rightDetail?.resumeText}</pre>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────── */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--paper-warm)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <DiffLegend />
          <button
            onClick={onClose}
            style={{
              padding: "6px 16px", borderRadius: 9,
              border: "1px solid var(--border)", background: "var(--paper-card)",
              color: "var(--ink-muted)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-muted)"; }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
