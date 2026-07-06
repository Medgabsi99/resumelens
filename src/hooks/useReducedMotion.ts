"use client";

import { useState, useEffect } from "react";

/**
 * useReducedMotion
 * Reactively mirrors the user's `prefers-reduced-motion: reduce` preference.
 *
 * - Returns `true` immediately if the preference is set on mount.
 * - Updates live if the user changes system settings while the app is open.
 * - Always returns `false` on the server (SSR-safe).
 *
 * Usage:
 *   const reduced = useReducedMotion();
 *   const duration = reduced ? 0 : 300;
 */
export function useReducedMotion(): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Use addEventListener if available, fall back to addListener (older Safari)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      mql.addListener(handler);
      return () => {
        mql.removeListener(handler);
      };
    }
  }, []);

  return matches;
}

/**
 * getReducedMotion
 * Synchronous, non-reactive read — for use outside React (e.g. in event handlers,
 * before animation libraries fire). Not SSR-safe.
 */
export function getReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
