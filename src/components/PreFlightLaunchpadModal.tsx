"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Award,
} from "lucide-react";
import { runPreFlightAudit, type PreFlightAuditReport } from "@/lib/preflightAuditor";
import { playSound } from "@/lib/soundFx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  targetRole?: string;
}

export default function PreFlightLaunchpadModal({
  isOpen,
  onClose,
  resumeText,
  targetRole = "Software Engineer",
}: Props) {
  const [copiedBadge, setCopiedBadge] = useState(false);

  if (!isOpen) return null;

  const report: PreFlightAuditReport = runPreFlightAudit(resumeText || "");

  const handleCopyBadge = () => {
    playSound("apply");
    const badgeMarkdown = `[![ResumeLens ATS Verified](https://img.shields.io/badge/ATS_Verified-100%25_Linearized-emerald?style=flat-square&logo=checkmarx)](${window.location.origin})`;
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
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
            <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <Rocket size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-ink">
                Pre-Flight Submission Launchpad
              </h2>
              <p className="text-xs text-ink-muted">
                Final 6-point pre-flight integrity audit before submitting your application to
                employers.
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
          {/* Top Readiness Score Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border bg-paper-warm/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck size={14} /> Flight Readiness Status
              </span>
              <h3 className="text-sm sm:text-base font-bold text-ink">
                {report.allPassed
                  ? "100% Cleared for Corporate Submission"
                  : "Pre-Flight Recommendations Identified"}
              </h3>
              <span className="text-xs text-ink-muted font-mono">
                Certificate ID: <strong className="text-ink">{report.certificateId}</strong>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-paper-card border border-border flex flex-col items-center justify-center shrink-0 min-w-[95px] shadow-xs">
              <span className="text-[10px] font-mono font-bold text-ink-faint uppercase">
                Readiness
              </span>
              <span
                className={`text-2xl font-black font-display ${
                  report.readinessScore >= 85 ? "text-emerald-500" : "text-amber-500"
                }`}
              >
                {report.readinessScore}%
              </span>
            </div>
          </div>

          {/* 6-Point Audit Checklist */}
          <div className="space-y-2.5">
            {report.items.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                  item.passed
                    ? "bg-paper-card border-border shadow-xs"
                    : "bg-amber-500/5 border-amber-500/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {item.passed ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">{item.name}</span>
                      <span
                        className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          item.passed
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {item.passed ? "PASSED" : "ATTENTION"}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">{item.details}</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-ink-faint shrink-0">
                  {item.score}/100
                </span>
              </div>
            ))}
          </div>

          {/* Cryptographic Seal & Share Box */}
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-border text-indigo-500 shadow-sm shrink-0">
                <QrCode size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-ink">Embed Verified ATS Seal</span>
                <span className="text-[11px] text-ink-muted">
                  Add an ATS-Verified badge link to your GitHub, Portfolio, or PDF.
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyBadge}
              className="px-3.5 py-2 rounded-xl bg-paper-card hover:bg-paper-warm border border-border text-xs font-bold text-ink flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
            >
              {copiedBadge ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedBadge ? "Copied Badge Markdown" : "Copy Badge Link"}</span>
            </button>
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
            Ready to Submit
          </button>
        </div>
      </motion.div>
    </div>
  );
}
