"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "resumelens_onboarding_done";

// ─── Per-step SVG Illustrations ───────────────────────────────────────────────

function StepIllustrationWelcome() {
  return (
    <svg width="140" height="130" viewBox="0 0 140 130" fill="none" aria-hidden="true">
      {/* Glow blob */}
      <ellipse cx="70" cy="65" rx="52" ry="46" fill="var(--accent)" opacity="0.07" />
      {/* Resume page */}
      <rect x="38" y="12" width="64" height="86" rx="8" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="38" y="12" width="64" height="20" rx="8" fill="var(--accent)" opacity="0.12" />
      <rect x="38" y="24" width="64" height="8" fill="var(--accent)" opacity="0.08" />
      {/* Avatar */}
      <circle cx="56" cy="22" r="6" fill="var(--accent)" opacity="0.3" />
      <circle cx="56" cy="22" r="3.5" fill="var(--accent)" opacity="0.6" />
      {/* Name line */}
      <rect x="66" y="18" width="24" height="3.5" rx="1.75" fill="var(--ink)" opacity="0.25" />
      <rect x="66" y="24" width="17" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.4" />
      {/* Content lines */}
      <rect x="46" y="40" width="48" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.3" />
      <rect x="46" y="46" width="38" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.25" />
      <rect x="46" y="52" width="44" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.3" />
      <rect x="46" y="62" width="20" height="3" rx="1.5" fill="var(--accent)" opacity="0.4" />
      <rect x="46" y="70" width="48" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.3" />
      <rect x="46" y="76" width="32" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.25" />
      <rect x="46" y="82" width="40" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.3" />
      {/* Score ring */}
      <circle cx="108" cy="108" r="20" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="108" cy="108" r="20" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="82 44" strokeLinecap="round" transform="rotate(-90 108 108)" opacity="0.7" />
      <text x="108" y="113" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--accent)" fontFamily="DM Serif Display, serif">87</text>
      {/* Sparkles */}
      <circle cx="28" cy="20" r="3" fill="var(--accent)" opacity="0.3" />
      <circle cx="120" cy="28" r="2" fill="var(--accent)" opacity="0.25" />
      <circle cx="24" cy="96" r="2" fill="var(--accent)" opacity="0.2" />
    </svg>
  );
}

function StepIllustrationAnalyzer() {
  return (
    <svg width="140" height="130" viewBox="0 0 140 130" fill="none" aria-hidden="true">
      <ellipse cx="70" cy="65" rx="52" ry="46" fill="#10b981" opacity="0.06" />
      {/* Document */}
      <rect x="28" y="18" width="60" height="78" rx="7" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.5" />
      {/* Header */}
      <rect x="28" y="18" width="60" height="16" rx="7" fill="#10b981" opacity="0.12" />
      <rect x="36" y="23" width="30" height="3" rx="1.5" fill="#10b981" opacity="0.5" />
      <rect x="36" y="29" width="20" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.4" />
      {/* Score bars */}
      <rect x="36" y="42" width="44" height="2" rx="1" fill="var(--border)" />
      <rect x="36" y="42" width="36" height="2" rx="1" fill="#10b981" opacity="0.6" />
      <rect x="36" y="50" width="44" height="2" rx="1" fill="var(--border)" />
      <rect x="36" y="50" width="26" height="2" rx="1" fill="#f59e0b" opacity="0.6" />
      <rect x="36" y="58" width="44" height="2" rx="1" fill="var(--border)" />
      <rect x="36" y="58" width="40" height="2" rx="1" fill="#10b981" opacity="0.5" />
      {/* Labels */}
      <rect x="36" y="68" width="16" height="2" rx="1" fill="var(--ink-faint)" opacity="0.35" />
      <rect x="36" y="74" width="42" height="2" rx="1" fill="var(--ink-faint)" opacity="0.25" />
      <rect x="36" y="80" width="36" height="2" rx="1" fill="var(--ink-faint)" opacity="0.25" />
      {/* AI badge floating */}
      <rect x="90" y="25" width="38" height="50" rx="9" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="90" y="25" width="38" height="14" rx="9" fill="#10b981" opacity="0.15" />
      <text x="109" y="36" textAnchor="middle" fontSize="8" fontWeight="700" fill="#10b981" opacity="0.8">AI SCAN</text>
      {/* AI checkmarks */}
      <circle cx="98" cy="50" r="4" fill="#10b981" opacity="0.2" />
      <text x="98" y="53.5" textAnchor="middle" fontSize="7" fill="#10b981" opacity="0.9">✓</text>
      <rect x="105" y="47" width="18" height="2" rx="1" fill="var(--ink-faint)" opacity="0.3" />
      <circle cx="98" cy="61" r="4" fill="#f59e0b" opacity="0.2" />
      <text x="98" y="64.5" textAnchor="middle" fontSize="7" fill="#f59e0b" opacity="0.9">!</text>
      <rect x="105" y="58" width="14" height="2" rx="1" fill="var(--ink-faint)" opacity="0.3" />
      <circle cx="98" cy="72" r="4" fill="#10b981" opacity="0.2" />
      <text x="98" y="75.5" textAnchor="middle" fontSize="7" fill="#10b981" opacity="0.9">✓</text>
      <rect x="105" y="69" width="16" height="2" rx="1" fill="var(--ink-faint)" opacity="0.3" />
      {/* Upload arrow */}
      <circle cx="32" cy="110" r="12" fill="#10b981" opacity="0.12" />
      <text x="32" y="115" textAnchor="middle" fontSize="14" fill="#10b981" opacity="0.7">↑</text>
    </svg>
  );
}

