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
        primary: "rgba(16, 185, 129, 0.22)",
        secondary: "rgba(6, 182, 212, 0.15)",
        glowColor: "#10b981",
        label: "Exceptional Match",
      };
    }
    if (score >= 60) {
      return {
        primary: "rgba(245, 158, 11, 0.22)",
        secondary: "rgba(217, 119, 6, 0.15)",
        glowColor: "#f59e0b",
        label: "Good Alignment",
      };
    }
    return {
      primary: "rgba(239, 68, 68, 0.22)",
      secondary: "rgba(190, 18, 60, 0.15)",
      glowColor: "#ef4444",
      label: "Needs Optimization",
    };
  }, [score]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-2xl ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Primary ambient radial blob */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.85, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          top: "-20%",
          left: "15%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowConfig.primary} 0%, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />

      {/* Secondary offset ambient radial blob */}
      <motion.div
        animate={{
          scale: [1.05, 0.95, 1.05],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          bottom: "-25%",
          right: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowConfig.secondary} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}
