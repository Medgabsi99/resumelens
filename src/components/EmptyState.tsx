"use client";

import Link from "next/link";

// ─── SVG Illustrations ──────────────────────────────────────────────────────
// Each illustration is a unique, hand-crafted inline SVG designed for its context.

function IllustrationResume() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Page shadow */}
      <rect x="26" y="14" width="72" height="92" rx="8" fill="var(--border)" opacity="0.4" />
      {/* Page body */}
      <rect x="22" y="10" width="72" height="92" rx="8" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.5" />
      {/* Header accent bar */}
      <rect x="22" y="10" width="72" height="22" rx="8" fill="var(--accent)" opacity="0.12" />
      <rect x="22" y="24" width="72" height="8" fill="var(--accent)" opacity="0.12" />
      {/* Avatar circle */}
      <circle cx="38" cy="21" r="7" fill="var(--accent)" opacity="0.25" />
      <circle cx="38" cy="21" r="4" fill="var(--accent)" opacity="0.5" />
      {/* Name lines */}
      <rect x="50" y="16" width="28" height="4" rx="2" fill="var(--ink)" opacity="0.3" />
      <rect x="50" y="23" width="20" height="3" rx="1.5" fill="var(--ink-faint)" opacity="0.5" />
      {/* Section lines */}
      <rect x="30" y="42" width="14" height="3" rx="1.5" fill="var(--accent)" opacity="0.6" />
      <rect x="30" y="50" width="56" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.35" />
      <rect x="30" y="55" width="48" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.35" />
      <rect x="30" y="60" width="52" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.35" />
      {/* Section 2 */}
      <rect x="30" y="72" width="18" height="3" rx="1.5" fill="var(--accent)" opacity="0.6" />
      <rect x="30" y="80" width="56" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.35" />
      <rect x="30" y="85" width="40" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.35" />
      {/* Sparkle */}
      <circle cx="90" cy="15" r="3" fill="var(--accent)" opacity="0.4" />
      <circle cx="85" cy="96" r="2" fill="var(--accent)" opacity="0.3" />
    </svg>
  );
}

function IllustrationApplications() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Briefcase body shadow */}
      <rect x="18" y="42" width="82" height="58" rx="9" fill="var(--border)" opacity="0.4" />
      {/* Briefcase body */}
      <rect x="14" y="38" width="82" height="58" rx="9" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.5" />
      {/* Briefcase handle */}
      <path d="M44 38V32a6 6 0 0 1 6-6h10a6 6 0 0 1 6 6v6" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
      {/* Center divider */}
      <rect x="14" y="62" width="82" height="4" fill="var(--accent)" opacity="0.1" />
      {/* Center clasp */}
      <rect x="50" y="58" width="10" height="10" rx="3" fill="var(--paper-warm)" stroke="var(--accent)" strokeWidth="1.5" opacity="0.8" />
      {/* Contents lines */}
      <rect x="28" y="48" width="30" height="3" rx="1.5" fill="var(--ink-faint)" opacity="0.5" />
      <rect x="28" y="54" width="22" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.35" />
      <rect x="74" y="48" width="14" height="3" rx="1.5" fill="var(--accent)" opacity="0.4" />
      {/* Bottom content */}
      <rect x="28" y="74" width="40" height="3" rx="1.5" fill="var(--ink-faint)" opacity="0.35" />
      <rect x="28" y="80" width="28" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.25" />
      {/* Floating tag */}
      <rect x="72" y="72" width="20" height="12" rx="4" fill="var(--accent)" opacity="0.2" stroke="var(--accent)" strokeWidth="1" />
      <rect x="75" y="76" width="14" height="2" rx="1" fill="var(--accent)" opacity="0.5" />
      <rect x="75" y="80" width="10" height="2" rx="1" fill="var(--accent)" opacity="0.35" />
    </svg>
  );
}

