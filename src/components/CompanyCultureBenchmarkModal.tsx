"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  COMPANY_RUBRICS,
  evaluateCompanyFit,
  type TargetCompanyId,
  type CompanyRubric,
} from "@/lib/ai/companyCultureRubrics";
import { playSound } from "@/lib/soundFx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
}

export default function CompanyCultureBenchmarkModal({ isOpen, onClose, resumeText }: Props) {
  const [selectedCompany, setSelectedCompany] = useState<TargetCompanyId>("google");
  const [copiedRewrite, setCopiedRewrite] = useState(false);

  if (!isOpen) return null;

  const { score, matchedPrinciples, missingPrinciples, rubric } = evaluateCompanyFit(
    resumeText || "",
    selectedCompany
  );

  const handleCopy = () => {
    playSound("apply");
    navigator.clipboard.writeText(rubric.sampleCultureRewrite.after);
    setCopiedRewrite(true);
    setTimeout(() => setCopiedRewrite(false), 2000);
  };

  const companies: { id: TargetCompanyId; name: string; color: string }[] = [
    { id: "google", name: "Google", color: "#4285f4" },
    { id: "amazon", name: "Amazon", color: "#ff9900" },
    { id: "stripe", name: "Stripe", color: "#635bff" },
    { id: "apple", name: "Apple", color: "#a3aaae" },
    { id: "meta", name: "Meta", color: "#0668e1" },
    { id: "openai", name: "OpenAI", color: "#10a37f" },
  ];

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
            <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-ink">
                Tier-1 FAANG Cultural Rubric Benchmark
              </h2>
              <p className="text-xs text-ink-muted">
                Benchmark your resume against the exact leadership and engineering principles of top
                tech giants.
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
          {/* Company Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => {
              const isSelected = selectedCompany === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    playSound("click");
                    setSelectedCompany(c.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer shadow-xs ${
                    isSelected
                      ? "bg-accent text-white border-accent shadow-xs"
                      : "border-border bg-paper-warm hover:bg-paper-card text-ink"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Company Score Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border bg-paper-warm/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
                {rubric.tagline}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-ink">
                {rubric.name} Hiring Bar Evaluation
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed max-w-md">
                {rubric.whatTheyLookFor}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-paper-card border border-border flex flex-col items-center justify-center shrink-0 min-w-[90px] shadow-xs">
              <span className="text-[10px] font-mono font-bold text-ink-faint uppercase">
                Fit Index
              </span>
              <span className="text-2xl font-black font-display text-emerald-500">{score}%</span>
            </div>
          </div>

          {/* Principles Alignment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Matched Principles */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-2 shadow-xs">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Matched Culture Signals
              </span>
              <ul className="space-y-1.5 text-xs text-ink">
                {matchedPrinciples.length > 0 ? (
                  matchedPrinciples.map((mp, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{mp}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-ink-faint">No strong direct principle matches detected.</li>
                )}
              </ul>
            </div>

            {/* Missing / High-ROI Culture Signals */}
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col gap-2 shadow-xs">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Recommended Leadership Signals
              </span>
              <ul className="space-y-1.5 text-xs text-ink">
                {rubric.corePrinciples.map((cp, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{cp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Company-Tailored Bullet Rewrite Example */}
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col gap-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Sparkles size={13} /> Tailored {rubric.name} Bullet Rewrite
              </span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {rubric.sampleCultureRewrite.principleApplied}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-paper-card border border-border flex flex-col gap-1.5 shadow-xs">
              <span className="text-[10px] font-mono text-rose-500 line-through">
                Before: {rubric.sampleCultureRewrite.before}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                After: &ldquo;{rubric.sampleCultureRewrite.after}&rdquo;
              </span>

              <button
                onClick={handleCopy}
                className="self-end px-3 py-1 rounded-lg bg-paper-warm hover:bg-paper-card border border-border text-[11px] font-bold text-ink flex items-center gap-1 transition mt-1 cursor-pointer shadow-xs"
              >
                {copiedRewrite ? (
                  <Check size={11} className="text-emerald-500" />
                ) : (
                  <Copy size={11} />
                )}
                <span>{copiedRewrite ? "Copied!" : "Copy Tailored Bullet"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Fixed Sticky Pinned Footer ──────────────────────── */}
        <div className="p-4 sm:px-6 border-t border-border bg-paper-card flex items-center justify-end gap-3 shrink-0 shadow-lg">
          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover transition shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
