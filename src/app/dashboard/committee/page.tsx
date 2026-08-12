"use client";
import { logger } from "@/lib/logger";
import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  ChevronRight,
  Loader2,
  RefreshCcw,
  ClipboardList,
  ArrowLeft,
  Trophy,
  Sparkles,
  Eye,
  Briefcase,
  Target,
  TrendingUp,
  MessageSquare,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RedFlag {
  issue: string;
  severity: "high" | "medium" | "low";
  detail: string;
}
interface GreenFlag {
  strength: string;
  detail: string;
}
interface QuickWin {
  action: string;
  impact: string;
  effort: "easy" | "medium" | "hard";
}

interface RecruiterReview {
  callbackScore: number;
  callbackVerdict: string;
  firstImpression: string;
  recruiterThought: string;
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  interviewQuestions: string[];
  quickWins: QuickWin[];
  hiringDecision: string;
  standoutFactor: string | null;
}

interface ResumeItem {
  id: string;
  name: string;
  target_role: string | null;
  resume_text: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 75)
    return {
      ring: "#10b981",
      glow: "rgba(16,185,129,0.35)",
      bg: "rgba(16,185,129,0.08)",
      text: "#059669",
      light: "#f0fdf4",
    };
  if (score >= 50)
    return {
      ring: "#f59e0b",
      glow: "rgba(245,158,11,0.35)",
      bg: "rgba(245,158,11,0.08)",
      text: "#b45309",
      light: "#fffbeb",
    };
  if (score >= 30)
    return {
      ring: "#f97316",
      glow: "rgba(249,115,22,0.35)",
      bg: "rgba(249,115,22,0.08)",
      text: "#c2410c",
      light: "#fff7ed",
    };
  return {
    ring: "#ef4444",
    glow: "rgba(239,68,68,0.35)",
    bg: "rgba(239,68,68,0.08)",
    text: "#dc2626",
    light: "#fef2f2",
  };
}

const SEV = {
  high: {
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.2)",
    text: "#dc2626",
    label: "High",
    dot: "#ef4444",
  },
  medium: {
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.2)",
    text: "#b45309",
    label: "Medium",
    dot: "#f59e0b",
  },
  low: {
    bg: "rgba(16,185,129,0.06)",
    border: "rgba(16,185,129,0.18)",
    text: "#16a34a",
    label: "Low",
    dot: "#10b981",
  },
};

const EFFORT = {
  easy: { bg: "rgba(16,185,129,0.1)", text: "#059669", label: "Easy win" },
  medium: { bg: "rgba(245,158,11,0.1)", text: "#b45309", label: "Some effort" },
  hard: { bg: "rgba(239,68,68,0.1)", text: "#dc2626", label: "Takes work" },
};

const DECISION_CONFIG: Record<string, { gradient: string; icon: React.ReactNode; badge: string }> =
  {
    "Strong hire": {
      gradient: "linear-gradient(135deg,#10b981,#059669)",
      icon: <Star size={13} />,
      badge: "🏆",
    },
    "Pass to interview": {
      gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
      icon: <CheckCircle2 size={13} />,
      badge: "✅",
    },
    "Maybe — needs review": {
      gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
      icon: <HelpCircle size={13} />,
      badge: "🤔",
    },
    "Reject — not qualified": {
      gradient: "linear-gradient(135deg,#ef4444,#dc2626)",
      icon: <AlertTriangle size={13} />,
      badge: "❌",
    },
  };

