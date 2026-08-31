"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Wand2,
  Copy,
  Check,
  Download,
  BookMarked,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  Loader2,
  Sparkles,
  FileText,
} from "lucide-react";
import type { AnalysisResult, ResumeStyleTokens } from "@/types";
import type { ChangeRecord } from "@/lib/ai/fixResume";
import type { StructuredResume } from "@/types/structuredResume";
import { DEFAULT_STYLE_TOKENS } from "@/lib/resumeStyleDefaults";

// ─── Word-level diff (same LCS approach as ResumeDiffViewer) ──
type DiffToken =
  | { type: "equal"; text: string }
  | { type: "insert"; text: string }
  | { type: "delete"; text: string };

function wordDiff(a: string, b: string): DiffToken[] {
  const wa = a.match(/\S+|\s+/g) ?? [];
  const wb = b.match(/\S+|\s+/g) ?? [];
  const m = wa.length,
    n = wb.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = wa[i] === wb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const tokens: DiffToken[] = [];
  let i = 0,
    j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && wa[i] === wb[j]) {
      tokens.push({ type: "equal", text: wa[i] });
      i++;
      j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      tokens.push({ type: "insert", text: wb[j] });
      j++;
    } else {
      tokens.push({ type: "delete", text: wa[i] });
      i++;
    }
  }
  // Merge consecutive same-type tokens
  return tokens.reduce<DiffToken[]>((out, t) => {
    const last = out[out.length - 1];
    if (last && last.type === t.type) {
      last.text += t.text;
      return out;
    }
    return [...out, { ...t }];
  }, []);
}

// ─── Template definitions ─────────────────────────────────────
const TEMPLATES = [
  {
    id: "same-format",
    label: "Same Format",
    icon: "🔄",
    desc: "PDF preserving your original layout",
  },
  { id: "professional", label: "Professional", icon: "💼", desc: "Classic corporate style" },
  { id: "modern", label: "Modern", icon: "⚡", desc: "Clean tech/startup look" },
  { id: "minimal", label: "Minimal", icon: "◽", desc: "Elegant & understated" },
  { id: "creative", label: "Creative", icon: "🎨", desc: "Bold & distinctive" },
  { id: "executive", label: "Executive", icon: "🏆", desc: "Senior leadership format" },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

// ─── Props ─────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  analysis: AnalysisResult;
  targetRole?: string;
  jobDescription?: string;
  analysisId?: string;
  resumeStyleTokens?: ResumeStyleTokens;
}

