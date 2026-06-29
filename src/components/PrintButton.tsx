"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  /** Label shown on the button. Defaults to "Print / Export PDF" */
  label?: string;
  /** Extra Tailwind / CSS classes */
  className?: string;
}

/**
 * PrintButton
 *
 * Triggers window.print() which uses the @media print styles defined in
 * globals.css to produce a clean, chrome-free printable / PDF export.
 *
 * Hides itself from the printed page via the `no-print` utility class.
 */
export default function PrintButton({ label = "Print / Export PDF", className = "" }: Props) {
  const reduced = useReducedMotion();

  return (
    <button
      onClick={() => window.print()}
      className={`no-print ${className}`}
      aria-label="Print or export this page as PDF"
      title="Print / Save as PDF (Ctrl+P)"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 14px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--paper-card)",
        color: "var(--ink-muted)",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: reduced ? "none" : "all 0.15s ease",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => {
        if (reduced) return;
        const el = e.currentTarget;
        el.style.color = "var(--accent)";
        el.style.borderColor = "var(--accent-border)";
        el.style.background = "var(--accent-bg)";
      }}
      onMouseLeave={(e) => {
        if (reduced) return;
        const el = e.currentTarget;
        el.style.color = "var(--ink-muted)";
        el.style.borderColor = "var(--border)";
        el.style.background = "var(--paper-card)";
      }}
    >
      {/* Printer SVG icon */}
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
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  );
}