// ── Premium Score Ring ─────────────────────────────────────────────────────────
function CallbackRing({ score }: { score: number }) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const c = scoreColor(score);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* Pulsing outer glow ring */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", position: "relative", zIndex: 1 }}
      >
        {/* Outer decorative ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 6}
          stroke={c.ring}
          strokeWidth={0.5}
          fill="none"
          opacity={0.15}
          strokeDasharray="4 6"
        />
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#scoreGrad-${score})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
        <defs>
          <linearGradient id={`scoreGrad-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c.ring} />
            <stop offset="100%" stopColor={c.ring} stopOpacity={0.7} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 240, damping: 18 }}
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: c.text,
              fontFamily: "DM Mono, monospace",
              lineHeight: 1,
            }}
          >
            {score}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: "var(--ink-faint)",
              fontFamily: "DM Mono, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginTop: 2,
            }}
          >
            / 100
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Metric Chip ───────────────────────────────────────────────────────────────
function MetricChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 14px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        minWidth: 64,
        gap: 3,
      }}
    >
      <span style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "DM Mono, monospace" }}>
        {value}
      </span>
      <span
        style={{
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "DM Mono, monospace",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Feature Highlight ────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(99,102,241,0.15)" }}
      style={{
        padding: "16px",
        borderRadius: 12,
        border: "1px solid rgba(99,102,241,0.15)",
        background: "rgba(99,102,241,0.04)",
        cursor: "default",
        transition: "background 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
            border: "1px solid rgba(99,102,241,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "Instrument Sans, sans-serif",
          }}
        >
          {title}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 11.5,
          color: "var(--ink-muted)",
          fontFamily: "Instrument Sans, sans-serif",
          lineHeight: 1.5,
          paddingLeft: 40,
        }}
      >
        {desc}
      </p>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RecruiterSandboxPage() {
  const { error: toastError } = useToast();

  const [mounted, setMounted] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [manualText, setManualText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [inputMode, setInputMode] = useState<"library" | "paste">("library");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<RecruiterReview | null>(null);
  const [activeSection, setActiveSection] = useState("impression");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchResumes();
  }, []);

  async function fetchResumes() {
    try {
      const res = await fetch("/api/resumes");
      const data = await res.json();
      if (res.ok && data.success) setResumes(data.data || []);
    } catch (err) {
      logger.error("Failed to load resumes", err);
    } finally {
      setLoadingResumes(false);
    }
  }

  const resumeText =
    inputMode === "library"
      ? (resumes.find((r) => r.id === selectedId)?.resume_text ?? "")
      : manualText;

  const canRun = resumeText.trim().length >= 50;

  async function handleRun() {
    if (!canRun) return;
    setLoading(true);
    setReview(null);
    try {
      const res = await fetch("/api/recruiter-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription || undefined,
          targetRole: targetRole || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Review failed.");
      setReview(data.data);
      setActiveSection("impression");
      setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100
      );
    } catch (err: unknown) {
      toastError((err as Error).message || "Failed to run recruiter review.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  const c = review ? scoreColor(review.callbackScore) : scoreColor(0);
  const dec = review
    ? (DECISION_CONFIG[review.hiringDecision] ?? DECISION_CONFIG["Maybe — needs review"])
    : null;

  const SECTIONS = [
    { id: "impression", label: "Impression", icon: <Eye size={12} /> },
    { id: "flags", label: "Flags", icon: <AlertTriangle size={12} /> },
    { id: "questions", label: "Interview Qs", icon: <MessageSquare size={12} /> },
    { id: "quickwins", label: "Quick Wins", icon: <Zap size={12} /> },
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* ══════════════════════════════════════════
            HERO HEADER — dark glass with mesh gradient
        ══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          style={{
            borderRadius: 22,
            background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #24243e 100%)",
            padding: "36px 36px 32px",
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)",
          }}
        >
          {/* Mesh gradient orbs */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -40,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -80,
              left: 80,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Grid overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.03,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                flexShrink: 0,
                background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))",
                border: "1px solid rgba(99,102,241,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(99,102,241,0.2)",
              }}
            >
              <Users size={26} color="#a5b4fc" />
            </div>

            <div style={{ flex: 1 }}>
              {/* Label */}
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "DM Mono, monospace",
                  color: "#818cf8",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#818cf8",
                    display: "inline-block",
                  }}
                />
                AI Recruiter Simulation
              </div>
              <h1
                style={{
                  fontFamily: "DM Serif Display, Georgia, serif",
                  fontSize: "clamp(22px, 3vw, 32px)",
                  fontWeight: 700,
                  color: "white",
                  margin: "0 0 8px",
                  letterSpacing: "-0.5px",
                  lineHeight: 1.1,
                }}
              >
                Recruiter Sandbox
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "Instrument Sans, sans-serif",
                  maxWidth: 480,
                  lineHeight: 1.5,
                }}
              >
                See your resume exactly as a recruiter sees it — the gut reaction, the red flags,
                and the honest probability of getting a callback.
              </p>
            </div>

            {/* Feature pills */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 6, alignSelf: "center" }}
              className="hidden sm:flex"
            >
              {[
                { icon: "⚡", label: "6-second impression" },
                { icon: "🎯", label: "Callback probability" },
                { icon: "💬", label: "5 interview questions" },
              ].map((pill) => (
                <div
                  key={pill.label}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 11.5,
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "Instrument Sans, sans-serif",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{pill.icon}</span>
                  {pill.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 20,
            alignItems: "start",
          }}
          className="grid-cols-1 sm:grid-cols-[320px_1fr]"
        >
          {/* ─── LEFT: Setup Panel ─────────────────── */}
          <motion.div
            layout
            style={{
              background: "var(--paper-card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              overflow: "hidden",
              position: "sticky",
              top: 20,
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 20px",
                background: "linear-gradient(135deg, var(--paper-warm), var(--paper-card))",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
                  border: "1px solid rgba(99,102,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Briefcase size={13} color="#6366f1" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: "var(--ink)",
                    fontFamily: "Instrument Sans, sans-serif",
                  }}
                >
                  Configure Review
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    fontFamily: "Instrument Sans, sans-serif",
                  }}
                >
                  Set up your recruiter simulation
                </div>
              </div>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Source toggle */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Resume Source
                </div>
                <div
                  style={{
                    display: "flex",
                    background: "var(--paper-warm)",
                    borderRadius: 10,
                    padding: 3,
                    border: "1px solid var(--border)",
                  }}
                >
                  {(["library", "paste"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setInputMode(mode)}
                      style={{
                        flex: 1,
                        padding: "7px 12px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 700,
                        fontFamily: "Instrument Sans, sans-serif",
                        background: inputMode === mode ? "var(--paper-card)" : "transparent",
                        color: inputMode === mode ? "#6366f1" : "var(--ink-muted)",
                        boxShadow: inputMode === mode ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {mode === "library" ? "📁 Library" : "✏️ Paste"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resume input */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {inputMode === "library" ? "Select Resume" : "Resume Text"}
                </div>
                {inputMode === "library" ? (
                  loadingResumes ? (
                    <div style={{ padding: 12, textAlign: "center", color: "var(--ink-faint)" }}>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    </div>
                  ) : resumes.length === 0 ? (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--ink-muted)",
                        padding: "12px",
                        textAlign: "center",
                        border: "1.5px dashed var(--border)",
                        borderRadius: 9,
                        fontFamily: "Instrument Sans, sans-serif",
                      }}
                    >
                      No saved resumes — switch to Paste mode
                    </div>
                  ) : (
                    <select
                      value={selectedId}
                      onChange={(e) => {
                        setSelectedId(e.target.value);
                        const r = resumes.find((r) => r.id === e.target.value);
                        if (r?.target_role) setTargetRole(r.target_role);
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 9,
                        border: `1.5px solid ${selectedId ? "#6366f1" : "var(--border)"}`,
                        background: "var(--paper-card)",
                        color: "var(--ink)",
                        fontSize: 12,
                        fontFamily: "Instrument Sans, sans-serif",
                        cursor: "pointer",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxShadow: selectedId ? "0 0 0 3px rgba(99,102,241,0.08)" : "none",
                      }}
                    >
                      <option value="">— Choose a resume —</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                          {r.target_role ? ` · ${r.target_role}` : ""}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Paste your full resume text here..."
                    rows={7}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 9,
                      boxSizing: "border-box",
                      border: `1.5px solid ${manualText.length > 50 ? "#6366f1" : "var(--border)"}`,
                      background: "var(--paper-card)",
                      color: "var(--ink)",
                      fontSize: 11.5,
                      fontFamily: "Instrument Sans, sans-serif",
                      resize: "vertical",
                      outline: "none",
                      lineHeight: 1.6,
                      transition: "border-color 0.2s",
                    }}
                  />
                )}
              </div>

              {/* Target Role */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Target Role{" "}
                  <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 9 }}>optional</span>
                </div>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Product Manager"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 9,
                    boxSizing: "border-box",
                    border: "1.5px solid var(--border)",
                    background: "var(--paper-card)",
                    color: "var(--ink)",
                    fontSize: 12,
                    fontFamily: "Instrument Sans, sans-serif",
                    outline: "none",
                  }}
                />
              </div>

              {/* Job Description */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Job Description{" "}
                  <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 9 }}>
                    optional but recommended
                  </span>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job posting for a more accurate review..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 9,
                    boxSizing: "border-box",
                    border: `1.5px solid ${jobDescription ? "#6366f1" : "var(--border)"}`,
                    background: "var(--paper-card)",
                    color: "var(--ink)",
                    fontSize: 11.5,
                    fontFamily: "Instrument Sans, sans-serif",
                    resize: "vertical",
                    outline: "none",
                    lineHeight: 1.6,
                    transition: "border-color 0.2s",
                  }}
                />
                {jobDescription && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <CheckCircle2 size={11} color="#10b981" />
                    <span
                      style={{
                        fontSize: 10,
                        color: "#059669",
                        fontFamily: "Instrument Sans, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      JD added — review accuracy boosted
                    </span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <motion.button
                onClick={handleRun}
                disabled={!canRun || loading}
                whileHover={
                  canRun && !loading
                    ? { scale: 1.02, boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }
                    : {}
                }
                whileTap={canRun && !loading ? { scale: 0.98 } : {}}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    canRun && !loading
                      ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%)"
                      : "var(--border)",
                  color: canRun && !loading ? "white" : "var(--ink-faint)",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: canRun && !loading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "Instrument Sans, sans-serif",
                  boxShadow:
                    canRun && !loading
                      ? "0 4px 16px rgba(99,102,241,0.35), 0 1px 0 rgba(255,255,255,0.12) inset"
                      : "none",
                  transition: "all 0.2s",
                  letterSpacing: "-0.01em",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Simulating recruiter...</span>
                  </>
                ) : review ? (
                  <>
                    <RefreshCcw size={14} />
                    <span>Re-run Review</span>
                  </>
                ) : (
                  <>
                    <Users size={14} />
                    <span>Run Recruiter Review</span>
                  </>
                )}
              </motion.button>

              {!canRun && (
                <p
                  style={{
                    fontSize: 10.5,
                    color: "var(--ink-faint)",
                    textAlign: "center",
                    margin: 0,
                    fontFamily: "Instrument Sans, sans-serif",
                  }}
                >
                  {inputMode === "library"
                    ? "Select a saved resume above"
                    : "Paste at least 50 characters"}
                </p>
              )}
            </div>
          </motion.div>

          {/* ─── RIGHT: Results / Empty ─────────────── */}
          <div ref={resultsRef}>
            <AnimatePresence mode="wait">
              {/* Loading state */}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: "var(--paper-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    padding: "48px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 20,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Spinning avatar */}
                  <div style={{ position: "relative", width: 72, height: 72 }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        border: "2px solid transparent",
                        borderTopColor: "#6366f1",
                        borderRightColor: "#a855f7",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 8,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
                        border: "1px solid rgba(99,102,241,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={22} color="#818cf8" />
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "var(--ink)",
                        fontFamily: "Instrument Sans, sans-serif",
                      }}
                    >
                      Recruiter is reviewing your resume...
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-muted)",
                        marginTop: 6,
                        fontFamily: "Instrument Sans, sans-serif",
                      }}
                    >
                      Simulating 15 years of hiring instinct
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      width: "100%",
                      maxWidth: 340,
                    }}
                  >
                    {[
                      "Scanning layout and formatting...",
                      "Identifying red and green flags...",
                      "Calculating callback probability...",
                      "Writing honest recruiter feedback...",
                    ].map((step, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.6 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 14px",
                          borderRadius: 8,
                          background: "var(--paper-warm)",
                          border: "1px solid var(--border)",
                          fontSize: 11.5,
                          color: "var(--ink-muted)",
                          fontFamily: "Instrument Sans, sans-serif",
                        }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#6366f1",
                            flexShrink: 0,
                          }}
                        />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {review && !loading && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {/* ── Score Hero ── */}
                  <div
                    style={{
                      borderRadius: 18,
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 60%, #24243e 100%)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
                      position: "relative",
                    }}
                  >
                    {/* Color top bar */}
                    <div
                      style={{
                        height: 3,
                        background: `linear-gradient(90deg, ${c.ring}, ${c.glow.replace("0.35", "0.8")})`,
                      }}
                    />

                    {/* Orb */}
                    <div
                      style={{
                        position: "absolute",
                        top: -40,
                        right: -20,
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${c.glow} 0%, transparent 65%)`,
                        pointerEvents: "none",
                      }}
                    />

                    <div
                      style={{
                        padding: "28px",
                        display: "flex",
                        gap: 28,
                        alignItems: "center",
                        flexWrap: "wrap",
                        position: "relative",
                      }}
                    >
                      <CallbackRing score={review.callbackScore} />

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Verdict + decision */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 12px 4px 8px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 800,
                              background: c.bg,
                              color: c.text,
                              border: `1px solid ${c.ring}30`,
                              fontFamily: "Instrument Sans, sans-serif",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: c.ring,
                                boxShadow: `0 0 6px ${c.ring}`,
                                display: "inline-block",
                              }}
                            />
                            {review.callbackVerdict}
                          </span>
                          {dec && (
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 800,
                                background: dec.gradient,
                                color: "white",
                                fontFamily: "Instrument Sans, sans-serif",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                              }}
                            >
                              {dec.badge} {review.hiringDecision}
                            </span>
                          )}
                        </div>

                        {/* Recruiter thought */}
                        <div
                          style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 9.5,
                              fontFamily: "DM Mono, monospace",
                              color: "rgba(255,255,255,0.4)",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              marginBottom: 5,
                            }}
                          >
                            RECRUITER THINKS
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              color: "rgba(255,255,255,0.85)",
                              fontFamily: "Instrument Sans, sans-serif",
                              lineHeight: 1.55,
                              fontStyle: "italic",
                            }}
                          >
                            &ldquo;{review.recruiterThought}&rdquo;
                          </p>
                        </div>

                        {/* Standout */}
                        {review.standoutFactor && (
                          <div
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              background: "rgba(99,102,241,0.12)",
                              border: "1px solid rgba(99,102,241,0.25)",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 8,
                            }}
                          >
                            <Star
                              size={13}
                              color="#818cf8"
                              style={{ marginTop: 1, flexShrink: 0 }}
                            />
                            <div>
                              <div
                                style={{
                                  fontSize: 9,
                                  fontFamily: "DM Mono, monospace",
                                  color: "#818cf8",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  fontWeight: 700,
                                  marginBottom: 2,
                                }}
                              >
                                Standout Factor
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  color: "rgba(255,255,255,0.7)",
                                  fontFamily: "Instrument Sans, sans-serif",
                                  lineHeight: 1.4,
                                }}
                              >
                                {review.standoutFactor}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Metric row */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <MetricChip
                            label="Red Flags"
                            value={review.redFlags.length}
                            color="#f87171"
                          />
                          <MetricChip
                            label="Strengths"
                            value={review.greenFlags.length}
                            color="#34d399"
                          />
                          <MetricChip
                            label="Quick Wins"
                            value={review.quickWins.length}
                            color="#a5b4fc"
                          />
                          <MetricChip
                            label="Qs to Prep"
                            value={review.interviewQuestions.length}
                            color="#fbbf24"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Section nav tabs ── */}
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      padding: 5,
                      background: "var(--paper-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    {SECTIONS.map((s) => {
                      const active = activeSection === s.id;
                      return (
                        <motion.button
                          key={s.id}
                          onClick={() => setActiveSection(s.id)}
                          whileHover={!active ? { background: "var(--paper-warm)" } : {}}
                          style={{
                            flex: 1,
                            padding: "9px 8px",
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 11.5,
                            fontWeight: 800,
                            fontFamily: "Instrument Sans, sans-serif",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            background: active
                              ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                              : "transparent",
                            color: active ? "white" : "var(--ink-muted)",
                            boxShadow: active ? "0 3px 12px rgba(99,102,241,0.35)" : "none",
                            transition: "all 0.18s",
                          }}
                        >
                          {s.icon}
                          {s.label}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* ── Section Content ── */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.16 }}
                      style={{
                        background: "var(--paper-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 16,
                        padding: "22px",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* IMPRESSION */}
                      {activeSection === "impression" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Eye size={15} color="#6366f1" />
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: "var(--ink)",
                                fontFamily: "Instrument Sans, sans-serif",
                              }}
                            >
                              First Impression (6 seconds)
                            </span>
                          </div>
                          <div
                            style={{
                              padding: "18px",
                              borderRadius: 12,
                              background:
                                "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(168,85,247,0.04))",
                              border: "1px solid rgba(99,102,241,0.1)",
                              borderLeft: "3px solid #6366f1",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13.5,
                                color: "var(--ink)",
                                fontFamily: "Instrument Sans, sans-serif",
                                lineHeight: 1.75,
                              }}
                            >
                              {review.firstImpression}
                            </p>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                padding: "14px 16px",
                                borderRadius: 10,
                                background: "var(--paper-warm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 9,
                                  fontFamily: "DM Mono, monospace",
                                  color: "var(--ink-faint)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  marginBottom: 4,
                                }}
                              >
                                Issues found
                              </div>
                              <div
                                style={{
                                  fontSize: 24,
                                  fontWeight: 900,
                                  color: "#ef4444",
                                  fontFamily: "DM Mono, monospace",
                                }}
                              >
                                {review.redFlags.length}
                              </div>
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: "var(--ink-muted)",
                                  marginTop: 2,
                                  fontFamily: "Instrument Sans, sans-serif",
                                }}
                              >
                                areas to address
                              </div>
                            </div>
                            <div
                              style={{
                                padding: "14px 16px",
                                borderRadius: 10,
                                background: "var(--paper-warm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 9,
                                  fontFamily: "DM Mono, monospace",
                                  color: "var(--ink-faint)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  marginBottom: 4,
                                }}
                              >
                                Strengths
                              </div>
                              <div
                                style={{
                                  fontSize: 24,
                                  fontWeight: 900,
                                  color: "#10b981",
                                  fontFamily: "DM Mono, monospace",
                                }}
                              >
                                {review.greenFlags.length}
                              </div>
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: "var(--ink-muted)",
                                  marginTop: 2,
                                  fontFamily: "Instrument Sans, sans-serif",
                                }}
                              >
                                things that shine
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FLAGS */}
                      {activeSection === "flags" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                          {/* Red */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 10,
                              }}
                            >
                              <AlertTriangle size={14} color="#ef4444" />
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: "var(--ink)",
                                  fontFamily: "Instrument Sans, sans-serif",
                                }}
                              >
                                Red Flags
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--ink-faint)",
                                  fontFamily: "Instrument Sans, sans-serif",
                                }}
                              >
                                — issues a recruiter would note
                              </span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {review.redFlags.map((flag, i) => {
                                const s = SEV[flag.severity];
                                return (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    whileHover={{ x: 2, boxShadow: `0 4px 16px ${s.border}` }}
                                    style={{
                                      padding: "13px 16px",
                                      borderRadius: 10,
                                      background: s.bg,
                                      border: `1px solid ${s.border}`,
                                      display: "flex",
                                      gap: 12,
                                      alignItems: "flex-start",
                                      cursor: "default",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: s.dot,
                                        marginTop: 5,
                                        flexShrink: 0,
                                        boxShadow: `0 0 6px ${s.dot}`,
                                      }}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                          marginBottom: 4,
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: 12.5,
                                            fontWeight: 800,
                                            color: "var(--ink)",
                                            fontFamily: "Instrument Sans, sans-serif",
                                          }}
                                        >
                                          {flag.issue}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: 9.5,
                                            fontWeight: 800,
                                            padding: "1px 8px",
                                            borderRadius: 20,
                                            background: s.bg,
                                            color: s.text,
                                            border: `1px solid ${s.border}`,
                                            fontFamily: "DM Mono, monospace",
                                          }}
                                        >
                                          {s.label}
                                        </span>
                                      </div>
                                      <p
                                        style={{
                                          margin: 0,
                                          fontSize: 12,
                                          color: "var(--ink-muted)",
                                          fontFamily: "Instrument Sans, sans-serif",
                                          lineHeight: 1.55,
                                        }}
                                      >
                                        {flag.detail}
                                      </p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ height: 1, background: "var(--border)" }} />

                          {/* Green */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 10,
                              }}
                            >
                              <CheckCircle2 size={14} color="#10b981" />
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: "var(--ink)",
                                  fontFamily: "Instrument Sans, sans-serif",
                                }}
                              >
                                Green Flags
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--ink-faint)",
                                  fontFamily: "Instrument Sans, sans-serif",
                                }}
                              >
                                — what makes them look twice
                              </span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {review.greenFlags.map((flag, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.06 }}
                                  whileHover={{
                                    x: 2,
                                    boxShadow: "0 4px 16px rgba(16,185,129,0.15)",
                                  }}
                                  style={{
                                    padding: "13px 16px",
                                    borderRadius: 10,
                                    background: "rgba(16,185,129,0.05)",
                                    border: "1px solid rgba(16,185,129,0.18)",
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start",
                                    cursor: "default",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 7,
                                      height: 7,
                                      borderRadius: "50%",
                                      background: "#10b981",
                                      marginTop: 5,
                                      flexShrink: 0,
                                      boxShadow: "0 0 6px #10b981",
                                    }}
                                  />
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        color: "var(--ink)",
                                        fontFamily: "Instrument Sans, sans-serif",
                                        marginBottom: 4,
                                      }}
                                    >
                                      {flag.strength}
                                    </div>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: 12,
                                        color: "var(--ink-muted)",
                                        fontFamily: "Instrument Sans, sans-serif",
                                        lineHeight: 1.55,
                                      }}
                                    >
                                      {flag.detail}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* QUESTIONS */}
                      {activeSection === "questions" && (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 14,
                            }}
                          >
                            <MessageSquare size={14} color="#6366f1" />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "var(--ink)",
                                fontFamily: "Instrument Sans, sans-serif",
                              }}
                            >
                              Questions a Recruiter Would Ask
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {review.interviewQuestions.map((q, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                                whileHover={{ scale: 1.005 }}
                                style={{
                                  padding: "14px 16px",
                                  borderRadius: 10,
                                  background:
                                    expandedQ === i ? "var(--accent-bg)" : "var(--paper-warm)",
                                  border: `1px solid ${expandedQ === i ? "var(--accent-border)" : "var(--border)"}`,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                              >
                                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                  <span
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 8,
                                      flexShrink: 0,
                                      background:
                                        expandedQ === i
                                          ? "var(--accent)"
                                          : "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
                                      border: "1px solid rgba(99,102,241,0.2)",
                                      color: expandedQ === i ? "white" : "#6366f1",
                                      fontSize: 11,
                                      fontWeight: 900,
                                      fontFamily: "DM Mono, monospace",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    {i + 1}
                                  </span>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 13,
                                      color: "var(--ink)",
                                      fontFamily: "Instrument Sans, sans-serif",
                                      lineHeight: 1.6,
                                      flex: 1,
                                    }}
                                  >
                                    {q}
                                  </p>
                                </div>
                                <AnimatePresence>
                                  {expandedQ === i && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      style={{ overflow: "hidden" }}
                                    >
                                      <div
                                        style={{
                                          marginTop: 10,
                                          marginLeft: 38,
                                          padding: "10px 12px",
                                          borderRadius: 8,
                                          background: "rgba(99,102,241,0.06)",
                                          border: "1px solid rgba(99,102,241,0.12)",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: 9.5,
                                            fontFamily: "DM Mono, monospace",
                                            color: "#6366f1",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                            fontWeight: 700,
                                            marginBottom: 3,
                                          }}
                                        >
                                          💡 Prep tip
                                        </div>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 11.5,
                                            color: "var(--ink-muted)",
                                            fontFamily: "Instrument Sans, sans-serif",
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          Use the STAR format (Situation, Task, Action, Result) and
                                          prepare a 90-second answer with specific numbers and
                                          outcomes.
                                        </p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </div>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--ink-faint)",
                              textAlign: "center",
                              marginTop: 12,
                              fontFamily: "Instrument Sans, sans-serif",
                            }}
                          >
                            Click any question to see a prep tip
                          </p>
                        </div>
                      )}

                      {/* QUICK WINS */}
                      {activeSection === "quickwins" && (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 14,
                            }}
                          >
                            <Zap size={14} color="#f59e0b" />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "var(--ink)",
                                fontFamily: "Instrument Sans, sans-serif",
                              }}
                            >
                              Quick Wins to Boost Your Callback Rate
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {review.quickWins.map((win, i) => {
                              const e = EFFORT[win.effort];
                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.08 }}
                                  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                                  style={{
                                    padding: "16px 18px",
                                    borderRadius: 12,
                                    background: "var(--paper-card)",
                                    border: "1px solid var(--border)",
                                    borderLeft: `3px solid #6366f1`,
                                    transition: "all 0.18s",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 10,
                                      marginBottom: 6,
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <ChevronRight size={14} color="#6366f1" />
                                      <span
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 800,
                                          color: "var(--ink)",
                                          fontFamily: "Instrument Sans, sans-serif",
                                        }}
                                      >
                                        {win.action}
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        background: e.bg,
                                        color: e.text,
                                        fontFamily: "DM Mono, monospace",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {e.label}
                                    </span>
                                  </div>
                                  <p
                                    style={{
                                      margin: "0 0 0 22px",
                                      fontSize: 12,
                                      color: "var(--ink-muted)",
                                      fontFamily: "Instrument Sans, sans-serif",
                                      lineHeight: 1.55,
                                    }}
                                  >
                                    {win.impact}
                                  </p>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Footer controls */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      background: "var(--paper-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <ClipboardList size={12} color="var(--ink-faint)" />
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "var(--ink-faint)",
                        fontFamily: "Instrument Sans, sans-serif",
                        flex: 1,
                      }}
                    >
                      AI simulation of recruiter perspective — one signal among many
                    </span>
                    <button
                      onClick={handleRun}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 12px",
                        borderRadius: 7,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--ink-muted)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Instrument Sans, sans-serif",
                      }}
                    >
                      <RefreshCcw size={11} /> Re-run
                    </button>
                    <button
                      onClick={() => setReview(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 12px",
                        borderRadius: 7,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--ink-muted)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Instrument Sans, sans-serif",
                      }}
                    >
                      <ArrowLeft size={11} /> New
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Empty state */}
              {!loading && !review && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Hero empty card */}
                  <div
                    style={{
                      borderRadius: 18,
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 60%, #24243e 100%)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "40px 32px",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: -30,
                        right: -30,
                        width: 180,
                        height: 180,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: -30,
                        left: 30,
                        width: 140,
                        height: 140,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />

                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        margin: "0 auto 20px",
                        background:
                          "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
                        border: "1px solid rgba(99,102,241,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 30px rgba(99,102,241,0.2)",
                      }}
                    >
                      <Users size={32} color="#a5b4fc" />
                    </motion.div>

                    <h2
                      style={{
                        fontFamily: "DM Serif Display, Georgia, serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: "white",
                        margin: "0 0 10px",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      See your resume as a recruiter sees it
                    </h2>
                    <p
                      style={{
                        margin: "0 auto",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "Instrument Sans, sans-serif",
                        maxWidth: 380,
                        lineHeight: 1.6,
                      }}
                    >
                      Configure your review on the left and click Run to get an honest, unfiltered
                      recruiter simulation in seconds.
                    </p>
                  </div>

                  {/* Feature grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <FeatureCard
                      icon={<Eye size={14} color="#818cf8" />}
                      title="6-Second Scan"
                      desc="Exactly what goes through a recruiter's mind in the first glance"
                    />
                    <FeatureCard
                      icon={<Target size={14} color="#f472b6" />}
                      title="Callback Score"
                      desc="AI-computed probability of getting called back, scored 0–100"
                    />
                    <FeatureCard
                      icon={<AlertTriangle size={14} color="#fb923c" />}
                      title="Red & Green Flags"
                      desc="Severity-rated issues plus the strengths that make you stand out"
                    />
                    <FeatureCard
                      icon={<TrendingUp size={14} color="#34d399" />}
                      title="Quick Wins"
                      desc="Actionable improvements ranked by effort and impact on your score"
                    />
                    <FeatureCard
                      icon={<HelpCircle size={14} color="#fbbf24" />}
                      title="Interview Questions"
                      desc="The 5 exact questions a recruiter would ask based on your resume"
                    />
                    <FeatureCard
                      icon={<Trophy size={14} color="#a78bfa" />}
                      title="Hiring Decision"
                      desc="The gut-feel verdict: Strong hire, pass, maybe, or not qualified"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
