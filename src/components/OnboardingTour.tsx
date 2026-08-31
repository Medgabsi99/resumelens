"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  X,
  Briefcase,
  Code2,
  Award,
  BarChart3,
  Search,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import ConfettiCannon from "@/components/ConfettiCannon";

const STORAGE_KEY = "resumelens_onboarding_done";

// ─── Step 1: Role Track Personalizer ─────────────────────────────────────────
type RoleTrack = "swe" | "pm" | "exec" | "finance";

interface RoleTrackInfo {
  id: RoleTrack;
  label: string;
  icon: typeof Code2;
  scoreTarget: string;
  metricBoost: string;
  focusArea: string;
}

const ROLE_TRACKS: RoleTrackInfo[] = [
  {
    id: "swe",
    label: "Software Engineer",
    icon: Code2,
    scoreTarget: "96+ ATS Target",
    metricBoost: "+4.2x Callbacks",
    focusArea: "Google XYZ Metric Quantification & Tech Stacks",
  },
  {
    id: "pm",
    label: "Product & Design",
    icon: Sparkles,
    scoreTarget: "94+ ATS Target",
    metricBoost: "+3.8x Callbacks",
    focusArea: "User Growth, ARR Impact & Cross-Functional Scale",
  },
  {
    id: "exec",
    label: "Executive & Lead",
    icon: Award,
    scoreTarget: "98+ ATS Target",
    metricBoost: "+5.1x Callbacks",
    focusArea: "P&L Scale, Board Narrative & Organizational Growth",
  },
  {
    id: "finance",
    label: "Finance & Strategy",
    icon: BarChart3,
    scoreTarget: "95+ ATS Target",
    metricBoost: "+3.5x Callbacks",
    focusArea: "EBITDA Expansion, ROI Metrics & Financial Modeling",
  },
];

