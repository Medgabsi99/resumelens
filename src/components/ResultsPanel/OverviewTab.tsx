"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  AlertTriangle,
  Sparkles,
  Zap,
  Award,
  TrendingUp,
  Target,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Mic,
} from "lucide-react";
import Section from "./Section";
import RewriteSuggestionCard from "./RewriteSuggestionCard";
import SalaryEstimatorCard from "@/components/SalaryEstimatorCard";
import ActiveVerbAuditor from "./ActiveVerbAuditor";
import ScoreBoosterChecklist from "@/components/ScoreBoosterChecklist";
import ScoreSimulatorSandbox from "@/components/ScoreSimulatorSandbox";
import StarInterviewCoachModal from "@/components/StarInterviewCoachModal";
import SixSecondRecruiterSimulator from "@/components/SixSecondRecruiterSimulator";
import type { AnalysisResult } from "@/types";
import { playSound } from "@/lib/soundFx";

interface Props {
  displayResult: AnalysisResult;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  onOpenAutoFix?: () => void;
}

export default function OverviewTab({
  displayResult,
  resumeText = "",
  jobDescription,
  targetRole = "Software Engineer",
  onOpenAutoFix,
}: Props) {
  const [activeStarBullet, setActiveStarBullet] = useState<string | null>(null);
  const score = displayResult.score || 75;

  const scoreTier = useMemo(() => {
    if (score >= 90)
      return {
        label: "Elite Top 5%",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.12)",
        border: "rgba(16, 185, 129, 0.25)",
      };
    if (score >= 80)
      return {
        label: "Strong Candidate",
        color: "#3b82f6",
        bg: "rgba(59, 130, 246, 0.12)",
        border: "rgba(59, 130, 246, 0.25)",
      };
    if (score >= 70)
      return {
        label: "Competitive",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.12)",
        border: "rgba(245, 158, 11, 0.25)",
      };
    return {
      label: "Needs Improvement",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.25)",
    };
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      {/* ── Asymmetric Bento-Grid Command Center ───────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 px-2 sm:px-4 lg:px-6 pt-2">
        {/* Tile 1: Hero Score Dial (Span 4) */}
        <div className="bento-card col-span-1 xl:col-span-4 p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-paper-card to-paper-warm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-ink-faint uppercase">
              ATS Match Level
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style={{
                background: scoreTier.bg,
                color: scoreTier.color,
                border: `1px solid ${scoreTier.border}`,
              }}
            >
              {scoreTier.label}
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="text-5xl font-black text-ink tracking-tight font-mono">{score}</span>
            <span className="text-sm font-semibold text-ink-muted">/ 100</span>
            {score < 90 && (
              <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp size={13} /> +{Math.min(22, 95 - score)} pts potential
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="w-full h-2 rounded-full bg-paper-warm overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${score}%`,
                  background: `linear-gradient(90deg, ${scoreTier.color}, #6366f1)`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>Baseline</span>
              <span className="font-semibold text-ink">Interview Target: 85+</span>
            </div>
          </div>

          {onOpenAutoFix && (
            <button
              onClick={() => {
                playSound("apply");
                onOpenAutoFix();
              }}
              className="mt-4 w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-accent to-accent-hover hover:opacity-90 shadow-md shadow-accent/20 flex items-center justify-center gap-2 transition"
            >
              <Sparkles size={14} />
              <span>Auto-Fix to 90+ Score</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Tile 2: Priority Action Path (Span 8) */}
        <div className="bento-card col-span-1 xl:col-span-8 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent-bg text-accent">
                  <Zap size={15} />
                </div>
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-ink">
                  Priority Action Path (Fastest ROI)
                </span>
              </div>
              <span className="text-[11px] text-ink-faint">3 recommended steps</span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: "kw",
                  label: `Integrate ${(displayResult.keywords_missing?.slice(0, 3) || ["TypeScript", "AWS"]).join(", ")} into experience bullets`,
                  gain: "+8 pts",
                  category: "Keywords",
                },
                {
                  id: "metrics",
                  label:
                    "Quantify leading bullet with scale, percentage reduction or revenue numbers",
                  gain: "+5 pts",
                  category: "Impact",
                },
                {
                  id: "verbs",
                  label: "Replace passive responsibility phrasing with executive power verbs",
                  gain: "+4 pts",
                  category: "Style",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-paper-warm/40 hover:bg-paper-warm/80 transition cursor-pointer"
                  onClick={() => {
                    playSound("click");
                    if (onOpenAutoFix) onOpenAutoFix();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-paper-card border border-border flex items-center justify-center text-[10px] font-bold text-ink-muted">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-ink line-clamp-1">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                    {item.gain}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border mt-3 text-[11px] text-ink-muted">
            <span>
              Estimated recruiter callback increase: <strong>+3.2x</strong>
            </span>
            <span className="text-accent font-semibold flex items-center gap-1">
              View All Fixes <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* Tile 3: ATS Criteria Radar (Span 6) */}
        {displayResult.ats_breakdown &&
          (() => {
            const ats = displayResult.ats_breakdown;
            const avgAtsHealth = Math.round(
              (ats.format + ats.keywords + ats.impact + ats.readability) / 4
            );
            const isHealthy = avgAtsHealth >= 75;

            return (
              <div className="bento-card col-span-1 xl:col-span-6 p-6 flex flex-col gap-4 shadow-xs">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-ink flex items-center gap-2">
                    <Target size={14} className="text-indigo-500" /> ATS Criteria Health
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    Deterministic 0-100
                  </span>
                </div>

                {/* Center ATS Diagnostic Summary Hub */}
                <div className="p-4 rounded-2xl bg-paper-warm/40 border border-border flex flex-col sm:flex-row items-center gap-4">
                  {/* Circular Gauge */}
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-paper-card"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={isHealthy ? "text-emerald-500" : "text-amber-500"}
                        strokeDasharray={`${avgAtsHealth}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-black font-display text-ink">
                        {avgAtsHealth}%
                      </span>
                      <span className="text-[8.5px] font-mono text-ink-faint uppercase font-bold">
                        Health
                      </span>
                    </div>
                  </div>

                  {/* Diagnostic Insights */}
                  <div className="flex-1 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink flex items-center gap-1.5">
                        <ShieldCheck
                          size={14}
                          className={isHealthy ? "text-emerald-500" : "text-amber-500"}
                        />
                        <span>{isHealthy ? "Parser Certified" : "Optimization Required"}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-ink-muted">
                        Workday &amp; Greenhouse
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      {ats.format >= 80
                        ? "✓ Universal single-column layout verified without parsing blockers."
                        : "⚠ Complex table or multi-column layout may cause text fragmentation."}
                    </p>
                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      {ats.keywords >= 70
                        ? "✓ High-density keyword matching for primary domain competencies."
                        : "⚠ Keyword density below benchmark. Boost role-specific nouns."}
                    </p>
                  </div>
                </div>

                {/* 4 Dimension Progress Breakdown */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  {[
                    { label: "Format & Structure", val: ats.format },
                    { label: "Keyword Match", val: ats.keywords },
                    { label: "Quantified Impact", val: ats.impact },
                    { label: "Brevity & Layout", val: ats.readability },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-paper-warm/50 border border-border flex flex-col gap-1.5 shadow-xs"
                    >
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-ink-muted font-medium truncate text-[11.5px]">
                          {c.label}
                        </span>
                        <span className="font-mono font-bold text-ink">{c.val}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-paper-card overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${c.val}%`,
                            background:
                              c.val >= 80 ? "#10b981" : c.val >= 60 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        {/* Tile 4: Market Salary Estimator (Span 6) */}
        <div className="bento-card col-span-1 xl:col-span-6 p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
          <SalaryEstimatorCard targetRole={targetRole} resumeText={resumeText} />
        </div>
      </div>

      {/* ── Interactive "What-If" Score Simulator ──────────────── */}
      <div className="px-2 sm:px-4 lg:px-6">
        <ScoreSimulatorSandbox
          displayResult={displayResult}
          resumeText={resumeText}
          targetRole={targetRole}
          onOpenAutoFix={onOpenAutoFix}
        />
      </div>

      {/* ── Score Booster Checklist ────────────────────────────── */}
      <div className="px-2 sm:px-4 lg:px-6">
        <ScoreBoosterChecklist
          displayResult={displayResult}
          resumeText={resumeText}
          jobDescription={jobDescription}
          targetRole={targetRole}
          onOpenAutoFix={onOpenAutoFix}
        />
      </div>

      {/* ── Strengths & Weaknesses ─────────────────────────────── */}
      <div className="px-2 sm:px-4 lg:px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths Card */}
        <div className="bento-card p-6 border-l-4 border-l-emerald-500 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono uppercase tracking-wider">
            <Check size={16} />
            <span>Key Strengths ({displayResult.strengths?.length || 0})</span>
          </div>
          <ul className="space-y-2 text-xs text-ink leading-relaxed">
            {displayResult.strengths?.map((strength, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  ✓
                </span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses Card */}
        <div className="bento-card p-6 border-l-4 border-l-amber-500 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400 font-bold text-xs font-mono uppercase tracking-wider">
            <AlertTriangle size={16} />
            <span>Areas to Improve ({displayResult.weaknesses?.length || 0})</span>
          </div>
          <ul className="space-y-2 text-xs text-ink leading-relaxed">
            {displayResult.weaknesses?.map((weakness, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  !
                </span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── High-Impact Bullet Rewrites ─────────────────────────── */}
      {displayResult.suggestions && displayResult.suggestions.length > 0 && (
        <div className="px-2 sm:px-4 lg:px-6">
          <Section title="High-Impact Bullet Rewrites" delay={2}>
            <div className="flex flex-col gap-3.5">
              {displayResult.suggestions.map((suggestion, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <RewriteSuggestionCard s={suggestion} />
                  <button
                    onClick={() => {
                      playSound("click");
                      setActiveStarBullet(suggestion.after);
                    }}
                    className="self-end px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Mic size={12} />
                    <span>🎙️ Prep Behavioral STAR Question</span>
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Action Verb Auditor ─────────────────────────────────── */}
      {resumeText && (
        <div className="px-2 sm:px-4 lg:px-6">
          <ActiveVerbAuditor resumeText={resumeText} />
        </div>
      )}

      {/* ── 6-Second Recruiter Challenge ─────────────────────────── */}
      {resumeText && (
        <div className="px-2 sm:px-4 lg:px-6">
          <SixSecondRecruiterSimulator resumeText={resumeText} targetRole={targetRole} />
        </div>
      )}

      {/* STAR Interview Coach Modal */}
      {activeStarBullet && (
        <StarInterviewCoachModal
          isOpen={!!activeStarBullet}
          onClose={() => setActiveStarBullet(null)}
          bulletText={activeStarBullet}
          targetRole={targetRole}
        />
      )}
    </motion.div>
  );
}
