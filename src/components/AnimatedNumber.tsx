"use client";

import { useEffect, useRef, useState } from "react";
import { getReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  /** Target value to count up to */
  value: number;
  /** String to append after the number, e.g. "%" */
  suffix?: string;
  /** String to prepend before the number, e.g. "$" */
  prefix?: string;
  /** Animation duration in ms (default 900) */
  duration?: number;
  /** If value === 0, render this string instead of "0" */
  zeroLabel?: string;
  /** Decimal places to display (default 0) */
  decimals?: number;
  /** CSS class on the outer span */
  className?: string;
  /** Inline style on the outer span */
  style?: React.CSSProperties;
}

/** easeOutExpo: fast start, smooth landing */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  duration = 900,
  zeroLabel,
  decimals = 0,
  className,
  style,
}: Props) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Trigger once on viewport entry
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  // Run rAF loop when triggered
  useEffect(() => {
    // Reduced-motion: snap straight to final value, skip counting animation
    if (getReducedMotion()) {
      setDisplay(value);
      return;
    }

    if (!started || value === 0) return;

    startTimeRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setDisplay(eased * value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value); // Snap to exact final value
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, value, duration]);

  // Formatted output
  const formatted =
    value === 0 && zeroLabel
      ? zeroLabel
      : `${prefix}${display.toFixed(decimals)}${suffix}`;

  return (
    <span ref={containerRef} className={className} style={style}>
      {formatted}
    </span>
  );
}
