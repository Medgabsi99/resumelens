"use client";

import { useState, useEffect, useCallback } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * ScrollToTop
 * Appears after the user scrolls down 320px.
 * Smoothly scrolls to the top of the page on click.
 * Respects prefers-reduced-motion.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 320);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });

    // Trigger leave animation then hide
    setLeaving(true);
    setTimeout(() => setLeaving(false), 350);
  }, [reduced]);

  if (!visible && !leaving) return null;

  return (
    <>
      <style>{`
        @keyframes stt-in {
          from { opacity: 0; transform: translateY(12px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes stt-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(12px) scale(0.85); }
        }
        .stt-btn {
          animation: stt-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .stt-btn.leaving {
          animation: stt-out 0.22s ease forwards;
        }
        .stt-btn:hover .stt-arrow {
          transform: translateY(-2px);
        }
        .stt-arrow {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .stt-btn, .stt-btn.leaving { animation: none; }
          .stt-arrow { transition: none; }
        }
      `}</style>

      <button
        onClick={handleClick}
        aria-label="Scroll back to top"
        title="Scroll to top"
        className={`stt-btn${leaving ? " leaving" : ""}`}
        style={{
          position: "fixed",
          bottom: 92,
          right: 28,
          zIndex: 9999,
          width: 42,
          height: 42,
          borderRadius: 14,
          border: "1px solid var(--accent-border, rgba(99,102,241,0.35))",
          background: "var(--paper-card)",
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.04), 0 0 12px rgba(99,102,241,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--accent)",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-bg)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 20px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06), 0 0 20px rgba(99,102,241,0.22)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--paper-card)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 12px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.04), 0 0 12px rgba(99,102,241,0.12)";
        }}
      >
        <svg
          className="stt-arrow"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
