"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTransition
 *
 * Wraps page content with a smooth enter animation on route change.
 * On exit: fast fade + micro-slide up.
 * On enter: fade-up from slightly below (16px).
 *
 * Respects `prefers-reduced-motion` — falls back to an instant opacity fade.
 */
export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const prevPath = useRef(pathname);
  // Reactive — updates if user changes OS preference while app is open
  const prefersReduced = useReducedMotion();

useEffect(() => {
  if (pathname === prevPath.current) return;
  prevPath.current = pathname;

  if (prefersReduced) {
    setDisplayChildren(children);
    return;
  }

  setPhase("exit");
  const exitTimer = setTimeout(() => {
    setDisplayChildren(children);
    setPhase("enter");
    const enterTimer = setTimeout(() => setPhase("idle"), 480);
    return () => clearTimeout(enterTimer);
  }, 90);

  return () => clearTimeout(exitTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pathname]);

// ── Effect 2: silently sync children on SAME-ROUTE updates ──────────
useEffect(() => {
  if (pathname !== prevPath.current) return; // route change handled above
  setDisplayChildren(children);
}, [children, pathname]);

  const getStyle = (): React.CSSProperties => {
    switch (phase) {
      case "exit":
        return {
          opacity: 0,
          transform: "translateY(-6px)",
          transition: "opacity 0.09s ease, transform 0.09s ease",
          pointerEvents: "none",
        };
      case "enter":
        return {
          opacity: 1,
          transform: "translateY(0)",
          animation: "pageEnter 0.46s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        };
      case "idle":
      default:
        return {
          opacity: 1,
          transform: "translateY(0)",
        };
    }
  };

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes pageEnter {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes pageEnter {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
      `}</style>

      <div
        style={getStyle()}
        className={className}
        // Key ensures React doesn't try to re-use the exit element
      >
        {displayChildren}
      </div>
    </>
  );
}
