"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Sparkles, Copy, Check } from "lucide-react";

interface Props {
  targetRole?: string;
  resumeText?: string;
}

export default function SalaryEstimatorCard({
  targetRole = "Software Engineer",
  resumeText = "",
}: Props) {
  const [copied, setCopied] = useState(false);

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
    navigator.clipboard.writeText(negotiationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card bg-paper-card border border-border p-5 rounded-2xl mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">AI Salary Estimator & Negotiation Helper</h3>
            <p className="text-[11px] text-ink-muted">
              Estimated market value for{" "}
              <span className="font-semibold text-ink">{targetRole}</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
          <TrendingUp size={11} />
          <span>Market Benchmark</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 bg-paper rounded-xl border border-border mb-4 text-center">
        <div>
          <div className="text-[10px] uppercase font-mono font-semibold text-ink-faint">
            25th Percentile
          </div>
          <div className="text-base font-bold text-ink">${baseSalary.toLocaleString()}</div>
        </div>
        <div className="border-x border-border px-2">
          <div className="text-[10px] uppercase font-mono font-bold text-emerald-500">
            Median Target
          </div>
          <div className="text-lg font-extrabold text-emerald-500">
            ${medianSalary.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-mono font-semibold text-ink-faint">
            75th Percentile
          </div>
          <div className="text-base font-bold text-ink">${topSalary.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/20 p-3.5 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-accent flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>Recruiter Salary Negotiation Script</span>
          </span>
          <button
            onClick={handleCopyScript}
            className="text-[11px] font-semibold text-accent hover:text-accent-hover flex items-center gap-1 bg-white dark:bg-paper-card border border-accent/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
          >
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            <span>{copied ? "Copied Script!" : "Copy Email"}</span>
          </button>
        </div>
        <p className="text-[11px] font-mono text-ink-muted leading-relaxed whitespace-pre-wrap">
          {negotiationScript}
        </p>
      </div>
    </div>
  );
}
