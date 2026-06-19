"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  score: number;
  /** Size in px — the SVG viewBox is always 200×200 */
  size?: number;
  /** If true, the ring animates in on mount. Default: true */
  animate?: boolean;
  /** Show the letter grade badge below the number. Default: true */
  showGrade?: boolean;
  /** Show "ATS Score" label above the number. Default: true */
  showLabel?: boolean;
}

function getScoreTheme(score: number): {
  color: string;
  glow: string;
  trackColor: string;
  grade: string;
  gradeBg: string;
  label: string;
} {
  if (score >= 85) {
    return {
      color: "#10b981",       // emerald
      glow: "rgba(16,185,129,0.35)",
      trackColor: "rgba(16,185,129,0.12)",
      grade: "A",
      gradeBg: "rgba(16,185,129,0.1)",
      label: "Excellent",
    };
  }
  if (score >= 70) {
    return {
      color: "#6366f1",       // indigo / accent
      glow: "rgba(99,102,241,0.35)",
      trackColor: "rgba(99,102,241,0.12)",
      grade: "B",
      gradeBg: "rgba(99,102,241,0.1)",
      label: "Good",
    };
  }
  if (score >= 55) {
    return {
      color: "#f59e0b",       // amber
      glow: "rgba(245,158,11,0.35)",
      trackColor: "rgba(245,158,11,0.12)",
      grade: "C",
      gradeBg: "rgba(245,158,11,0.1)",
      label: "Fair",
    };
  }
  return {
    color: "#ef4444",         // red
    glow: "rgba(239,68,68,0.35)",
    trackColor: "rgba(239,68,68,0.12)",
    grade: "D",
    gradeBg: "rgba(239,68,68,0.1)",
    label: "Needs Work",
  };
}

// easeOutExpo for a premium feel
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function ScoreRing({
  score,
  size = 200,
  animate = true,
  showGrade = true,
  showLabel = true,
}: Props) {
  const RADIUS = 78;
  const STROKE = 10;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const theme = getScoreTheme(score);

  // Animated display number (counts up)
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  // Animated ring progress (0 → score)
  const [progress, setProgress] = useState(animate ? 0 : score);
  // Glow pulse after animation completes
  const [glowPulse, setGlowPulse] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION = 1400; // ms

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      setProgress(score);
      return;
    }

    // Reset on score change
    setDisplayScore(0);
    setProgress(0);
    setGlowPulse(false);

    // Small delay so the panel fade-in finishes first
    const delayTimer = setTimeout(() => {
      startTimeRef.current = null;

      function tick(now: number) {
        if (!startTimeRef.current) startTimeRef.current = now;
        const elapsed = now - startTimeRef.current;
        const rawT = Math.min(elapsed / DURATION, 1);
        const t = easeOutExpo(rawT);

        const currentScore = Math.round(t * score);
        setDisplayScore(currentScore);
        setProgress(t * score);

        if (rawT < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // Animation done — trigger glow pulse
          setGlowPulse(true);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }, 300);

    return () => {
      clearTimeout(delayTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, animate]);

  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
      }}
      role="img"
      aria-label={`ATS Score: ${score} out of 100 — ${theme.label}`}
    >
      {/* Outer ambient glow — pulses once on complete */}
      <div
        style={{
          position: "absolute",
          inset: "-12px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
          filter: "blur(20px)",
          opacity: glowPulse ? 0.9 : 0.3,
          transition: "opacity 0.6s ease",
          pointerEvents: "none",
        }}
      />

      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
      >
        <defs>
          {/* Conic-like gradient for the ring */}
          <linearGradient id={`ring-grad-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={theme.color} stopOpacity="1" />
          </linearGradient>

          {/* Drop shadow filter */}
          <filter id={`ring-shadow-${score}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feFlood floodColor={theme.color} floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track ring */}
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke={theme.trackColor}
          strokeWidth={STROKE}
        />

        {/* Track tick marks */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * 2 * Math.PI - Math.PI / 2;
          const innerR = RADIUS - STROKE / 2 - 1;
          const outerR = RADIUS + STROKE / 2 + 1;
          return (
            <line
              key={i}
              x1={100 + innerR * Math.cos(angle)}
              y1={100 + innerR * Math.sin(angle)}
              x2={100 + outerR * Math.cos(angle)}
              y2={100 + outerR * Math.sin(angle)}
              stroke="var(--paper-card)"
              strokeWidth={1.5}
              opacity={0.6}
            />
          );
        })}

        {/* Progress arc */}
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke={`url(#ring-grad-${score})`}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter={`url(#ring-shadow-${score})`}
          style={{ transition: "none" }} // We drive this with rAF, not CSS
        />

        {/* Glowing dot at the tip of the arc */}
        {progress > 3 && (() => {
          const angle = ((progress / 100) * 2 * Math.PI) - Math.PI / 2;
          const tipX = 100 + RADIUS * Math.cos(angle);
          const tipY = 100 + RADIUS * Math.sin(angle);
          return (
            <circle
              cx={tipX}
              cy={tipY}
              r={STROKE / 2 + 1}
              fill={theme.color}
              opacity={0.9}
            />
          );
        })()}
      </svg>

      {/* Center content — counter-rotate to stay upright */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {showLabel && (
          <div
            style={{
              fontSize: size * 0.07,
              fontFamily: "DM Mono, monospace",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--ink-faint)",
              lineHeight: 1,
            }}
          >
            ATS Score
          </div>
        )}

        {/* Big animated number */}
        <div
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: size * 0.28,
            fontWeight: 700,
            lineHeight: 1,
            color: theme.color,
            letterSpacing: "-2px",
            // Subtle scale-up when glow triggers
            transform: glowPulse ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s ease",
          }}
        >
          {displayScore}
        </div>

        <div
          style={{
            fontSize: size * 0.065,
            fontFamily: "DM Mono, monospace",
            color: "var(--ink-faint)",
            lineHeight: 1,
          }}
        >
          / 100
        </div>

        {showGrade && (
          <div
            style={{
              marginTop: size * 0.025,
              padding: `${size * 0.018}px ${size * 0.06}px`,
              borderRadius: 999,
              background: theme.gradeBg,
              border: `1px solid ${theme.color}30`,
              display: "flex",
              alignItems: "center",
              gap: size * 0.025,
            }}
          >
            <span
              style={{
                fontSize: size * 0.075,
                fontWeight: 800,
                fontFamily: "DM Serif Display, serif",
                color: theme.color,
                lineHeight: 1,
              }}
            >
              {theme.grade}
            </span>
            <span
              style={{
                fontSize: size * 0.058,
                fontWeight: 600,
                color: theme.color,
                fontFamily: "Instrument Sans, sans-serif",
                opacity: 0.85,
              }}
            >
              {theme.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
