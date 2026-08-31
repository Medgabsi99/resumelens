"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  score: number;
  className?: string;
}

export default function AmbientScoreGlow({ score, className = "" }: Props) {
  const glowConfig = useMemo(() => {
    if (score >= 80) {
      return {
        primary: "rgba(16, 185, 129, 0.18)",
        secondary: "rgba(6, 182, 212, 0.12)",
        glowColor: "#10b981",
        label: "Exceptional Match",
      };
    }
    if (score >= 60) {
      return {
        primary: "rgba(245, 158, 11, 0.18)",
        secondary: "rgba(217, 119, 6, 0.12)",
        glowColor: "#f59e0b",
        label: "Good Alignment",
      };
    }
    return {
      primary: "rgba(239, 68, 68, 0.18)",
      secondary: "rgba(190, 18, 60, 0.12)",
      glowColor: "#ef4444",
      label: "Needs Optimization",
    };
  }, [score]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-2xl ${className}`}
      style={{ zIndex: 0, contain: "strict", transform: "translate3d(0, 0, 0)" }}
    >
      {/* Primary ambient radial blob */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.85, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          top: "-15%",
          left: "15%",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowConfig.primary} 0%, rgba(0,0,0,0.04) 45%, rgba(0,0,0,0) 70%)`,
          transform: "translate3d(0, 0, 0)",
          willChange: "transform, opacity",
        }}
      />

      {/* Secondary offset ambient radial blob */}
      <motion.div
        animate={{
          scale: [1.03, 0.97, 1.03],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "10%",
          width: "340px",
          height: "340px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowConfig.secondary} 0%, rgba(0,0,0,0.03) 45%, rgba(0,0,0,0) 70%)`,
          transform: "translate3d(0, 0, 0)",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
