"use client";

import { createContext, useContext, useCallback, useRef, useState, useEffect } from "react";
import { getReducedMotion } from "@/hooks/useReducedMotion";

// ─── Context & API ────────────────────────────────────────────────────────────
interface ProgressContextType {
  start: () => void;
  done: () => void;
  increment: (amount?: number) => void;
}

const ProgressContext = createContext<ProgressContextType>({
  start: () => {},
  done: () => {},
  increment: () => {},
});

export function useProgress() {
  return useContext(ProgressContext);
}

// ─── Provider & Bar ───────────────────────────────────────────────────────────
interface ProgressProviderProps {
  children: React.ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [value, setValue] = useState(0); // 0–100
  const [visible, setVisible] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const activeCountRef = useRef(0);
  const trickleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (trickleTimer.current) clearInterval(trickleTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    trickleTimer.current = null;
    hideTimer.current = null;
  }, []);

  const start = useCallback(() => {
    // In reduced-motion mode, skip the progress animation entirely
    if (getReducedMotion()) return;

    activeCountRef.current += 1;
    clearTimers();
    setFinishing(false);
    setVisible(true);
    setValue(0);

    // Double rAF so the browser paints 0% first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setValue(15);

        // Trickle: ease towards 90, slowing as we approach
        trickleTimer.current = setInterval(() => {
          setValue((prev) => {
            if (prev >= 90) return prev;
            // Trickle increment slows the higher we go
            const delta = (90 - prev) * 0.08 + 0.5;
            return Math.min(prev + delta, 90);
          });
        }, 300);
      });
    });
  }, [clearTimers]);

  const done = useCallback(() => {
    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
    if (activeCountRef.current > 0) return; // other callers still active

    clearTimers();
    setFinishing(false);
    setValue(100);

    hideTimer.current = setTimeout(() => {
      setFinishing(true);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setValue(0);
        setFinishing(false);
      }, 350);
    }, 200);
  }, [clearTimers]);

  const increment = useCallback((amount = 10) => {
    setValue((prev) => Math.min(prev + amount, 92));
  }, []);

  return (
    <ProgressContext.Provider value={{ start, done, increment }}>
      {children}
      <ProgressBar value={value} visible={visible} finishing={finishing} />
    </ProgressContext.Provider>
  );
}

// ─── Visual Bar Component ─────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  visible: boolean;
  finishing: boolean;
}

function ProgressBar({ value, visible, finishing }: ProgressBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || !visible) return null;

  return (
    <>
      <style>{`
        @keyframes shimmer-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 6px 3px var(--accent), 0 0 14px 4px var(--brand-glow, var(--accent)); }
          50%       { box-shadow: 0 0 10px 5px var(--accent), 0 0 22px 8px var(--brand-glow, var(--accent)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .progress-shimmer { animation: none !important; }
          .progress-dot     { animation: none !important; }
        }
      `}</style>

      {/* ── Track bar ── */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label="Page loading"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 100000,
          pointerEvents: "none",
          background: "var(--progress-track, rgba(99,102,241,0.08))",
        }}
      >
        {/* Filled portion */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${value}%`,
            background: "linear-gradient(90deg, var(--accent) 0%, #a78bfa 50%, var(--accent) 100%)",
            backgroundSize: "200% 100%",
            borderRadius: "0 3px 3px 0",
            transition: finishing
              ? "width 0.18s ease, opacity 0.3s ease 0.05s"
              : "width 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
            opacity: finishing ? 0 : 1,
            overflow: "hidden",
          }}
        >
          {/* Shimmer sweep */}
          <div
            className="progress-shimmer"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
              width: "40%",
              animation: "shimmer-slide 1.4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Glowing dot at leading edge */}
        {!finishing && (
          <div
            className="progress-dot"
            style={{
              position: "absolute",
              top: "50%",
              left: `${value}%`,
              transform: "translate(-50%, -50%)",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--paper-card)",
              border: "1.5px solid var(--accent)",
              boxShadow: "0 0 6px 3px var(--accent), 0 0 14px 4px var(--brand-glow, var(--accent))",
              animation: "pulse-dot 1.2s ease-in-out infinite",
              transition: "left 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 1,
            }}
          />
        )}
      </div>
    </>
  );
}

// ─── Route-change auto-trigger ────────────────────────────────────────────────
// Import this inside the Provider tree to auto-fire on navigation
import { usePathname } from "next/navigation";

export function RouteProgressTrigger() {
  const pathname = usePathname();
  const { start, done } = useProgress();
  const prevPath = useRef(pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPath.current = pathname;
      return;
    }
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    start();
    // Pages compile fast in dev; give a small window then auto-complete
    const t = setTimeout(done, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
