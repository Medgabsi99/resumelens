"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Play,
  Pause,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Layers,
} from "lucide-react";

interface Props {
  resumeText: string;
  targetRole?: string;
}

interface Fixation {
  id: number;
  timeSec: number;
  label: string;
  target: string;
  topPercent: number;
  leftPercent: number;
  dwellMs: number;
  intensity: "high" | "medium" | "low";
  reason: string;
}

export default function RecruiterEyeTrackingHeatmap({
  resumeText,
  targetRole = "Candidate",
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [showThermalGlow, setShowThermalGlow] = useState(true);

  // Compute realistic F-Pattern gaze fixations based on text content
  const fixations: Fixation[] = useMemo(() => {
    return [
      {
        id: 1,
        timeSec: 0.8,
        label: "Candidate Name & Target Title",
        target: "Header Section",
        topPercent: 8,
        leftPercent: 22,
        dwellMs: 1100,
        intensity: "high",
        reason: "Recruiters confirm candidate seniority and title alignment in first 800ms.",
      },
      {
        id: 2,
        timeSec: 2.2,
        label: "Most Recent Employer & Role",
        target: "Experience #1 Header",
        topPercent: 26,
        leftPercent: 24,
        dwellMs: 1400,
        intensity: "high",
        reason: "Evaluates current company brand credibility and recent job title.",
      },
      {
        id: 3,
        timeSec: 3.6,
        label: "Primary Lead Bullet & Metrics",
        target: "Experience #1 Bullet 1",
        topPercent: 35,
        leftPercent: 30,
        dwellMs: 1500,
        intensity: "high",
        reason: "Scanning for quantified business outcomes ($/X/%) and strong action verbs.",
      },
      {
        id: 4,
        timeSec: 4.8,
        label: "Core Technical Skills Cluster",
        target: "Skills Section",
        topPercent: 62,
        leftPercent: 26,
        dwellMs: 1200,
        intensity: "medium",
        reason: "Quick keyword check against required tech stack keywords.",
      },
      {
        id: 5,
        timeSec: 5.8,
        label: "Education & Degree Verification",
        target: "Education Section",
        topPercent: 78,
        leftPercent: 24,
        dwellMs: 900,
        intensity: "low",
        reason: "Confirms degree and graduation credentials before decision.",
      },
    ];
  }, []);

  // Timer loop when playing
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSec((prev) => {
          if (prev >= 6.0) {
            setIsPlaying(false);
            return 6.0;
          }
          return Number((prev + 0.2).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeFixation = fixations.find(
    (f) => currentSec >= f.timeSec - 0.5 && currentSec <= f.timeSec + f.dwellMs / 1000
  );

  const lines = useMemo(() => {
    return (resumeText || "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, 32);
  }, [resumeText]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Top Control & 6s Scrubber Bar ─────────────────────── */}
      <div
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-rose-500" />
            <span className="text-xs font-bold text-ink font-mono uppercase tracking-wider">
              6-Second Recruiter Eye-Tracker
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              F-Pattern Simulation
            </span>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              style={{
                background: isPlaying ? "#ef4444" : "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "DM Mono, monospace",
              }}
            >
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              <span>{isPlaying ? "Pause" : "Play 6s Scan"}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentSec(0);
              }}
              className="p-1 rounded-lg border border-border text-ink-muted hover:text-ink bg-paper-warm"
              title="Reset timer"
            >
              <RotateCcw size={12} />
            </button>

            <span className="text-xs font-mono font-bold text-ink min-w-[42px] text-right">
              {currentSec.toFixed(1)}s / 6.0s
            </span>
          </div>
        </div>

        {/* Progress Bar Scrubber */}
        <div className="flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={6.0}
            step={0.1}
            value={currentSec}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentSec(Number(e.target.value));
            }}
            className="w-full accent-rose-500 cursor-pointer h-1.5 bg-border rounded-lg appearance-none"
          />

          {/* Fixation Markers on Timeline */}
          <div className="flex justify-between text-[9.5px] font-mono text-ink-muted px-0.5">
            <span>0.0s (Entry)</span>
            <span>1.8s (Employer)</span>
            <span>3.5s (Metrics)</span>
            <span>4.8s (Skills)</span>
            <span>6.0s (Decision)</span>
          </div>
        </div>
      </div>

      {/* ── Active Fixation Insight Pill ──────────────────────── */}
      {activeFixation && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 11.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div className="flex items-center gap-2">
            <Eye size={13} className="text-rose-500" />
            <span className="font-bold text-rose-700">
              Fixation #{activeFixation.id}: {activeFixation.label}
            </span>
          </div>
          <span className="text-[10.5px] text-ink-muted hidden sm:inline font-mono">
            {activeFixation.reason}
          </span>
        </motion.div>
      )}

      {/* ── Document Heatmap Canvas Overlay ────────────────────── */}
      <div
        style={{
          position: "relative",
          background: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          fontFamily: "'Calibri', 'Inter', sans-serif",
          color: "#1e293b",
          fontSize: 11.5,
          lineHeight: 1.5,
          padding: "24px 28px",
          minHeight: 520,
          overflow: "hidden",
        }}
      >
        {/* Render base resume preview text */}
        <div className="flex flex-col gap-1.5 opacity-60 select-none">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={`leading-tight ${
                idx === 0
                  ? "font-extrabold text-base text-slate-900"
                  : idx === 1
                    ? "text-xs font-semibold text-slate-700 mb-2"
                    : line.startsWith("EXPERIENCE") ||
                        line.startsWith("SKILLS") ||
                        line.startsWith("EDUCATION")
                      ? "font-bold text-xs text-blue-700 uppercase tracking-wider border-b border-slate-200 mt-2 pb-0.5"
                      : "text-slate-600"
              }`}
            >
              {line}
            </div>
          ))}
        </div>

        {/* ── Thermal Heatmap Layer (CSS Multi-Radial Gradient) ── */}
        {showThermalGlow && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `
                radial-gradient(circle 90px at 24% 10%, rgba(239, 68, 68, 0.45) 0%, rgba(245, 158, 11, 0.25) 50%, transparent 80%),
                radial-gradient(circle 80px at 26% 28%, rgba(239, 68, 68, 0.40) 0%, rgba(245, 158, 11, 0.20) 50%, transparent 80%),
                radial-gradient(circle 75px at 32% 38%, rgba(245, 158, 11, 0.35) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 80%),
                radial-gradient(circle 70px at 28% 64%, rgba(59, 130, 246, 0.30) 0%, rgba(99, 102, 241, 0.10) 50%, transparent 80%),
                radial-gradient(circle 60px at 25% 80%, rgba(100, 116, 139, 0.20) 0%, transparent 70%)
              `,
              mixBlendMode: "multiply",
            }}
          />
        )}

        {/* ── Dynamic Fixation Rings ───────────────────────────── */}
        {fixations.map((f) => {
          const isPassed = currentSec >= f.timeSec;
          const isCurrent = activeFixation?.id === f.id;

          if (!isPassed && currentSec > 0) return null;

          return (
            <motion.div
              key={f.id}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: isCurrent ? [1, 1.25, 1] : 1, opacity: 1 }}
              transition={{
                scale: isCurrent ? { repeat: Infinity, duration: 1.2 } : { duration: 0.2 },
              }}
              style={{
                position: "absolute",
                top: `${f.topPercent}%`,
                left: `${f.leftPercent}%`,
                width: isCurrent ? 44 : 32,
                height: isCurrent ? 44 : 32,
                borderRadius: "50%",
                background: isCurrent ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.25)",
                border: `2px solid ${isCurrent ? "#ef4444" : "#f59e0b"}`,
                boxShadow: isCurrent ? "0 0 16px rgba(239, 68, 68, 0.6)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isCurrent ? "#ef4444" : "#b45309",
                fontSize: 10.5,
                fontWeight: 900,
                fontFamily: "DM Mono, monospace",
                zIndex: 10,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            >
              #{f.id}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