function StepIllustrationTracker() {
  return (
    <svg width="140" height="130" viewBox="0 0 140 130" fill="none" aria-hidden="true">
      <ellipse cx="70" cy="65" rx="52" ry="46" fill="#f59e0b" opacity="0.06" />
      {/* Kanban columns */}
      {/* Column 1: Applied */}
      <rect x="8" y="22" width="36" height="88" rx="7" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.2" />
      <rect x="8" y="22" width="36" height="12" rx="7" fill="var(--accent)" opacity="0.12" />
      <rect x="14" y="27" width="16" height="2.5" rx="1.25" fill="var(--accent)" opacity="0.5" />
      <rect x="11" y="38" width="30" height="18" rx="4" fill="var(--paper-warm)" stroke="var(--border)" strokeWidth="1" />
      <rect x="14" y="41" width="20" height="2.5" rx="1.25" fill="var(--ink)" opacity="0.3" />
      <rect x="14" y="46" width="14" height="2" rx="1" fill="var(--ink-faint)" opacity="0.3" />
      <rect x="11" y="60" width="30" height="18" rx="4" fill="var(--paper-warm)" stroke="var(--border)" strokeWidth="1" />
      <rect x="14" y="63" width="18" height="2.5" rx="1.25" fill="var(--ink)" opacity="0.3" />
      <rect x="14" y="68" width="12" height="2" rx="1" fill="var(--ink-faint)" opacity="0.3" />
      {/* Column 2: Interview */}
      <rect x="52" y="22" width="36" height="88" rx="7" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.2" />
      <rect x="52" y="22" width="36" height="12" rx="7" fill="#f59e0b" opacity="0.12" />
      <rect x="58" y="27" width="20" height="2.5" rx="1.25" fill="#f59e0b" opacity="0.5" />
      <rect x="55" y="38" width="30" height="18" rx="4" fill="var(--paper-warm)" stroke="var(--border)" strokeWidth="1" />
      <rect x="58" y="41" width="16" height="2.5" rx="1.25" fill="var(--ink)" opacity="0.3" />
      <rect x="58" y="46" width="20" height="2" rx="1" fill="var(--ink-faint)" opacity="0.3" />
      {/* Column 3: Offer */}
      <rect x="96" y="22" width="36" height="88" rx="7" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.2" />
      <rect x="96" y="22" width="36" height="12" rx="7" fill="#10b981" opacity="0.12" />
      <rect x="102" y="27" width="14" height="2.5" rx="1.25" fill="#10b981" opacity="0.5" />
      <rect x="99" y="38" width="30" height="18" rx="4" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1" />
      <rect x="102" y="41" width="18" height="2.5" rx="1.25" fill="var(--ink)" opacity="0.3" />
      <rect x="102" y="46" width="22" height="2" rx="1" fill="#10b981" opacity="0.4" />
      {/* Drag arrow */}
      <path d="M46 56 L50 56" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arr)" opacity="0.5" />
      <text x="48" y="55" textAnchor="middle" fontSize="8" fill="var(--ink-faint)" opacity="0.6">→</text>
    </svg>
  );
}

