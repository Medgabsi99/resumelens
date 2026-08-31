"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  X,
  Sparkles,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  HelpCircle,
  Award,
} from "lucide-react";
import { generateStarCoaching, type StarOutline } from "@/lib/ai/starInterviewCoach";
import { playSound } from "@/lib/soundFx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bulletText: string;
  targetRole?: string;
}

export default function StarInterviewCoachModal({
  isOpen,
  onClose,
  bulletText,
  targetRole = "Software Engineer",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const starData: StarOutline = generateStarCoaching(bulletText || "", targetRole);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!isOpen) return null;

  const handleCopy = () => {
    playSound("apply");
    const formatted = `BEHAVIORAL INTERVIEW STAR OUTLINE
Question: ${starData.predictedQuestion}

• [SITUATION]: ${starData.situation}
• [TASK]: ${starData.task}
• [ACTION]: ${starData.action}
• [RESULT]: ${starData.result}

💡 Gotcha to Avoid: ${starData.trapToAvoid}`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetTimer = () => {
    playSound("click");
    setIsTimerRunning(false);
    setSecondsElapsed(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bento-card w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative text-ink rounded-3xl overflow-hidden bg-paper-card"
      >
        {/* ── Fixed Sticky Header ────────────────────────────── */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border flex items-center justify-between shrink-0 bg-paper-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <Mic size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-ink">
                AI STAR Interview Coach &amp; Question Predictor
              </h2>
              <p className="text-xs text-ink-muted">
                Transform your resume accomplishment into an articulate 90-second behavioral
                response.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-paper-warm transition shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Body Area ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Original Bullet Point Chip */}
          <div className="p-3.5 rounded-xl bg-paper-warm border border-border text-xs font-mono text-ink-muted flex items-start gap-2.5">
            <span className="text-accent font-bold mt-0.5">•</span>
            <span className="text-ink font-medium leading-relaxed">
              {bulletText || "No bullet selected"}
            </span>
          </div>

          {/* Predicted Recruiter Question Card */}
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col gap-1.5 shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
              <Sparkles size={12} /> Predicted Behavioral Question
            </span>
            <p className="text-sm font-bold text-ink leading-relaxed">
              &ldquo;{starData.predictedQuestion}&rdquo;
            </p>
          </div>

          {/* 4-Part STAR Outline */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-border bg-paper-warm/40 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-mono font-bold uppercase text-blue-500">
                1. Situation
              </span>
              <p className="text-xs text-ink leading-relaxed">{starData.situation}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-paper-warm/40 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-mono font-bold uppercase text-amber-500">
                2. Task
              </span>
              <p className="text-xs text-ink leading-relaxed">{starData.task}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-paper-warm/40 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-mono font-bold uppercase text-emerald-500">
                3. Action
              </span>
              <p className="text-xs text-ink leading-relaxed">{starData.action}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-paper-warm/40 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-mono font-bold uppercase text-amber-500">
                4. Result
              </span>
              <p className="text-xs text-ink leading-relaxed">{starData.result}</p>
            </div>
          </div>

          {/* Interviewer Trap Warning */}
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Interviewer Trap to Avoid: </strong>
              <span>{starData.trapToAvoid}</span>
            </div>
          </div>
        </div>

        {/* ── Fixed Sticky Pinned Footer ──────────────────────── */}
        <div className="p-4 sm:px-6 border-t border-border bg-paper-card flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
          {/* 90s Practice Timer */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                playSound("click");
                setIsTimerRunning((v) => !v);
              }}
              className="p-2 px-3 rounded-xl bg-paper-warm border border-border text-ink hover:bg-paper-card transition flex items-center gap-1.5 text-xs font-bold font-mono shadow-xs"
            >
              {isTimerRunning ? (
                <Pause size={13} className="text-amber-500" />
              ) : (
                <Play size={13} className="text-emerald-500" />
              )}
              <span>{isTimerRunning ? "Pause" : "Practice Speech"}</span>
            </button>
            <span className="font-mono text-xs font-bold text-ink bg-paper-warm/60 px-2 py-1 rounded-lg border border-border/40">
              {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, "0")}{" "}
              / 1:30
            </span>
            {secondsElapsed > 0 && (
              <button
                onClick={handleResetTimer}
                className="p-1 text-ink-muted hover:text-ink transition"
                title="Reset timer"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl border border-border bg-paper-warm/60 hover:bg-paper-warm text-xs font-bold text-ink transition flex items-center gap-1.5"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? "Copied!" : "Copy STAR Outline"}</span>
            </button>
            <button
              onClick={() => {
                playSound("click");
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover transition shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
