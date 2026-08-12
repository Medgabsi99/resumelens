"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Zap,
  Award,
  Loader2,
  Flame,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import ModalErrorBoundary from "./ModalErrorBoundary";

interface RedFlag {
  issue: string;
  severity: "high" | "medium" | "low";
  detail: string;
}

interface GreenFlag {
  strength: string;
  detail: string;
}

interface QuickWin {
  action: string;
  impact: string;
  effort: "easy" | "medium" | "hard";
}

interface RecruiterReviewData {
  callbackScore: number;
  callbackVerdict: string;
  firstImpression: string;
  recruiterThought: string;
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  interviewQuestions: string[];
  quickWins: QuickWin[];
  hiringDecision: string;
  standoutFactor: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  jobDescription?: string;
  targetRole?: string;
}

function RecruiterSandboxContent({
  isOpen,
  onClose,
  resumeText,
  jobDescription = "",
  targetRole = "",
}: Props) {
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecruiterReviewData | null>(null);

  const handleRunSimulation = async () => {
    if (!resumeText || resumeText.length < 50) {
      toastError("Resume text is too short to simulate a recruiter review.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/recruiter-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Recruiter simulation failed.");
      }

      setData(json.data);
    } catch (err: unknown) {
      toastError((err as Error).message || "Failed to run recruiter simulation");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !data && !loading) {
      handleRunSimulation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const scoreColor =
    (data?.callbackScore ?? 0) >= 75
      ? "#10b981"
      : (data?.callbackScore ?? 0) >= 55
        ? "#f59e0b"
        : "#ef4444";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--paper-card)] border border-[var(--border)] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--nav-bg)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserCheck size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)] leading-snug">
                  Recruiter 30-Second Glance Sandbox
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Simulates a senior hiring manager&apos;s instinctive 6-second scan and callback
                  decision
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-warm)] rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Senior Recruiter is reviewing your resume...
                </p>
                <p className="text-xs text-[var(--ink-faint)] max-w-xs text-center">
                  Analyzing top 1/3 layout, metric density, formatting, and callback probability
                </p>
              </div>
            )}

            {!loading && data && (
              <>
                {/* Score & Decision Hero Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Callback Gauge */}
                  <div className="p-5 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-faint)] mb-2">
                      Callback Probability
                    </span>
                    <div
                      className="text-4xl font-black font-mono my-1"
                      style={{ color: scoreColor }}
                    >
                      {data.callbackScore}%
                    </div>
                    <span
                      className="px-3 py-1 text-xs font-bold rounded-full border mt-2"
                      style={{
                        color: scoreColor,
                        borderColor: `${scoreColor}40`,
                        background: `${scoreColor}10`,
                      }}
                    >
                      {data.callbackVerdict}
                    </span>
                  </div>

                  {/* Recruiter's Immediate Thought */}
                  <div className="md:col-span-2 p-5 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-faint)] flex items-center gap-1 mb-2">
                        <Sparkles size={11} className="text-amber-500" />
                        First 6-Second Gut Reaction
                      </span>
                      <p className="text-sm italic text-[var(--ink)] font-medium leading-relaxed">
                        &ldquo;{data.recruiterThought}&rdquo;
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                      <span className="text-[var(--ink-muted)] font-semibold">
                        Hiring Decision:
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {data.hiringDecision}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Standout Memorable Factor */}
                {data.standoutFactor && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                    <Award size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                        The Standout Memorable Factor
                      </span>
                      <p className="text-xs text-[var(--ink-muted)] mt-0.5 leading-normal">
                        {data.standoutFactor}
                      </p>
                    </div>
                  </div>
                )}

                {/* First Impression Deep Dive */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--paper-card)]">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-faint)] block mb-1">
                    First Impression (Top 1/3 Scan)
                  </span>
                  <p className="text-xs text-[var(--ink)] leading-relaxed">
                    {data.firstImpression}
                  </p>
                </div>

                {/* Red Flags & Green Flags Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Red Flags */}
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Red Flags ({data.redFlags.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {data.redFlags.map((rf, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-[var(--paper-card)] border border-red-500/15 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[var(--ink)]">{rf.issue}</span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                rf.severity === "high"
                                  ? "bg-red-500/15 text-red-600"
                                  : rf.severity === "medium"
                                    ? "bg-amber-500/15 text-amber-600"
                                    : "bg-gray-500/15 text-gray-500"
                              }`}
                            >
                              {rf.severity}
                            </span>
                          </div>
                          <p className="text-[var(--ink-muted)] text-[11px] leading-tight">
                            {rf.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Green Flags */}
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Green Flags ({data.greenFlags.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {data.greenFlags.map((gf, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-[var(--paper-card)] border border-emerald-500/15 text-xs"
                        >
                          <span className="font-semibold text-[var(--ink)] block mb-0.5">
                            {gf.strength}
                          </span>
                          <p className="text-[var(--ink-muted)] text-[11px] leading-tight">
                            {gf.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Likely Recruiter Interview Questions */}
                {data.interviewQuestions.length > 0 && (
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--paper-card)] space-y-3">
                    <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-indigo-500" />
                      Questions a Recruiter Will Probe On
                    </span>
                    <ul className="space-y-2 text-xs">
                      {data.interviewQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[var(--ink-muted)]">
                          <span className="font-bold text-indigo-500 text-[11px] mt-0.5">
                            {idx + 1}.
                          </span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* High Impact Quick Wins */}
                {data.quickWins.length > 0 && (
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--paper-card)] space-y-3">
                    <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500" />
                      High Impact Quick Wins
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.quickWins.map((qw, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-[var(--paper-warm)] border border-[var(--border)] text-xs flex flex-col justify-between"
                        >
                          <div>
                            <span className="font-semibold text-[var(--ink)] block mb-0.5">
                              {qw.action}
                            </span>
                            <p className="text-[11px] text-[var(--ink-muted)]">{qw.impact}</p>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="text-[var(--ink-faint)]">Effort:</span>
                            <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">
                              {qw.effort}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border)] bg-[var(--nav-bg)] text-xs">
            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Flame size={13} />}
              Re-run Recruiter Scan
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--paper-warm)] font-medium text-[var(--ink)]"
            >
              Close Sandbox
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function RecruiterSandboxModal(props: Props) {
  return (
    <ModalErrorBoundary modalTitle="Recruiter Sandbox Error" onClose={props.onClose}>
      <RecruiterSandboxContent {...props} />
    </ModalErrorBoundary>
  );
}
