"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  Eye,
} from "lucide-react";
import { playSound } from "@/lib/soundFx";
import TechProTemplate from "./resume-templates/TechProTemplate";
import { parseResume } from "@/lib/parseResume";
import type { AnalysisResult } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  displayResult: AnalysisResult;
  resumeText: string;
  targetRole?: string;
}

export default function ZenReviewModeModal({
  isOpen,
  onClose,
  displayResult,
  resumeText,
  targetRole = "Software Engineer",
}: Props) {
  const score = displayResult.score || 78;
  const parsedResume = parseResume(resumeText || "");

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-[#090b10]/95 backdrop-blur-xl text-slate-100 overflow-hidden animate-fadeIn">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-14 border-b border-white/10 px-6 flex items-center justify-between z-20 bg-[#090b10]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Zen Executive Mode
          </span>
          <span className="text-sm font-bold text-slate-200">
            {parsedResume.contact?.name || "Candidate Resume"} — {targetRole}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
            <span className="text-slate-400">Score:</span>
            <span className="font-bold text-emerald-400">{score}/100</span>
          </div>

          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Exit Zen Mode (Esc)"
          >
            <Minimize2 size={15} />
            <span className="hidden sm:inline">Exit Zen (Esc)</span>
          </button>
        </div>
      </div>

      {/* Main Split Content Area */}
      <div className="w-full h-full pt-14 flex flex-col xl:flex-row overflow-hidden">
        {/* Left Pane: Formatted Document Canvas */}
        <div className="flex-1 h-full overflow-y-auto p-6 md:p-12 flex justify-center bg-[#0d1117]">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden p-8 sm:p-12 self-start border border-white/20">
            <TechProTemplate
              resumeText={resumeText}
              parsedData={parsedResume}
              targetRole={targetRole}
            />
          </div>
        </div>

        {/* Right Pane: Floating AI Coaching Intelligence */}
        <div className="w-full xl:w-96 h-full border-t xl:border-t-0 xl:border-l border-white/10 bg-[#0a0e14] p-6 overflow-y-auto flex flex-col gap-6">
          {/* Executive Summary */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={13} /> Executive Summary
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {displayResult.summary || "Comprehensive analysis ready for interview delivery."}
            </p>
          </div>

          {/* Top Strengths */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Key Strengths
            </span>
            <div className="space-y-2">
              {displayResult.strengths?.slice(0, 3).map((st, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-start gap-2"
                >
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{st}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Rewrite Opportunities */}
          {displayResult.suggestions && displayResult.suggestions.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Priority Bullet Rewrite
              </span>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 text-xs">
                <span className="text-[10px] font-mono text-rose-400 line-through">
                  Before: {displayResult.suggestions[0].before}
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  After: {displayResult.suggestions[0].after}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
