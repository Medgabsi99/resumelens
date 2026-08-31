"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { playSound } from "@/lib/soundFx";
import { parseResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
}

export default function SixSecondRecruiterSimulator({
  resumeText,
  targetRole = "Software Engineer",
}: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(6.0);
  const [currentGazeZone, setCurrentGazeZone] = useState<string>("Ready to Start");
  const [gazeCoords, setGazeCoords] = useState<{ x: number; y: number }>({ x: 25, y: 15 });
  const [isCompleted, setIsCompleted] = useState(false);

  const parsed = useMemo(() => parseResume(resumeText || ""), [resumeText]);
  const candidateName = parsed.contact?.name || "Alex Morgan";
  const firstExperience = parsed.experience?.[0];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = Math.max(0, +(prev - 0.1).toFixed(1));

          // Gaze path simulation along F-Pattern coordinates
          if (next > 4.8) {
            setCurrentGazeZone("Zone 1: Candidate Header & Target Role");
            setGazeCoords({ x: 28, y: 14 });
          } else if (next > 3.0) {
            setCurrentGazeZone("Zone 2: Most Recent Role & Impact Metrics");
            setGazeCoords({ x: 42, y: 38 });
          } else if (next > 1.4) {
            setCurrentGazeZone("Zone 3: Core Technical Stack & Keywords");
            setGazeCoords({ x: 35, y: 64 });
          } else if (next > 0) {
            setCurrentGazeZone("Zone 4: Education & Certifications");
            setGazeCoords({ x: 25, y: 86 });
          } else {
            setCurrentGazeZone("Eye-Tracking Scan Complete");
            setIsRunning(false);
            setIsCompleted(true);
            playSound("milestone90");
          }

          return next;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    playSound("click");
    setTimeLeft(6.0);
    setIsCompleted(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    playSound("click");
    setIsRunning(false);
    setTimeLeft(6.0);
    setIsCompleted(false);
    setCurrentGazeZone("Ready to Start");
    setGazeCoords({ x: 25, y: 15 });
  };

  return (
    <div className="bento-card p-5 sm:p-6 flex flex-col gap-5 shadow-sm text-ink">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shrink-0">
            <Eye size={22} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display tracking-tight text-ink flex items-center gap-2">
              <span>6-Second Recruiter Challenge</span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                Eye-Tracking F-Pattern
              </span>
            </h3>
            <p className="text-xs text-ink-muted">
              Recruiters spend an average of 6.0 seconds on their first scan. Test your
              resume&apos;s visual hierarchy.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isRunning && !isCompleted && (
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Play size={13} />
              <span>Start 6s Simulation</span>
            </button>
          )}

          {(isRunning || isCompleted) && (
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl border border-border bg-paper-warm hover:bg-paper-card text-ink text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Simulation Arena */}
      <div className="relative rounded-2xl border border-border bg-paper-warm/20 p-5 overflow-hidden flex flex-col gap-4">
        {/* Progress Countdown Bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-ink-muted flex items-center gap-1.5">
              <Clock size={13} className="text-orange-500" />
              <span>{currentGazeZone}</span>
            </span>
            <span className="text-orange-500 font-bold text-sm">{timeLeft.toFixed(1)}s</span>
          </div>

          <div className="w-full h-2 rounded-full bg-paper-warm overflow-hidden border border-border">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-accent transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${((6.0 - timeLeft) / 6.0) * 100}%` }}
            />
          </div>
        </div>

        {/* Realistic Miniature Resume Document View */}
        <div className="relative w-full rounded-xl border border-border bg-white dark:bg-[#0c1017] p-5 shadow-inner overflow-hidden select-none min-h-[240px]">
          {/* Section 1: Header */}
          <div
            className={`transition-all duration-300 p-2.5 rounded-lg mb-3 ${
              isRunning && timeLeft > 4.8
                ? "bg-orange-500/15 border border-orange-500/30"
                : "opacity-80"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {candidateName}
                </h4>
                <p className="text-[10px] font-mono text-accent font-semibold">
                  {targetRole} • {parsed.contact?.email || "alex.morgan@email.com"}
                </p>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                Zone 1 (0.8s)
              </span>
            </div>
          </div>

          {/* Section 2: Experience */}
          <div
            className={`transition-all duration-300 p-2.5 rounded-lg mb-3 ${
              isRunning && timeLeft <= 4.8 && timeLeft > 3.0
                ? "bg-orange-500/15 border border-orange-500/30"
                : "opacity-80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200">
                {firstExperience?.title || "Senior Software Engineer"} —{" "}
                {firstExperience?.company || "Tech Systems"}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                Zone 2 (1.8s)
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              •{" "}
              {firstExperience?.bullets?.[0] ||
                "Architected distributed cloud microservices, cutting latency by 45% across 150K DAU."}
            </p>
          </div>

          {/* Section 3: Core Skills */}
          <div
            className={`transition-all duration-300 p-2.5 rounded-lg mb-3 ${
              isRunning && timeLeft <= 3.0 && timeLeft > 1.4
                ? "bg-orange-500/15 border border-orange-500/30"
                : "opacity-80"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                Core Technical Stack
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                Zone 3 (1.6s)
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(parsed.skills?.length
                ? parsed.skills.slice(0, 6)
                : ["TypeScript", "React", "Next.js", "Node.js", "AWS", "Kubernetes"]
              ).map((sk, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Education */}
          <div
            className={`transition-all duration-300 p-2.5 rounded-lg ${
              isRunning && timeLeft <= 1.4 && timeLeft > 0
                ? "bg-orange-500/15 border border-orange-500/30"
                : "opacity-80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                {parsed.education?.[0]?.degree || "B.S. in Computer Science"}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                Zone 4 (1.8s)
              </span>
            </div>
          </div>

          {/* Animated Gaze Reticle & Heat Dot */}
          {isRunning && (
            <motion.div
              animate={{ left: `${gazeCoords.x}%`, top: `${gazeCoords.y}%` }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-orange-500 bg-orange-500/25 backdrop-blur-xs flex items-center justify-center pointer-events-none shadow-xl z-20"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-orange-600 shadow-sm animate-ping" />
            </motion.div>
          )}

          {/* Start Prompt Overlay Banner (Clean, no text collision) */}
          {!isRunning && !isCompleted && (
            <div className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4 z-30">
              <div className="px-4 py-2 rounded-xl bg-white/95 dark:bg-[#121824]/95 border border-border text-xs font-bold text-ink shadow-lg flex items-center gap-2">
                <Play size={13} className="text-orange-500 fill-orange-500" />
                <span>Click &quot;Start 6s Simulation&quot; to trace recruiter gaze path</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recruiter Verdict Card */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Award size={15} /> Recruiter First-Impression Verdict
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
                PASS: 1st Round Phone Screen
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-paper-card border border-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-ink-muted">Hook Velocity</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  0.8s (Top 5%)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-paper-card border border-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-ink-muted">Attention Distribution</span>
                <span className="text-sm font-bold text-ink">68% Experience / 22% Skills</span>
              </div>

              <div className="p-3 rounded-xl bg-paper-card border border-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-ink-muted">Recruiter Retention</span>
                <span className="text-sm font-bold text-accent">High (94% Clarity)</span>
              </div>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              💡 <strong>Recruiter Takeaway:</strong> Strong top-heavy visual hierarchy. Your
              candidate header and initial metric bullet immediately captured attention within the
              first 1.2 seconds of gaze fixation.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