function StepIllustrationNegotiator() {
  return (
    <svg width="140" height="130" viewBox="0 0 140 130" fill="none" aria-hidden="true">
      <ellipse cx="70" cy="65" rx="52" ry="46" fill="#8b5cf6" opacity="0.06" />
      {/* Chat bubble — Recruiter */}
      <rect x="10" y="16" width="80" height="32" rx="10" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.5" />
      <path d="M20 48 L14 56 L28 48" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.2" />
      <rect x="18" y="24" width="56" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.4" />
      <rect x="18" y="30" width="44" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.3" />
      <rect x="18" y="36" width="50" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.3" />
      {/* Recruiter label */}
      <rect x="10" y="8" width="40" height="10" rx="4" fill="#8b5cf6" opacity="0.15" stroke="#8b5cf6" strokeWidth="1" />
      <text x="30" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="#8b5cf6" opacity="0.8">🤖 RECRUITER</text>
      {/* Chat bubble — User */}
      <rect x="50" y="68" width="80" height="32" rx="10" fill="#8b5cf6" opacity="0.18" stroke="#8b5cf6" strokeWidth="1.5" />
      <path d="M120 100 L126 108 L112 100" fill="#8b5cf6" opacity="0.12" />
      <rect x="58" y="76" width="56" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.4" />
      <rect x="58" y="82" width="44" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.3" />
      <rect x="58" y="88" width="48" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.3" />
      {/* You label */}
      <rect x="98" y="112" width="32" height="10" rx="4" fill="#8b5cf6" opacity="0.2" />
      <text x="114" y="120" textAnchor="middle" fontSize="7" fontWeight="700" fill="#8b5cf6" opacity="0.8">YOU 💪</text>
      {/* $ gain chip */}
      <rect x="52" y="16" width="76" height="22" rx="7" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.2" />
      <text x="90" y="31" textAnchor="middle" fontSize="10" fontWeight="800" fill="#10b981" fontFamily="DM Serif Display, serif">+$18,500 gained</text>
    </svg>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "welcome",
    accentColor: "var(--accent)",
    accentRgb: "99,102,241",
    label: "Welcome",
    title: "Welcome to ResumeLens",
    description:
      "Your AI-powered career acceleration suite is ready. In the next 30 seconds, we'll show you exactly where everything lives — so you can hit the ground running.",
    illustration: <StepIllustrationWelcome />,
    ctaLabel: "Let's go",
    link: null as string | null,
  },
  {
    id: "analyzer",
    accentColor: "#10b981",
    accentRgb: "16,185,129",
    label: "AI Analyzer",
    title: "AI Resume Analyzer",
    description:
      "Upload any resume and get an instant ATS compatibility score, a detailed strength & weakness breakdown, and AI-rewritten bullet points to maximize your impact.",
    illustration: <StepIllustrationAnalyzer />,
    ctaLabel: "Next",
    link: null,
  },
  {
    id: "tracker",
    accentColor: "#f59e0b",
    accentRgb: "245,158,11",
    label: "Job Tracker",
    title: "Job Application Tracker",
    description:
      "Track every opportunity in a drag-and-drop Kanban board. Log roles, companies, interview stages, and follow-up deadlines — never let a hot lead go cold.",
    illustration: <StepIllustrationTracker />,
    ctaLabel: "Next",
    link: null,
  },
  {
    id: "negotiator",
    accentColor: "#8b5cf6",
    accentRgb: "139,92,246",
    label: "Negotiator",
    title: "Salary Negotiation Simulator",
    description:
      "Practice live salary negotiations against an AI recruiter with a hidden budget. Build the confidence and vocabulary to ask for exactly what you're worth.",
    illustration: <StepIllustrationNegotiator />,
    ctaLabel: "Get Started",
    link: "/dashboard",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
interface OnboardingTourProps {
  /** Force-show the tour (e.g. from Settings "Replay tour" button) */
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function OnboardingTour({ forceOpen = false, onClose }: OnboardingTourProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);

  // Show only once (or when forced)
  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      // localStorage unavailable — don't show
    }
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
      }, 180);
    },
    [animating]
  );

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleNext, handleBack, dismiss]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes tourBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tourModalIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0px); }
        }
        @keyframes tourSlideForward {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tourSlideBack {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tourIllusFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .tour-backdrop {
          animation: tourBackdropIn 0.25s ease forwards;
        }
        .tour-modal {
          animation: tourModalIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .tour-content-forward {
          animation: tourSlideForward 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .tour-content-back {
          animation: tourSlideBack 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .tour-illus {
          animation: tourIllusFloat 3.5s ease-in-out infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .tour-backdrop, .tour-modal, .tour-content-forward, .tour-content-back { animation: none; }
          .tour-illus { animation: none; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="tour-backdrop"
        onClick={dismiss}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 99990,
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ResumeLens onboarding tour"
        className="tour-modal"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, calc(100vw - 32px))",
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: 22,
          boxShadow: `0 32px 80px -16px rgba(0,0,0,0.45), 0 0 0 1px var(--border), 0 0 60px -20px rgba(${current.accentRgb},0.25)`,
          zIndex: 99991,
          overflow: "hidden",
          fontFamily: "Instrument Sans, system-ui, sans-serif",
        }}
      >
        {/* Accent top strip — morphs color per step */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${current.accentColor} 0%, rgba(${current.accentRgb},0.3) 100%)`,
            transition: "background 0.4s ease",
          }}
        />

        {/* Step dot progress + skip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px 0",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => navigate(i, i > step ? "forward" : "back")}
                aria-label={`Go to step ${i + 1}: ${s.label}`}
                style={{
                  width: i === step ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  border: "none",
                  background: i === step
                    ? current.accentColor
                    : i < step
                    ? `rgba(${current.accentRgb}, 0.35)`
                    : "var(--border)",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  padding: 0,
                }}
              />
            ))}
          </div>

          <button
            onClick={dismiss}
            style={{
              background: "none",
              border: "none",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-faint)",
              cursor: "pointer",
              padding: "2px 4px",
              fontFamily: "inherit",
              transition: "color 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
          >
            <span>Skip tour</span>
            <X size={11} />
          </button>
        </div>

        {/* Step content — animated on step change */}
        <div
          key={step}
          className={animating ? "" : direction === "forward" ? "tour-content-forward" : "tour-content-back"}
          style={{
            padding: "20px 28px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Illustration */}
          <div
            className="tour-illus"
            style={{
              marginBottom: 18,
              position: "relative",
            }}
          >
            {/* Ambient glow behind illustration */}
            <div
              style={{
                position: "absolute",
                inset: "-24px",
                background: `radial-gradient(circle, rgba(${current.accentRgb}, 0.18) 0%, transparent 70%)`,
                borderRadius: "50%",
                filter: "blur(16px)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              {current.illustration}
            </div>
          </div>

          {/* Step number label */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: current.accentColor,
              background: `rgba(${current.accentRgb}, 0.1)`,
              border: `1px solid rgba(${current.accentRgb}, 0.2)`,
              borderRadius: 6,
              padding: "3px 10px",
              marginBottom: 12,
              fontFamily: "DM Mono, monospace",
            }}
          >
            Step {step + 1} of {STEPS.length} — {current.label}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              margin: "0 0 10px",
              fontFamily: "Instrument Sans, system-ui, sans-serif",
              lineHeight: 1.25,
            }}
          >
            {current.title}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-muted)",
              lineHeight: 1.65,
              margin: "0 0 26px",
              maxWidth: 380,
            }}
          >
            {current.description}
          </p>

          {/* CTA area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              justifyContent: "center",
            }}
          >
            {/* Back button */}
            {step > 0 && (
              <button
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
                  gap: 6,
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

            {/* Primary CTA */}
            {isLast && current.link ? (
              <Link
                href={current.link}
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
                  background: `linear-gradient(135deg, ${current.accentColor} 0%, rgba(${current.accentRgb},0.8) 100%)`,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
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
                onClick={handleNext}
                style={{
                  flex: 1,
                  maxWidth: step === 0 ? 200 : 180,
                  padding: "12px 24px",
                  borderRadius: 13,
                  border: "none",
                  background: `linear-gradient(135deg, ${current.accentColor} 0%, rgba(${current.accentRgb},0.8) 100%)`,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
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

          {/* Keyboard hint */}
          <div
            style={{
              marginTop: 16,
              fontSize: 10,
              color: "var(--ink-faint)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "DM Mono, monospace",
            }}
          >
            <kbd style={{ background: "var(--paper-warm)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontSize: 9 }}>←</kbd>
            <kbd style={{ background: "var(--paper-warm)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontSize: 9 }}>→</kbd>
            <span>navigate</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <kbd style={{ background: "var(--paper-warm)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontSize: 9 }}>Esc</kbd>
            <span>skip</span>
          </div>
        </div>
      </div>
    </>
  );
}

// Export helper to reset the tour (for Settings page)
export function resetOnboardingTour() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
