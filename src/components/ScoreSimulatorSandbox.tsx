"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Sliders,
  Check,
  Plus,
  ArrowRight,
  Target,
  Award,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import type { AnalysisResult } from "@/types";
import { playSound } from "@/lib/soundFx";

interface Props {
  displayResult: AnalysisResult;
  resumeText?: string;
  targetRole?: string;
  onApplyChanges?: (appliedKeywords: string[], quantifiedMetrics: number) => void;
  onOpenAutoFix?: () => void;
}

export default function ScoreSimulatorSandbox({
  displayResult,
  resumeText = "",
  targetRole = "Software Engineer",
  onApplyChanges,
  onOpenAutoFix,
}: Props) {
  const baselineScore = displayResult.score || 72;

  // Simulator controls state
  const missingKeywords = useMemo(() => {
    return (
      displayResult.keywords_missing || ["TypeScript", "Kubernetes", "AWS", "GraphQL", "CI/CD"]
    );
  }, [displayResult.keywords_missing]);

  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [metricCount, setMetricCount] = useState<number>(0);
  const [usePowerVerbs, setUsePowerVerbs] = useState<boolean>(false);
  const [useCleanFormat, setUseCleanFormat] = useState<boolean>(false);

  // Toggle keyword chip
  const toggleKeyword = (kw: string) => {
    playSound("click");
    setSelectedKeywords((prev) => {
      const next = prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw];
      const newScore = Math.min(
        99,
        baselineScore +
          next.length * 4 +
          metricCount * 3 +
          (usePowerVerbs ? 5 : 0) +
          (useCleanFormat ? 4 : 0)
      );
      if (newScore >= 90 && baselineScore < 90) {
        playSound("milestone90");
      }
      return next;
    });
  };

  // Live Math Calculation
  const pointsFromKeywords = selectedKeywords.length * 4;
  const pointsFromMetrics = metricCount * 3;
  const pointsFromVerbs = usePowerVerbs ? 5 : 0;
  const pointsFromFormat = useCleanFormat ? 4 : 0;

  const totalBoost = pointsFromKeywords + pointsFromMetrics + pointsFromVerbs + pointsFromFormat;
  const simulatedScore = Math.min(99, baselineScore + totalBoost);

  // Score tier descriptor
  const getTier = (s: number) => {
    if (s >= 90) return { label: "Elite Top 5%", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" };
    if (s >= 80)
      return { label: "Strong Candidate", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" };
    if (s >= 70) return { label: "Competitive", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" };
    return { label: "Needs Improvement", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" };
  };

  const currentTier = getTier(baselineScore);
  const simulatedTier = getTier(simulatedScore);

  const handleApply = () => {
    playSound("apply");
    if (onApplyChanges) {
      onApplyChanges(selectedKeywords, metricCount);
    }
    if (onOpenAutoFix) {
      onOpenAutoFix();
    }
  };

  return (
    <div
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "24px 20px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
      className="sm:p-7"
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2 m-0">
              <span>&ldquo;What-If&rdquo; Score Simulator</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Interactive ROI
              </span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5 mb-0">
              Experiment with adding keywords and metrics to see your projected ATS score jump.
            </p>
          </div>
        </div>

        {/* Live Score Transformation Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-paper-warm px-4 py-2 rounded-xl border border-border">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-ink-muted uppercase">Current</span>
            <span className="text-sm font-black text-ink">{baselineScore}</span>
          </div>

          <ArrowRight size={14} className="text-ink-muted" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-indigo-500 uppercase font-bold">
              Simulated
            </span>
            <motion.span
              key={simulatedScore}
              initial={{ scale: 1.2, color: "#6366f1" }}
              animate={{ scale: 1, color: simulatedScore >= 90 ? "#10b981" : "#4f46e5" }}
              transition={{ duration: 0.2 }}
              className="text-lg font-black"
            >
              {simulatedScore}
            </motion.span>
          </div>

          {totalBoost > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-0.5 ml-1"
            >
              <TrendingUp size={12} />+{totalBoost}
            </motion.span>
          )}
        </div>
      </div>

      {/* ── Interactive Controls Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Keyword Injection Chips */}
        <div
          style={{
            background: "var(--paper-warm)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Target size={13} className="text-indigo-500" />
              <span>Target Keywords (+4 pts each)</span>
            </span>
            <span className="text-[11px] font-mono text-ink-muted">
              {selectedKeywords.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.slice(0, 8).map((kw) => {
              const isSelected = selectedKeywords.includes(kw);
              return (
                <button
                  key={kw}
                  onClick={() => toggleKeyword(kw)}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    background: isSelected ? "var(--accent)" : "var(--paper-card)",
                    color: isSelected ? "#ffffff" : "var(--ink)",
                    boxShadow: isSelected ? "0 2px 8px rgba(99, 102, 241, 0.25)" : "none",
                  }}
                >
                  {isSelected ? <Check size={11} /> : <Plus size={11} className="text-ink-muted" />}
                  <span>{kw}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Metrics & Formatting Boosters */}
        <div
          style={{
            background: "var(--paper-warm)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Quantified Bullets Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-ink font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500" />
                <span>Quantify Bullets with Metrics (+3 pts each)</span>
              </span>
              <span className="font-mono font-bold text-indigo-500">
                {metricCount} bullets (+{metricCount * 3} pts)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={metricCount}
              onChange={(e) => setMetricCount(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-border rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-ink-muted">
              <span>0 (None)</span>
              <span>3 (Recommended)</span>
              <span>5 (Max)</span>
            </div>
          </div>

          {/* Quick Best Practice Toggles */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
            <button
              onClick={() => setUsePowerVerbs((v) => !v)}
              className={`px-2.5 py-2 rounded-lg border text-[11px] font-medium text-left flex items-center justify-between transition-colors ${
                usePowerVerbs
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 font-bold"
                  : "bg-paper-card border-border text-ink-muted hover:text-ink"
              }`}
            >
              <span>Power Action Verbs</span>
              <span className="font-mono text-[10px]">{usePowerVerbs ? "+5 pts" : "+0"}</span>
            </button>

            <button
              onClick={() => setUseCleanFormat((v) => !v)}
              className={`px-2.5 py-2 rounded-lg border text-[11px] font-medium text-left flex items-center justify-between transition-colors ${
                useCleanFormat
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 font-bold"
                  : "bg-paper-card border-border text-ink-muted hover:text-ink"
              }`}
            >
              <span>ATS Standard Format</span>
              <span className="font-mono text-[10px]">{useCleanFormat ? "+4 pts" : "+0"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer CTA Banner ─────────────────────────────────── */}
      <div
        style={{
          background:
            simulatedScore >= 90
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.15) 100%)"
              : "rgba(99, 102, 241, 0.08)",
          border: `1px solid ${simulatedScore >= 90 ? "rgba(16, 185, 129, 0.3)" : "rgba(99, 102, 241, 0.2)"}`,
          borderRadius: 14,
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="flex items-center gap-2">
          <Award
            size={18}
            className={simulatedScore >= 90 ? "text-emerald-500" : "text-indigo-500"}
          />
          <span className="text-xs text-ink">
            Projected Tier:{" "}
            <strong className={simulatedScore >= 90 ? "text-emerald-600" : "text-indigo-600"}>
              {simulatedTier.label} ({simulatedScore}/100)
            </strong>
          </span>
        </div>

        <button
          onClick={handleApply}
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
            fontFamily: "DM Mono, monospace",
          }}
        >
          <Sparkles size={13} />
          <span>Apply Simulated Plan in Studio &rarr;</span>
        </button>
      </div>
    </div>
  );
}