// ─── Change type badge ─────────────────────────────────────────
function ChangeBadge({ type }: { type: ChangeRecord["type"] }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    rewrite: { color: "#6366f1", bg: "rgba(99,102,241,0.12)", label: "Rewrite" },
    keyword: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Keyword" },
    weakness: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Weakness" },
    impact: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Impact" },
    structure: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Structure" },
  };
  const config = map[type] ?? { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: type };
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "DM Mono, monospace",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: config.color,
        background: config.bg,
        borderRadius: 5,
        padding: "2px 7px",
      }}
    >
      {config.label}
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function FixedResumeModal({
  isOpen,
  onClose,
  resumeText,
  analysis,
  targetRole,
  jobDescription,
  analysisId,
  resumeStyleTokens = DEFAULT_STYLE_TOKENS,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [correctedText, setCorrectedText] = useState<string>("");
  const [changes, setChanges] = useState<ChangeRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("same-format");
  const [showDiff, setShowDiff] = useState(true);
  const [changesExpanded, setChangesExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [structuredResume, setStructuredResume] = useState<StructuredResume | undefined>(undefined);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const hasFetched = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "loading") {
      setLoadingStepIndex(0);
      timer = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < 4 ? prev + 1 : prev));
      }, 2200);
    }
    return () => clearInterval(timer);
  }, [phase]);

  // Auto-trigger on open
  const runFix = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch("/api/fix-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, analysis, targetRole, jobDescription }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Fix failed");
      setCorrectedText(json.data.correctedText);
      setChanges(json.data.changesApplied || []);
      if (json.data.structuredResume) setStructuredResume(json.data.structuredResume);
      setPhase("done");
    } catch (err: unknown) {
      setError((err as Error).message || "Something went wrong");
      setPhase("error");
      hasFetched.current = false;
    }
  }, [resumeText, analysis, targetRole, jobDescription]);

  useEffect(() => {
    if (isOpen && phase === "idle") runFix();
  }, [isOpen, phase, runFix]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setPhase("idle");
      setCorrectedText("");
      setChanges([]);
      setError(null);
      hasFetched.current = false;
      setSaved(false);
      setCopied(false);
      setStructuredResume(undefined);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { downloadFixedResumePdf } = await import("@/lib/pdf/downloadPdf");
      await downloadFixedResumePdf(
        selectedTemplate,
        correctedText,
        targetRole,
        resumeStyleTokens,
        structuredResume
      );
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${targetRole || "Resume"} — AI Fixed`,
          resumeText: correctedText,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription || undefined,
          lastScore: analysis.score,
        }),
      });
      const json = await res.json();
      if (json.success) setSaved(true);
    } catch {
      // silent fail
    } finally {
      setIsSaving(false);
    }
  };

  const diffTokens = phase === "done" && showDiff ? wordDiff(resumeText, correctedText) : [];

  const insertCount = diffTokens.filter((t) => t.type === "insert").length;
  const deleteCount = diffTokens.filter((t) => t.type === "delete").length;

  if (!isOpen || !mounted) return null;

  const modal = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div
        role="dialog"
        aria-label="AI Fixed Resume"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-h-[92vh] rounded-2xl overflow-hidden border border-border/70"
        style={{
          maxWidth: 1200,
          background: "var(--paper-card)",
          boxShadow: "0 30px 70px -15px rgba(0,0,0,0.6), 0 0 60px -10px var(--brand-glow)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}
          >
            <Wand2 size={17} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              ✨ AI-Fixed Resume
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
              {phase === "loading" && "Applying all analysis fixes…"}
              {phase === "done" &&
                `${changes.length} improvements applied${targetRole ? ` for ${targetRole}` : ""}`}
              {phase === "error" && "Fix failed — see error below"}
              {phase === "idle" && "Preparing…"}
            </div>
          </div>

          {phase === "done" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "DM Mono, monospace",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 7,
                  padding: "3px 9px",
                  color: "#10b981",
                }}
              >
                +{insertCount} added
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "DM Mono, monospace",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 7,
                  padding: "3px 9px",
                  color: "#ef4444",
                }}
              >
                −{deleteCount} removed
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: 8,
              color: "var(--ink-faint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--paper-warm)";
              e.currentTarget.style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--ink-faint)";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Template Picker ─────────────────────────────────── */}
        {phase === "done" && (
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "10px 20px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
              background: "var(--paper-warm)",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                title={tpl.desc}
                style={{
                  padding: "5px 12px",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.15s",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  border:
                    selectedTemplate === tpl.id
                      ? "1.5px solid var(--accent)"
                      : "1.5px solid var(--border)",
                  background:
                    selectedTemplate === tpl.id ? "var(--accent-bg)" : "var(--paper-card)",
                  color: selectedTemplate === tpl.id ? "var(--accent)" : "var(--ink-muted)",
                }}
              >
                {tpl.icon} {tpl.label}
              </button>
            ))}

            <div style={{ flex: 1 }} />

            {/* Diff toggle */}
            <button
              onClick={() => setShowDiff((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 9,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                border: "1.5px solid var(--border)",
                background: showDiff ? "var(--accent-bg)" : "var(--paper-card)",
                color: showDiff ? "var(--accent)" : "var(--ink-muted)",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              <ArrowLeftRight size={13} />
              {showDiff ? "Diff on" : "Diff off"}
            </button>
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Loading state */}
          {phase === "loading" && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
              {/* Central Glowing AI Pulse Core */}
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-accent-bg border border-accent-border flex items-center justify-center shadow-lg shadow-accent/10 backdrop-blur-sm animate-pulse">
                  <Wand2 size={32} className="text-accent animate-bounce" />
                </div>
                <div className="absolute -inset-2 rounded-[28px] border-2 border-accent/20 border-t-accent animate-spin" />
              </div>

              {/* Title & Subtitle */}
              <div className="text-center space-y-2 max-w-sm">
                <h3 className="text-xl font-bold font-display text-ink">
                  Synthesizing Flawless Resume
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Rewriting weak bullet points, embedding high-priority keywords, and formatting ATS
                  structure...
                </p>
              </div>

              {/* Shimmering Progress Bar */}
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className="text-ink-muted">Optimization Progress</span>
                  <span className="text-accent font-bold">
                    {Math.min(95, (loadingStepIndex + 1) * 20)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-paper-warm overflow-hidden border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${Math.min(95, (loadingStepIndex + 1) * 20)}%` }}
                  />
                </div>
              </div>

              {/* 5-Step Pipeline Progress Cards */}
              <div className="w-full space-y-2">
                {[
                  "Auditing every bullet for metric quantification & action verbs",
                  "Rewriting weak statements using Google XYZ formula",
                  "Naturally weaving high-weight ATS keyword clusters",
                  "Synthesizing recruiter-focused executive summary",
                  "Calibrating visual typography & ATS column hierarchy",
                ].map((step, idx) => {
                  const isDone = idx < loadingStepIndex;
                  const isActive = idx === loadingStepIndex;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 px-3.5 rounded-xl border text-xs flex items-center justify-between transition-all duration-300 ${
                        isDone
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                          : isActive
                            ? "border-indigo-500/40 bg-indigo-500/10 text-ink font-semibold shadow-xs ring-1 ring-indigo-500/20"
                            : "border-border/50 bg-paper-warm/20 text-ink-faint opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isDone ? (
                          <Check size={14} className="text-emerald-500 shrink-0" />
                        ) : isActive ? (
                          <Loader2 size={14} className="text-indigo-500 animate-spin shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-ink-faint shrink-0 ml-1 mr-0.5" />
                        )}
                        <span className="truncate">{step}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold shrink-0 ml-2">
                        {isDone ? "PASS" : isActive ? "IN PROGRESS" : "QUEUED"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Engine Spec Footer */}
              <div className="px-3 py-1.5 rounded-full bg-paper-warm border border-border text-[10px] font-mono text-ink-muted flex items-center gap-2">
                <Sparkles size={11} className="text-indigo-500" />
                <span>Multi-LLM Fallback Engine: Gemini 3.5 ➔ Claude 3.5 Haiku</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {phase === "error" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 32,
              }}
            >
              <div style={{ fontSize: 13, color: "#ef4444", textAlign: "center", maxWidth: 400 }}>
                {error}
              </div>
              <button
                onClick={() => {
                  setPhase("idle");
                  hasFetched.current = false;
                  runFix();
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: 9,
                  cursor: "pointer",
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Done state — split pane */}
          {phase === "done" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
              {/* LEFT — original */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  borderRight: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px",
                    borderBottom: "1px solid var(--border)",
                    flexShrink: 0,
                    background: "rgba(239,68,68,0.04)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FileText size={13} color="#ef4444" />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#ef4444",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Original
                  </span>
                </div>
                <div
                  style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 18px" }}
                >
                  {showDiff ? (
                    <pre
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 12,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                      }}
                    >
                      {diffTokens.map((t, i) => {
                        if (t.type === "equal")
                          return (
                            <span key={i} style={{ color: "var(--ink)" }}>
                              {t.text}
                            </span>
                          );
                        if (t.type === "delete")
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
                        return (
                          <span key={i} style={{ opacity: 0.2, color: "var(--ink)" }}>
                            {t.text}
                          </span>
                        );
                      })}
                    </pre>
                  ) : (
                    <pre
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 12,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        color: "var(--ink)",
                      }}
                    >
                      {resumeText}
                    </pre>
                  )}
                </div>
              </div>

              {/* RIGHT — fixed */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px",
                    borderBottom: "1px solid var(--border)",
                    flexShrink: 0,
                    background: "rgba(16,185,129,0.04)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Sparkles size={13} color="#10b981" />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#10b981",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    AI Fixed
                  </span>
                </div>
                <div
                  style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 18px" }}
                >
                  {showDiff ? (
                    <pre
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 12,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                      }}
                    >
                      {diffTokens.map((t, i) => {
                        if (t.type === "equal")
                          return (
                            <span key={i} style={{ color: "var(--ink)" }}>
                              {t.text}
                            </span>
                          );
                        if (t.type === "insert")
                          return (
                            <mark
                              key={i}
                              style={{
                                background: "rgba(16,185,129,0.18)",
                                color: "#10b981",
                                borderRadius: 3,
                                padding: "0 1px",
                              }}
                            >
                              {t.text}
                            </mark>
                          );
                        return (
                          <span key={i} style={{ opacity: 0.2, color: "var(--ink)" }}>
                            {t.text}
                          </span>
                        );
                      })}
                    </pre>
                  ) : (
                    <pre
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 12,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        color: "var(--ink)",
                      }}
                    >
                      {correctedText}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Changes Log ────────────────────────────────────── */}
        {phase === "done" && changes.length > 0 && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
              background: "var(--paper-warm)",
              maxHeight: changesExpanded ? 180 : 0,
              overflow: "hidden",
              transition: "max-height 0.25s ease",
            }}
          >
            <button
              onClick={() => setChangesExpanded((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 20px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom: changesExpanded ? "1px solid var(--border)" : "none",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--ink-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                {changes.length} Changes Applied
              </span>
              {changesExpanded ? (
                <ChevronDown size={14} color="var(--ink-faint)" />
              ) : (
                <ChevronUp size={14} color="var(--ink-faint)" />
              )}
            </button>
            {changesExpanded && (
              <div
                style={{
                  padding: "8px 20px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  overflowY: "auto",
                  maxHeight: 130,
                }}
              >
                {changes.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 12,
                      color: "var(--ink-muted)",
                    }}
                  >
                    <ChangeBadge type={c.type} />
                    <span style={{ lineHeight: 1.5 }}>
                      {c.section ? `[${c.section}] ` : ""}
                      {c.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Footer / Actions ────────────────────────────────── */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--paper-warm)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {/* Legend */}
          {phase === "done" && showDiff && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 160 }}>
              <mark
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                  borderRadius: 3,
                  padding: "0 6px",
                  fontSize: 10,
                  textDecoration: "line-through",
                }}
              >
                removed
              </mark>
              <mark
                style={{
                  background: "rgba(16,185,129,0.18)",
                  color: "#10b981",
                  borderRadius: 3,
                  padding: "0 6px",
                  fontSize: 10,
                }}
              >
                added
              </mark>
            </div>
          )}

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Copy */}
            {phase === "done" && (
              <button
                onClick={handleCopy}
                disabled={copied}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 9,
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                  background: "var(--paper-card)",
                  color: copied ? "#10b981" : "var(--ink-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}

            {/* Save to Library */}
            {phase === "done" && (
              <button
                onClick={handleSave}
                disabled={isSaving || saved}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 9,
                  cursor: saved ? "default" : "pointer",
                  border: "1px solid var(--border)",
                  background: "var(--paper-card)",
                  color: saved ? "#10b981" : "var(--ink-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {isSaving ? (
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <BookMarked size={13} />
                )}
                {saved ? "Saved!" : isSaving ? "Saving…" : "Save to Library"}
              </button>
            )}

            {/* Download */}
            {phase === "done" && (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  borderRadius: 9,
                  cursor: "pointer",
                  border: "none",
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
                  transition: "all 0.15s",
                  opacity: isDownloading ? 0.7 : 1,
                }}
              >
                {isDownloading ? (
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Download size={13} />
                )}
                {isDownloading
                  ? "Generating…"
                  : `Download ${TEMPLATES.find((t) => t.id === selectedTemplate)?.label}`}
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                padding: "7px 14px",
                borderRadius: 9,
                cursor: "pointer",
                border: "1px solid var(--border)",
                background: "var(--paper-card)",
                color: "var(--ink-muted)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Keyframe styles */}
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
