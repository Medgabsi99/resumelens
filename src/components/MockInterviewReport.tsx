"use client";

import React from "react";
import { Trophy, Info, AlertTriangle, X } from "lucide-react";
import { type MockInterviewTranscriptEntry, type MockInterviewScorecard } from "@/lib/ai";
import ConfettiCannon from "@/components/ConfettiCannon";

interface MockInterviewReportProps {
  isSaving: boolean;
  scorecard: MockInterviewScorecard | null;
  confettiKey: number;
  saveResult: { savedInDb: boolean; dbError?: string | null } | null;
  transcripts: MockInterviewTranscriptEntry[];
  onClose: () => void;
}

export default function MockInterviewReport({
  isSaving,
  scorecard,
  confettiKey,
  saveResult,
  transcripts,
  onClose,
}: MockInterviewReportProps) {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      {isSaving ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
          <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <h3 className="font-display text-lg font-bold text-ink mt-2">Compiling final interview scorecard...</h3>
          <p className="text-xs text-ink-muted">Evaluating communication logs, filler word densities, and grading pacing curves...</p>
        </div>
      ) : scorecard ? (
        <div className="space-y-6 animate-fade-in">
          {confettiKey > 0 && (
            <ConfettiCannon score={scorecard.overallScore} trigger={confettiKey % 2 === 1} />
          )}

          {/* Scorecard banner */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
                <Trophy size={22} className="text-amber-400 shrink-0" />
                Session Scorecard Compiled!
              </h2>
              <p className="text-xs text-ink-muted mt-1.5 max-w-xl">
                Your performance transcript has been evaluated by the AI Coach. Detailed breakdown of metrics, communication strengths, and structured suggestions are listed below.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-[#181822] border border-border p-4 rounded-xl flex flex-col items-center min-w-[90px] shadow-sm">
                <span className="text-[9px] text-ink-faint font-bold uppercase tracking-wider">Overall Score</span>
                <span className="text-3xl font-extrabold text-indigo-400 mt-1">{scorecard.overallScore}%</span>
              </div>
              <div className="bg-[#181822] border border-border p-4 rounded-xl flex flex-col items-center min-w-[90px] shadow-sm">
                <span className="text-[9px] text-ink-faint font-bold uppercase tracking-wider">STAR Mastery</span>
                <span className="text-3xl font-extrabold text-emerald-400 mt-1">{scorecard.starMastery}%</span>
              </div>
            </div>
          </div>

          {saveResult && !saveResult.savedInDb && (
            <div className="px-4 py-2 text-xs rounded-xl bg-slate-500/5 border border-slate-500/20 text-slate-400 flex justify-between items-center">
              <span className="flex items-center gap-1.5"><Info size={12} className="shrink-0" /> Workspace logged locally (Local Storage fallback active).</span>
              <span className="bg-slate-500/10 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-500/20">
                LOCAL FALLBACK
              </span>
            </div>
          )}

          {/* Grid stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Sentiment & Pacing */}
            <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-4 shadow-md">
              <h3 className="font-display text-xs font-bold text-ink border-b border-border pb-2.5 uppercase tracking-wider">
                Sentiment & Pacing Breakdown
              </h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-ink-muted mb-1.5">
                    <span>Communication Confidence</span>
                    <span className="font-bold text-indigo-400">{scorecard.sentimentSummary.confidence}%</span>
                  </div>
                  <div className="w-full bg-[#121216] h-2 rounded-full overflow-hidden border border-border/30">
                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${scorecard.sentimentSummary.confidence}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-[#121216] border border-border/50 rounded-lg">
                  <span className="text-ink-muted">Speaking Pacing</span>
                  <span className="font-bold text-ink uppercase">{scorecard.sentimentSummary.pacing}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-[#121216] border border-border/50 rounded-lg">
                  <span className="text-ink-muted">Filler Words Density</span>
                  <span className="font-bold text-ink uppercase">{scorecard.sentimentSummary.fillerWordsUsage}</span>
                </div>
              </div>
            </div>

            {/* Middle/Right Columns: Strengths & Weaknesses */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-3 shadow-md">
                <h3 className="font-display text-xs font-bold text-emerald-400 border-b border-emerald-500/20 pb-2.5 uppercase tracking-wider">
                  Communication Strengths
                </h3>
                <ul className="space-y-2.5 text-xs text-ink-muted list-disc pl-4 leading-relaxed">
                  {scorecard.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-3 shadow-md">
                <h3 className="font-display text-xs font-bold text-rose-400 border-b border-rose-500/20 pb-2.5 uppercase tracking-wider">
                  Areas to Improve
                </h3>
                <ul className="space-y-2.5 text-xs text-ink-muted list-disc pl-4 leading-relaxed">
                  {scorecard.weaknesses.map((wk, i) => (
                    <li key={i}>{wk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Coach evaluation note */}
          <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-2 shadow-md">
            <h3 className="font-display text-xs font-bold text-ink border-b border-border pb-2.5 uppercase tracking-wider">
              Coach General Evaluation
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed font-mono bg-[#121216] border border-border/50 p-4 rounded-xl">
              {scorecard.feedback}
            </p>
          </div>

          {/* Detailed dialogue logs */}
          <div className="space-y-3.5">
            <h3 className="font-display text-sm font-bold text-ink border-b border-[#2c2c38] pb-2">
              Session Transcript & Turn-by-Turn Feedback
            </h3>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1.5">
              {transcripts.map((entry, idx) => (
                <div key={idx} className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="text-xs font-bold text-indigo-400">
                    Q{idx + 1}: {entry.question}
                  </div>
                  <div className="text-xs text-ink-muted bg-[#121216] p-3 rounded-lg border border-border/50 leading-relaxed italic">
                    &quot; {entry.answer} &quot;
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2c2c38]/50 pt-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-ink-faint font-bold block uppercase tracking-wider mb-1">Turn Feedback (Score: {entry.score}/10)</span>
                      <p className="text-ink-muted leading-relaxed">{entry.feedback}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-faint font-bold block uppercase tracking-wider mb-1">Optimized Response Suggestion</span>
                      <p className="text-emerald-400 leading-relaxed italic">&quot;{entry.sampleAnswer}&quot;</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-2 text-xs text-ink-muted">
          <AlertTriangle size={14} className="shrink-0 text-amber-400" />
          <span>Failed to load or compile session scorecard report.</span>
        </div>
      )}

      {/* Scorecard Footer controls */}
      {!isSaving && scorecard && (
        <div className="border-t border-[#2c2c38] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:scale-[1.01] transition shadow cursor-pointer text-white flex items-center gap-2"
          >
            <span>Close & View History Dashboard</span>
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