function IllustrationNegotiator() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Dollar coin shadow */}
      <circle cx="62" cy="62" r="36" fill="var(--border)" opacity="0.35" />
      {/* Dollar coin body */}
      <circle cx="58" cy="58" r="36" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="1.5" />
      {/* Coin inner ring */}
      <circle cx="58" cy="58" r="28" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" />
      {/* Dollar sign */}
      <text x="58" y="66" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--accent)" fontFamily="DM Serif Display, Georgia, serif" opacity="0.8">$</text>
      {/* Sparkle rays */}
      <line x1="58" y1="10" x2="58" y2="18" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <line x1="97" y1="25" x2="91" y2="31" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      {/* Floating up-arrow chips */}
      <rect x="88" y="10" width="22" height="14" rx="4" fill="var(--accent)" opacity="0.15" stroke="var(--accent)" strokeWidth="1" />
      <text x="99" y="21" textAnchor="middle" fontSize="9" fill="var(--accent)" fontWeight="700" opacity="0.7">↑ +12%</text>
    </svg>
  );
}

function IllustrationSearch() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Magnifier shadow */}
      <circle cx="52" cy="52" r="30" fill="var(--border)" opacity="0.35" />
      {/* Magnifier glass */}
      <circle cx="48" cy="48" r="30" fill="var(--paper-card)" stroke="var(--border)" strokeWidth="2" />
      <circle cx="48" cy="48" r="22" stroke="var(--accent)" strokeWidth="2" opacity="0.2" />
      {/* Search lines inside */}
      <rect x="34" y="43" width="28" height="3" rx="1.5" fill="var(--ink-faint)" opacity="0.5" />
      <rect x="34" y="50" width="20" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.35" />
      <rect x="34" y="56" width="24" height="2.5" rx="1.25" fill="var(--ink-faint)" opacity="0.35" />
      {/* Handle */}
      <line x1="71" y1="71" x2="96" y2="96" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
      <line x1="71" y1="71" x2="96" y2="96" stroke="var(--paper-card)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* No-result X */}
      <circle cx="48" cy="48" r="12" fill="var(--accent)" opacity="0.08" />
      <line x1="42" y1="42" x2="54" y2="54" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1="54" y1="42" x2="42" y2="54" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// ─── Illustration map ────────────────────────────────────────────────────────
type IllustrationType = "resume" | "applications" | "negotiator" | "search";

const ILLUSTRATIONS: Record<IllustrationType, React.ReactNode> = {
  resume: <IllustrationResume />,
  applications: <IllustrationApplications />,
  negotiator: <IllustrationNegotiator />,
  search: <IllustrationSearch />,
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  illustration?: IllustrationType;
  title: string;
  description: string;
  /** For link-based CTAs */
  ctaHref?: string;
  ctaLabel?: string;
  /** For button-based CTAs */
  onCtaClick?: () => void;
  /** Secondary action link */
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Extra wrapper class */
  className?: string;
  /** Compact mode — smaller padding/text for panels */
  compact?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EmptyState({
  illustration = "resume",
  title,
  description,
  ctaHref,
  ctaLabel,
  onCtaClick,
  secondaryHref,
  secondaryLabel,
  className = "",
  compact = false,
}: EmptyStateProps) {
  return (
    <>
      <style>{`
        @keyframes emptyFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes emptyFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .empty-state-root {
          animation: emptyFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .empty-state-illus {
          animation: emptyFloat 4s ease-in-out infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .empty-state-root { animation: none; }
          .empty-state-illus { animation: none; }
        }
      `}</style>

      <div
        className={`empty-state-root flex flex-col items-center justify-center text-center ${
          compact ? "py-10 px-6" : "py-16 px-8"
        } ${className}`}
      >
        {/* Ambient glow behind illustration */}
        <div className="relative mb-6">
          <div
            style={{
              position: "absolute",
              inset: "-20px",
              background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(16px)",
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />
          <div className="empty-state-illus relative z-10">
            {ILLUSTRATIONS[illustration]}
          </div>
        </div>

        {/* Text */}
        <h3
          className={`font-display font-bold text-ink mb-2 ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-ink-muted leading-relaxed max-w-xs mb-8 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {description}
        </p>

        {/* CTAs */}
        {(ctaLabel || onCtaClick) && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Primary CTA */}
            {ctaHref ? (
              <Link
                href={ctaHref}
                className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold no-underline shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
              >
                {ctaLabel}
              </Link>
            ) : onCtaClick ? (
              <button
                onClick={onCtaClick}
                className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 cursor-pointer"
              >
                {ctaLabel}
              </button>
            ) : null}

            {/* Secondary CTA */}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="text-sm font-semibold text-accent border border-accent-border hover:bg-accent-bg px-4 py-2.5 rounded-xl no-underline transition-all duration-200"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
