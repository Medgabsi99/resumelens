"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { playSound } from "@/lib/soundFx";

interface Props {
  targetRole?: string;
  resumeText?: string;
}

export default function SalaryEstimatorCard({
  targetRole = "Software Engineer",
  resumeText = "",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [expandedScript, setExpandedScript] = useState(false);

  // Experience level heuristic
  const isSenior = /senior|lead|principal|staff|head|manager|director/i.test(
    targetRole || resumeText
  );
  const baseSalary = isSenior ? 145000 : 95000;
  const topSalary = isSenior ? 195000 : 135000;
  const medianSalary = Math.round((baseSalary + topSalary) / 2);

  const negotiationScript = `Subject: Negotiation regarding ${targetRole} offer

Dear Hiring Team,

Thank you so much for extending the offer for the ${targetRole} position! I am genuinely thrilled about the opportunity to contribute to the team.

Based on my production experience with the key tech stack requirements mentioned in the role, as well as current market compensation data for ${targetRole} positions ($${baseSalary.toLocaleString()} – $${topSalary.toLocaleString()}), I would like to explore whether there is room to adjust the base compensation closer to $${topSalary.toLocaleString()}.

I am confident that my experience will allow me to deliver immediate value. I look forward to reaching an agreement!

Best regards,
[Your Name]`;

  const handleCopyScript = () => {
    playSound("apply");
    navigator.clipboard.writeText(negotiationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 w-full text-ink">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 w-full">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <DollarSign size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-ink leading-snug">
              AI Salary Estimator &amp; Negotiation Helper
            </h3>
            <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
              Estimated market benchmark for{" "}
              <span className="font-semibold text-ink">{targetRole}</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 whitespace-nowrap self-start sm:self-center">
          <TrendingUp size={11} />
          <span>Market Benchmark</span>
        </span>
      </div>

      {/* Salary 3-Tier Benchmark Columns */}
      <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-paper-warm/40 rounded-2xl border border-border text-center shadow-xs">
        <div className="flex flex-col items-center justify-center p-1">
          <span className="text-[9px] sm:text-[10px] uppercase font-mono font-semibold text-ink-faint tracking-wider">
            25th %
          </span>
          <span className="text-xs sm:text-sm md:text-base font-bold text-ink tracking-tight mt-0.5">
            ${baseSalary.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-1 border-x border-border/60 bg-emerald-500/5 rounded-lg">
          <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
            Median Target
          </span>
          <span className="text-sm sm:text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5">
            ${medianSalary.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-1">
          <span className="text-[9px] sm:text-[10px] uppercase font-mono font-semibold text-ink-faint tracking-wider">
            75th %
          </span>
          <span className="text-xs sm:text-sm md:text-base font-bold text-ink tracking-tight mt-0.5">
            ${topSalary.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Negotiation Script Card */}
      <div className="bg-paper-warm/30 border border-border p-3.5 rounded-2xl shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent" />
            <span>Recruiter Salary Negotiation Script</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyScript}
              className="text-[10.5px] font-semibold text-accent hover:text-accent-hover flex items-center gap-1 bg-paper-card border border-border hover:border-accent/40 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs"
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              <span>{copied ? "Copied!" : "Copy Email"}</span>
            </button>
            <button
              onClick={() => setExpandedScript((v) => !v)}
              className="p-1 text-ink-muted hover:text-ink transition rounded-lg"
              title={expandedScript ? "Collapse" : "Expand"}
            >
              {expandedScript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        <div
          className={`font-mono text-[10.5px] text-ink-muted leading-relaxed whitespace-pre-wrap bg-paper-card p-2.5 rounded-xl border border-border/50 overflow-y-auto transition-all ${
            expandedScript ? "max-h-60" : "max-h-20"
          }`}
        >
          {negotiationScript}
        </div>
      </div>
    </div>
  );
}