function RolePersonalizerWidget({
  activeTrack,
  onSelectTrack,
}: {
  activeTrack: RoleTrack;
  onSelectTrack: (track: RoleTrack) => void;
}) {
  const current = useMemo(
    () => ROLE_TRACKS.find((r) => r.id === activeTrack) || ROLE_TRACKS[0],
    [activeTrack]
  );

  return (
    <div className="w-full flex flex-col gap-3 max-w-md">
      {/* Role Track Chips */}
      <div className="grid grid-cols-2 gap-2">
        {ROLE_TRACKS.map((t) => {
          const isSelected = t.id === activeTrack;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTrack(t.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                isSelected
                  ? "bg-accent/10 border-accent text-accent shadow-xs"
                  : "bg-paper-warm/40 border-border text-ink-muted hover:border-border-strong hover:text-ink"
              }`}
            >
              <Icon size={14} className={isSelected ? "text-accent" : "text-ink-muted"} />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Profile Metric Preview */}
      <div className="p-3 rounded-xl bg-paper-warm/60 border border-border/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-ink">{current.scoreTarget}</span>
          <span className="text-ink-muted font-mono">({current.metricBoost})</span>
        </div>
        <span className="text-[11px] text-accent font-semibold truncate max-w-[170px]">
          {current.focusArea.split("&")[0]}
        </span>
      </div>
    </div>
  );
}

// ─── Step 2: Interactive Google XYZ Rewriter Sandbox ─────────────────────────
function XyzRewriterWidget() {
  const [isOptimized, setIsOptimized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOptimized((v) => !v);
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div className="w-full flex flex-col gap-3 max-w-md text-left">
      <div className="p-3.5 rounded-xl bg-paper-warm/70 border border-border/80 relative overflow-hidden flex flex-col gap-2.5">
        {/* Card Header & Live Score Meter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full transition-colors ${
                isOptimized
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {isOptimized ? "Google XYZ Formatted" : "Unquantified Draft"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            <span className="text-ink-muted">ATS Score:</span>
            <span
              className={`transition-colors ${
                isOptimized ? "text-emerald-500 font-extrabold" : "text-amber-500"
              }`}
            >
              {isOptimized ? "96 / 100" : "54 / 100"}
            </span>
          </div>
        </div>

        {/* Live Bullet Text */}
        <p
          className={`text-xs leading-relaxed transition-opacity ${
            isAnimating ? "opacity-30" : "opacity-100"
          } ${isOptimized ? "text-ink font-medium" : "text-ink-muted"}`}
        >
          {isOptimized
            ? "“Engineered high-throughput cloud microservices with React & Node.js, reducing p99 latency by 42% and preventing $140K in downtime across 250K daily active users.”"
            : "“Managed company website servers and resolved bugs during weekly sprint cycles.”"}
        </p>

        {/* Action Trigger Button */}
        <button
          type="button"
          onClick={handleToggle}
          className="self-end inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-accent to-accent-hover hover:opacity-95 shadow-sm transition cursor-pointer"
        >
          {isOptimized ? (
            <>
              <RefreshCw size={12} />
              <span>Reset Sample</span>
            </>
          ) : (
            <>
              <Sparkles size={12} />
              <span>✨ Apply Google XYZ Formula</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Interactive Application CRM Kanban Sandbox ──────────────────────
const KANBAN_STAGES = [
  { id: "applied", label: "Applied", color: "text-ink-muted", bg: "bg-paper-card" },
  { id: "screen", label: "Recruiter Screen", color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "tech", label: "Technical Drill", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "offer", label: "Offer: $175K 🎉", color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

function KanbanTrackerWidget() {
  const [stageIndex, setStageIndex] = useState(1);

  const handleAdvance = () => {
    setStageIndex((prev) => (prev + 1) % KANBAN_STAGES.length);
  };

  const currentStage = KANBAN_STAGES[stageIndex];

  return (
    <div className="w-full flex flex-col gap-3 max-w-md text-left">
      <div className="p-3.5 rounded-xl bg-paper-warm/70 border border-border/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-amber-500" />
            <strong className="text-xs text-ink font-bold font-display">
              Senior Full-Stack Engineer
            </strong>
          </div>
          <span className="text-[10px] font-mono text-ink-muted">Acme Cloud Corp</span>
        </div>

        {/* Stage Timeline Stepper */}
        <div className="grid grid-cols-4 gap-1.5">
          {KANBAN_STAGES.map((s, idx) => {
            const isPassed = idx <= stageIndex;
            const isCurrent = idx === stageIndex;
            return (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isPassed ? (isCurrent ? "bg-amber-500" : "bg-emerald-500") : "bg-border"
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span
            className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border border-border/60 ${currentStage.bg} ${currentStage.color}`}
          >
            Stage: {currentStage.label}
          </span>

          <button
            type="button"
            onClick={handleAdvance}
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline cursor-pointer"
          >
            <span>Advance Stage</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Interactive Salary Leverage Simulator ───────────────────────────
function SalaryNegotiatorWidget() {
  const [leverageStep, setLeverageStep] = useState(0);

  const baseComp = 145000 + leverageStep * 8000;
  const equityComp = 25000 + leverageStep * 4000;
  const signOnComp = 10000 + leverageStep * 3000;
  const totalComp = baseComp + equityComp + signOnComp;

  const handleCounter = () => {
    setLeverageStep((prev) => (prev < 3 ? prev + 1 : 0));
  };

  return (
    <div className="w-full flex flex-col gap-2.5 max-w-md text-left">
      <div className="p-3.5 rounded-xl bg-paper-warm/70 border border-border/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-ink-muted uppercase">
            Total Compensation Package
          </span>
          <span className="text-base font-extrabold font-display text-emerald-600 dark:text-emerald-400">
            ${totalComp.toLocaleString()} / yr
          </span>
        </div>

        {/* Breakdown bar */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-paper flex border border-border/40">
          <div
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(baseComp / totalComp) * 100}%` }}
            title="Base"
          />
          <div
            className="bg-sky-500 h-full transition-all duration-300 border-l border-white/10"
            style={{ width: `${(equityComp / totalComp) * 100}%` }}
            title="Equity"
          />
          <div
            className="bg-emerald-500 h-full transition-all duration-300 border-l border-white/10"
            style={{ width: `${(signOnComp / totalComp) * 100}%` }}
            title="Sign-on"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-ink-muted">
          <span>Base: ${baseComp.toLocaleString()}</span>
          <span>Equity: ${equityComp.toLocaleString()}</span>
          <span>Sign-on: ${signOnComp.toLocaleString()}</span>
        </div>

        <button
          type="button"
          onClick={handleCounter}
          className="w-full mt-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <TrendingUp size={13} />
          <span>
            {leverageStep < 3
              ? `Simulate +$15,000 Counter-Offer Script (Gain: +$${(leverageStep * 15000).toLocaleString()})`
              : "Reset Counter Simulation"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Interactive Command Center Sandbox ──────────────────────────────
function CommandPaletteSandboxWidget() {
  const [activeQuery, setActiveQuery] = useState("ATS");

  const queries = ["ATS Scanner", "Resume Builder", "Salary Negotiator", "Interview Prep"];

  const handleSelectQuery = (q: string) => {
    setActiveQuery(q);
  };

  return (
    <div className="w-full flex flex-col gap-2.5 max-w-md text-left">
      <div className="p-3.5 rounded-xl bg-paper-warm/80 border border-border/80 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-paper border border-border">
          <Search size={14} className="text-accent" />
          <span className="text-xs font-semibold text-ink font-mono flex-1">{activeQuery}</span>
          <span className="flex items-center gap-0.5">
            <kbd className="font-mono text-[9px] bg-paper-warm border border-border rounded px-1.5 py-0.5">
              Ctrl
            </kbd>
            <kbd className="font-mono text-[9px] bg-paper-warm border border-border rounded px-1.5 py-0.5">
              K
            </kbd>
          </span>
        </div>

        {/* Quick query chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {queries.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSelectQuery(q)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                activeQuery === q
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-paper border-border/70 text-ink-muted hover:text-ink"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tour Steps Configuration ────────────────────────────────────────────────
interface TourStepConfig {
  id: string;
  accentColor: string;
  accentRgb: string;
  badgeLabel: string;
  title: string;
  description: string;
  widget: (props: {
    activeTrack: RoleTrack;
    onSelectTrack: (track: RoleTrack) => void;
  }) => React.ReactNode;
  ctaLabel: string;
  secondaryCta?: { label: string; href: string };
  primaryHref?: string;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    id: "welcome",
    accentColor: "var(--accent)",
    accentRgb: "224, 93, 46",
    badgeLabel: "Step 1 of 5 • Welcome",
    title: "Your Career Acceleration Suite",
    description:
      "Select your career focus below to tailor algorithmic resume scoring benchmarks, keyword weights, and executive recruiter expectations.",
    widget: ({ activeTrack, onSelectTrack }) => (
      <RolePersonalizerWidget activeTrack={activeTrack} onSelectTrack={onSelectTrack} />
    ),
    ctaLabel: "Next: ATS Scanner",
  },
  {
    id: "scanner",
    accentColor: "#10b981",
    accentRgb: "16, 185, 129",
    badgeLabel: "Step 2 of 5 • ATS Optimizer",
    title: "Deterministic ATS Audit & XYZ Rewriter",
    description:
      "Test how our Google XYZ formula rewrites weak bullet points into high-impact, quantified achievements that pass Workday, Greenhouse, and Taleo filters.",
    widget: () => <XyzRewriterWidget />,
    ctaLabel: "Next: Job CRM",
  },
  {
    id: "tracker",
    accentColor: "#f59e0b",
    accentRgb: "245, 158, 11",
    badgeLabel: "Step 3 of 5 • Application CRM",
    title: "Kanban Application Tracker",
    description:
      "Manage every opportunity from initial outreach to final offer letter. Track interview deadlines, recruiter contacts, and stage progressions in one place.",
    widget: () => <KanbanTrackerWidget />,
    ctaLabel: "Next: Salary Negotiator",
  },
  {
    id: "negotiator",
    accentColor: "#2563eb",
    accentRgb: "37, 99, 235",
    badgeLabel: "Step 4 of 5 • Compensation",
    title: "AI Salary Negotiation Simulator",
    description:
      "Simulate counter-offers against hiring managers with hidden budget bands. Calculate real-time equity, base salary, and sign-on multiplier leverage.",
    widget: () => <SalaryNegotiatorWidget />,
    ctaLabel: "Next: Command Center",
  },
  {
    id: "command",
    accentColor: "var(--accent)",
    accentRgb: "224, 93, 46",
    badgeLabel: "Step 5 of 5 • Ready to Launch",
    title: "Command Palette & Quick-Jump",
    description:
      "Press Ctrl+K anytime from anywhere in the app to navigate instantly across all tools, run one-click optimizations, or switch themes.",
    widget: () => <CommandPaletteSandboxWidget />,
    ctaLabel: "🚀 Launch ATS Audit",
    primaryHref: "/dashboard/scanner",
    secondaryCta: { label: "Explore Dashboard", href: "/dashboard" },
  },
];

// ─── Main Onboarding Tour Component ──────────────────────────────────────────
interface OnboardingTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function OnboardingTour({ forceOpen = false, onClose }: OnboardingTourProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [activeTrack, setActiveTrack] = useState<RoleTrack>("swe");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show only once (or when forced)
  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      setShowConfetti(false);
      return;
    }
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {}
  }, [forceOpen]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const navigate = useCallback(
    (nextStep: number, dir: "forward" | "back") => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setStep(nextStep);
        setAnimating(false);
        if (nextStep === TOUR_STEPS.length - 1) {
          setShowConfetti(true);
        }
      }, 160);
    },
    [animating]
  );

  const handleNext = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      navigate(step + 1, "forward");
    } else {
      dismiss();
    }
  }, [step, navigate, dismiss]);

  const handleBack = useCallback(() => {
    if (step > 0) navigate(step - 1, "back");
  }, [step, navigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      if (e.key === "ArrowLeft") handleBack();
      // Number keys 1-5
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= TOUR_STEPS.length) {
        navigate(num - 1, num - 1 > step ? "forward" : "back");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, step, handleNext, handleBack, navigate, dismiss]);

  if (!mounted || !open) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  const modalContent = (
    <>
      <style>{`
        @keyframes tourBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tourModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0px); }
        }
        @keyframes tourSlideForward {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes tourSlideBack {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .tour-overlay { animation: tourBackdropIn 0.22s ease forwards; }
        .tour-modal { animation: tourModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tour-content-forward { animation: tourSlideForward 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tour-content-back { animation: tourSlideBack 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .tour-overlay, .tour-modal, .tour-content-forward, .tour-content-back { animation: none; }
        }
      `}</style>

      {/* Confetti Celebration on Step 5 */}
      {showConfetti && <ConfettiCannon score={96} trigger={true} />}

      {/* Fullscreen Overlay with Absolute Viewport Centering */}
      <div
        className="tour-overlay fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 99990,
        }}
        onClick={dismiss}
      >
        {/* Main Tour Modal Card */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ResumeLens Interactive Guided Tour"
          className="tour-modal relative w-full my-auto"
          style={{
            maxWidth: 580,
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            boxShadow: `0 32px 80px -16px rgba(0,0,0,0.5), 0 0 0 1px var(--border), 0 0 60px -20px rgba(${current.accentRgb}, 0.25)`,
            zIndex: 99991,
            overflow: "hidden",
            fontFamily: "Instrument Sans, system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dynamic Morphing Accent Top Strip */}
          <div
            style={{
              height: 3.5,
              background: `linear-gradient(90deg, ${current.accentColor} 0%, rgba(${current.accentRgb}, 0.25) 100%)`,
              transition: "background 0.35s ease",
            }}
          />

          {/* Modal Header: Step Dots, Read Time & Close Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 22px 0",
            }}
          >
            {/* Progress Step Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {TOUR_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(i, i > step ? "forward" : "back")}
                  aria-label={`Jump to ${s.badgeLabel}`}
                  style={{
                    width: i === step ? 24 : 8,
                    height: 7,
                    borderRadius: 4,
                    border: "none",
                    background:
                      i === step
                        ? current.accentColor
                        : i < step
                          ? `rgba(${current.accentRgb}, 0.4)`
                          : "var(--border)",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    padding: 0,
                  }}
                />
              ))}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "DM Mono, monospace",
                  color: "var(--ink-faint)",
                }}
              >
                ⏱️ 45s overview
              </span>
            </div>

            {/* Skip Control */}
            <button
              type="button"
              onClick={dismiss}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink-faint)",
                cursor: "pointer",
                padding: "2px 4px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
            >
              <span>Skip</span>
              <X size={12} />
            </button>
          </div>

          {/* Step Content with Dynamic Animation */}
          <div
            key={step}
            className={
              animating
                ? ""
                : direction === "forward"
                  ? "tour-content-forward"
                  : "tour-content-back"
            }
            style={{
              padding: "18px 26px 26px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Badge */}
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: current.accentColor,
                background: `rgba(${current.accentRgb}, 0.1)`,
                border: `1px solid rgba(${current.accentRgb}, 0.2)`,
                borderRadius: 6,
                padding: "3px 10px",
                marginBottom: 10,
                fontFamily: "DM Mono, monospace",
              }}
            >
              {current.badgeLabel}
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
                fontFamily: "Instrument Sans, system-ui, sans-serif",
                lineHeight: 1.25,
              }}
            >
              {current.title}
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: 13.5,
                color: "var(--ink-muted)",
                lineHeight: 1.6,
                margin: "0 0 18px",
                maxWidth: 440,
              }}
            >
              {current.description}
            </p>

            {/* Interactive Step Simulator Sandbox */}
            <div style={{ width: "100%", marginBottom: 22 }}>
              {current.widget({
                activeTrack,
                onSelectTrack: setActiveTrack,
              })}
            </div>

            {/* CTA Footer Navigation */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Back Button */}
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 12,
                    border: "1.5px solid var(--border)",
                    background: "transparent",
                    color: "var(--ink-muted)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-strong)";
                    e.currentTarget.style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--ink-muted)";
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              )}

              {/* Secondary CTA on Final Step */}
              {isLast && current.secondaryCta && (
                <Link
                  href={current.secondaryCta.href}
                  onClick={dismiss}
                  style={{
                    padding: "11px 18px",
                    borderRadius: 12,
                    border: "1.5px solid var(--border)",
                    background: "var(--paper-warm)",
                    color: "var(--ink)",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{current.secondaryCta.label}</span>
                </Link>
              )}

              {/* Primary Action Button */}
              {isLast && current.primaryHref ? (
                <Link
                  href={current.primaryHref}
                  onClick={dismiss}
                  style={{
                    flex: 1,
                    maxWidth: 240,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "12px 24px",
                    borderRadius: 13,
                    background: `linear-gradient(135deg, ${current.accentColor} 0%, rgba(${current.accentRgb}, 0.85) 100%)`,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: `0 6px 20px rgba(${current.accentRgb}, 0.35)`,
                    transition: "all 0.2s",
                  }}
                >
                  <span>{current.ctaLabel}</span>
                  <Sparkles size={14} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    maxWidth: step === 0 ? 220 : 200,
                    padding: "12px 24px",
                    borderRadius: 13,
                    border: "none",
                    background: `linear-gradient(135deg, ${current.accentColor} 0%, rgba(${current.accentRgb}, 0.85) 100%)`,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: `0 6px 20px rgba(${current.accentRgb}, 0.35)`,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 10px 28px rgba(${current.accentRgb}, 0.45)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 6px 20px rgba(${current.accentRgb}, 0.35)`;
                  }}
                >
                  <span>{current.ctaLabel}</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Keyboard Hint Footer */}
            <div
              style={{
                marginTop: 14,
                fontSize: 10,
                color: "var(--ink-faint)",
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "DM Mono, monospace",
              }}
            >
              <kbd
                style={{
                  background: "var(--paper-warm)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 9,
                }}
              >
                ←
              </kbd>
              <kbd
                style={{
                  background: "var(--paper-warm)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 9,
                }}
              >
                →
              </kbd>
              <span>navigate</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <kbd
                style={{
                  background: "var(--paper-warm)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 9,
                }}
              >
                1-5
              </kbd>
              <span>jump</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <kbd
                style={{
                  background: "var(--paper-warm)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 9,
                }}
              >
                Esc
              </kbd>
              <span>skip</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// Export helper to reset the tour (for Settings page)
export function resetOnboardingTour() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
