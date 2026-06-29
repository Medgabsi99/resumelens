"use client";

import React, { useEffect, useState } from "react";

interface Step {
  id: number;
  label: string;
  sublabel: string;
  icon: string;
}

const STEPS: Step[] = [
  { id: 0, label: "Analyzing Layout Structure", sublabel: "Reading document columns & alignment rules", icon: "📄" },
  { id: 1, label: "Extracting Text Layer", sublabel: "Locating contact block, education, & experiences", icon: "🔍" },
  { id: 2, label: "Reranking Keywords", sublabel: "Comparing experience descriptions with target JD", icon: "🧠" },
  { id: 3, label: "Calibrating ATS Score", sublabel: "Checking styling, fonts, & margin rules", icon: "📊" },
  { id: 4, label: "Structuring AI Suggestions", sublabel: "Finalizing custom rewrite actions", icon: "✨" }
];

interface Props {
  currentStep: number;
}

export default function ParsingProgressVisualizer({ currentStep }: Props) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#0d0d15]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-8 animate-fade-in text-slate-100 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanLaser {
          0%, 100% { top: 0%; }
          50% { top: 96%; }
        }
      `}} />

      <div className="text-center space-y-1">
        <h3 className="font-display text-xl font-bold tracking-tight text-white">
          Parsing Resume{dots}
        </h3>
        <p className="text-xs text-slate-400">
          Our AI parser is extracting and organizing your career milestones.
        </p>
      </div>

      {/* Visual Scanning Animation Box */}
      <div className="relative w-44 h-56 border border-white/10 rounded-2xl bg-[#08080c]/80 p-4 flex flex-col gap-3.5 overflow-hidden shadow-inner">
        {/* Scanning laser line */}
        <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_15px_#8b5cf6] animate-[scanLaser_2.2s_ease-in-out_infinite] z-20" />

        {/* Mock content blocks with scanning highlight state */}
        <div className="space-y-2 relative z-10">
          {/* Header block */}
          <div className="h-3 w-16 bg-slate-800 rounded animate-[pulse_1.5s_infinite]" />
          <div className="h-2 w-28 bg-slate-800/40 rounded" />
        </div>

        <hr className="border-white/5 my-0.5" />

        <div className="space-y-3 flex-1 relative z-10">
          {/* Bullet points */}
          {[
            { w: "w-5/6" },
            { w: "w-full" },
            { w: "w-4/5" },
            { w: "w-11/12" },
          ].map((bar, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2 w-12 bg-slate-800/80 rounded" />
              <div className={`h-1.5 ${bar.w} bg-slate-800/30 rounded`} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="h-1.5 w-1/3 bg-slate-800/40 rounded mx-auto" />
      </div>

      {/* Pipeline Steps Tracker List */}
      <div className="w-full space-y-3">
        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 ${
                isDone
                  ? "bg-emerald-500/5 border-emerald-500/20 text-slate-100"
                  : isActive
                  ? "bg-violet-500/10 border-violet-500/30 text-slate-100 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                  : "bg-transparent border-white/5 text-slate-400 opacity-60"
              }`}
            >
              {/* Step Status Indicator Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border transition-all ${
                  isDone
                    ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-400"
                    : isActive
                    ? "bg-violet-500/20 border-violet-500/35 text-violet-400 animate-pulse"
                    : "bg-[#0d0d15] border-white/5 text-slate-500"
                }`}
              >
                {isDone ? "✓" : step.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold leading-none mb-1 flex items-center gap-2">
                  {step.label}
                  {isActive && (
                    <span className="inline-block w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping" />
                  )}
                </h4>
                <p className="text-xs text-slate-400 truncate leading-none">
                  {isActive ? "Processing..." : isDone ? "Completed" : step.sublabel}
                </p>
              </div>

              {isActive && (
                <span className="text-xs text-violet-400 font-bold font-mono tracking-widest animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
