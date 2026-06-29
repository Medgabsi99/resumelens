"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

// ─── Route metadata map ────────────────────────────────────────────────────────
// Maps pathname segments → human-readable labels + optional icons
const SEGMENT_META: Record<string, { label: string; icon: string }> = {
  dashboard:      { label: "Dashboard",          icon: "⌂" },
  applications:   { label: "Job Applications",   icon: "💼" },
  negotiator:     { label: "Salary Negotiator",  icon: "💰" },
  interviews:     { label: "Mock Interviews",    icon: "🎙️" },
  scanner:        { label: "ATS Scanner",        icon: "🔍" },
  "learning-paths": { label: "Learning Paths",  icon: "🎓" },
  tailor:         { label: "Tailor Sandbox",     icon: "✨" },
  committee:      { label: "Recruiter Sandbox",  icon: "👥" },
  settings:       { label: "Settings",           icon: "⚙️" },
};

// Detect UUID-like IDs (analysis detail pages, e.g. /dashboard/abc-123)
const UUID_REGEX =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const SHORT_ID_REGEX = /^[0-9a-f]{20,}$/i;

function humanizeSegment(segment: string): { label: string; icon: string } {
  if (SEGMENT_META[segment]) return SEGMENT_META[segment];
  if (UUID_REGEX.test(segment) || SHORT_ID_REGEX.test(segment)) {
    return { label: "Analysis Report", icon: "📊" };
  }
  // Fallback: title-case the segment
  return {
    label: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: "›",
  };
}

// ─── Separator SVG ─────────────────────────────────────────────────────────────
function ChevronSeparator() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: "var(--ink-faint)", flexShrink: 0 }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ─── Home icon ─────────────────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

// ─── Individual crumb ─────────────────────────────────────────────────────────
interface Crumb {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
  isHome: boolean;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Breadcrumbs() {
  const pathname = usePathname();

  const crumbs = useMemo<Crumb[]>(() => {
    // Split and filter empty segments
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const { label, icon } = humanizeSegment(seg);
      const isLast = idx === segments.length - 1;
      const isHome = seg === "dashboard" && idx === 0;

      return {
        href,
        label,
        icon,
        isActive: isLast,
        isHome,
      };
    });
  }, [pathname]);

  // Don't render on top-level pages where there's only one crumb
  if (crumbs.length <= 1) return null;

  return (
    <>
      <style>{`
        @keyframes crumbFadeIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .breadcrumb-crumb {
          animation: crumbFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .breadcrumb-link:hover .breadcrumb-label {
          color: var(--accent);
        }
        .breadcrumb-link:hover {
          background: var(--accent-bg);
          border-color: var(--accent-border);
        }
        .breadcrumb-active-pill {
          position: relative;
        }
        .breadcrumb-active-pill::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--accent);
          opacity: 0.08;
          border-radius: 8px;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .breadcrumb-crumb { animation: none; }
        }
      `}</style>

      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {/* Home crumb — always shown as icon-only */}
        <div
          className="breadcrumb-crumb"
          style={{ animationDelay: "0ms", display: "flex", alignItems: "center", gap: 4 }}
        >
          <Link
            href="/dashboard"
            aria-label="Dashboard home"
            className="breadcrumb-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid transparent",
              color: "var(--ink-muted)",
              textDecoration: "none",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
          >
            <HomeIcon />
          </Link>
          <ChevronSeparator />
        </div>

        {/* Dynamic crumbs */}
        {crumbs.map((crumb, idx) => {
          // Skip the "dashboard" root segment since we render it as home icon
          if (crumb.isHome) return null;

          const delay = (idx + 1) * 40;

          return (
            <div
              key={crumb.href}
              className="breadcrumb-crumb"
              style={{
                animationDelay: `${delay}ms`,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {crumb.isActive ? (
                // Active / current page — styled pill, no link
                <span
                  className="breadcrumb-active-pill"
                  aria-current="page"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--accent-border)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--accent)",
                    lineHeight: 1,
                    userSelect: "none",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {/* Active indicator dot */}
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                      boxShadow: "0 0 0 2px var(--accent-bg)",
                    }}
                  />
                  <span className="breadcrumb-label">{crumb.label}</span>
                </span>
              ) : (
                // Parent crumb — clickable link
                <>
                  <Link
                    href={crumb.href}
                    className="breadcrumb-link"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 8px",
                      borderRadius: 8,
                      border: "1px solid transparent",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--ink-muted)",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      lineHeight: 1,
                    }}
                  >
                    <span className="breadcrumb-label" style={{ transition: "color 0.15s" }}>
                      {crumb.label}
                    </span>
                  </Link>
                  {/* Only show separator if not the last non-home crumb */}
                  {idx < crumbs.length - 1 && <ChevronSeparator />}
                </>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
