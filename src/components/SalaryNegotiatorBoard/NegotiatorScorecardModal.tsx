"use client";
import { type NegotiationOffer, type NegotiationScorecard } from "@/lib/ai";
import SpotlightCard from "@/components/SpotlightCard";
import { Trophy, Check, AlertTriangle, Sparkles, TrendingDown, ArrowRight } from "lucide-react";

interface RecruiterProfile {
  hiddenCeilingBudget: number;
  name: string;
}

interface Props {
  scorecard: NegotiationScorecard;
  recruiter: RecruiterProfile | null;
  currentOffer: NegotiationOffer;
  verdict: string;
  savingStatus: "idle" | "saving" | "saved" | "error";
  savingError: string | null;
  savedMethod: "db" | "local" | null;
  onClose: () => void;
}

export default function NegotiatorScorecardModal({
  scorecard, recruiter, currentOffer, verdict,
  savingStatus, savingError, savedMethod, onClose,
}: Props) {
  return (
    <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <SpotlightCard className="w-full max-w-2xl bg-paper border border-border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto animate-scale-up">
        
        {/* Header */}
        <div className="text-center border-b border-border pb-5">
          <Trophy size={48} className="text-amber-500 mx-auto mb-2" />
          <h3 className="font-display text-2xl font-bold text-ink">Salary Negotiation Scorecard</h3>
          <p className="text-ink-muted text-sm mt-1">
            Outcome: <span className="font-semibold uppercase tracking-wider text-accent">{verdict}</span>
          </p>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-paper-card border border-border p-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Score</span>
            <span className="text-3xl font-extrabold text-accent mt-1">{scorecard.score}%</span>
            <span className="text-[9px] text-ink-muted mt-0.5">Negotiation Skill</span>
          </div>
          <div className="bg-paper-card border border-border p-4 rounded-xl flex flex-col items-center justify-center md:col-span-2">
            <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Negotiated Package Value Gain</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1">+${scorecard.financialGain.toLocaleString()}</span>
            <span className="text-[9px] text-ink-muted mt-0.5">Incremental Annual Value Negotiated</span>
          </div>
        </div>

        {/* Recruiter Deal Parameters */}
        {recruiter && (
          <div className="bg-paper-card border border-border p-5 rounded-xl space-y-3">
            <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">Recruiter Deal Parameters (Game Results)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-ink-muted">Recruiter ceiling budget (Hidden):</span>
                <div className="font-bold text-sm text-ink">${recruiter.hiddenCeilingBudget.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <span className="text-ink-muted">Your final base salary:</span>
                <div className="font-bold text-sm text-accent">${currentOffer.base.toLocaleString()}</div>
              </div>
            </div>
            <div className="border-t border-border/50 pt-2.5 mt-2.5">
              {currentOffer.base >= recruiter.hiddenCeilingBudget ? (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Trophy size={14} className="text-emerald-400 shrink-0" />
                  <span>Outstanding! You maxed out the recruiter&apos;s budget ceiling of ${recruiter.hiddenCeilingBudget.toLocaleString()}!</span>
                </div>
              ) : recruiter.hiddenCeilingBudget - currentOffer.base <= 5000 ? (
                <div className="text-xs text-emerald-400/80 font-medium flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400 shrink-0" />
                  <span>Great job! You got extremely close to their corporate budget limit (within $5,000).</span>
                </div>
              ) : (
                <div className="text-xs text-amber-400 font-medium flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <TrendingDown size={14} className="text-amber-400 shrink-0" />
                    <span>Money Left on the Table: ${Math.max(0, recruiter.hiddenCeilingBudget - currentOffer.base).toLocaleString()}</span>
                  </span>
                  <span className="text-[11px] text-ink-muted font-normal leading-relaxed">
                    The corporate limit was ${recruiter.hiddenCeilingBudget.toLocaleString()}. You could have pushed for a higher base salary.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tactics Badges */}
        {scorecard.tacticsUsed && scorecard.tacticsUsed.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">Tactics Employed</h4>
            <div className="flex flex-wrap gap-1.5">
              {scorecard.tacticsUsed.map((tac) => (
                <span key={tac} className="bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-lg text-xs font-medium">{tac}</span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider text-emerald-400">Strengths</h4>
            <ul className="space-y-1.5 text-xs text-ink-muted list-disc pl-4">
              {scorecard.strengths?.map((str, i) => <li key={i}>{str}</li>)}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider text-rose-400">Areas to Improve</h4>
            <ul className="space-y-1.5 text-xs text-ink-muted list-disc pl-4">
              {scorecard.weaknesses?.map((wk, i) => <li key={i}>{wk}</li>)}
            </ul>
          </div>
        </div>

        {/* Coach Note */}
        <div className="space-y-2">
          <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">Coach Evaluation</h4>
          <p className="text-xs text-ink-muted leading-relaxed bg-paper-warm border border-border p-3.5 rounded-xl font-mono">{scorecard.coachesNote}</p>
        </div>

        {/* Save Status + Close */}
        <div className="flex justify-between items-center border-t border-border pt-4 text-[11px] text-ink-muted">
          <div className="flex items-center gap-1.5">
            {savingStatus === "saving" && <span>Saving simulation data...</span>}
            {savingStatus === "saved" && (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check size={12} />
                <span>Scorecard logged to {savedMethod === "db" ? "dashboard history" : "local storage"}!</span>
              </span>
            )}
            {savingStatus === "error" && (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>Failed to save: {savingError}</span>
              </span>
            )}
          </div>
          <button onClick={onClose} className="bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5">
            <span>Return to Negotiator Page</span>
            <ArrowRight size={12} />
          </button>
        </div>

      </SpotlightCard>
    </div>
  );
}
