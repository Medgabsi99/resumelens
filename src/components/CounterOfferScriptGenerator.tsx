"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  Copy,
  Check,
  Sparkles,
  FileText,
  TrendingUp,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  Download,
} from "lucide-react";
import { useToast } from "./ToastProvider";

interface Props {
  roleTitle?: string;
  companyName?: string;
  offeredBase?: number;
  offeredEquity?: number;
  offeredSignOn?: number;
  className?: string;
}

export type CounterTemplateId = "high_leverage" | "equity_pivot" | "perks_flexible";

export default function CounterOfferScriptGenerator({
  roleTitle = "Software Engineer",
  companyName = "Tech Corp",
  offeredBase = 135000,
  offeredEquity = 20000,
  offeredSignOn = 10000,
  className = "",
}: Props) {
  const { success: toastSuccess } = useToast();
  const [targetBase, setTargetBase] = useState<number>(Math.round(offeredBase * 1.15));
  const [targetSignOn, setTargetSignOn] = useState<number>(Math.round(offeredSignOn * 1.5));
  const [selectedTemplate, setSelectedTemplate] = useState<CounterTemplateId>("high_leverage");
  const [copied, setCopied] = useState(false);

  // ── Market Benchmark Estimates ─────────────────────────────
  const benchmarks = useMemo(() => {
    const p50 = offeredBase;
    return {
      p25: Math.round(p50 * 0.85),
      p50: p50,
      p75: Math.round(p50 * 1.18),
      p90: Math.round(p50 * 1.35),
    };
  }, [offeredBase]);

  // ── Script Templates ───────────────────────────────────────
  const scripts = useMemo(() => {
    return {
      high_leverage: {
        title: "The High-Leverage Counter-Offer",
        subtitle: "Best when you have competing offers or market benchmark data.",
        subject: `Offer Acceptance & Counter-Proposal — ${roleTitle} — [Your Name]`,
        body: `Dear [Hiring Manager / Recruiter Name],

Thank you so much for extending the offer to join ${companyName} as a ${roleTitle}! I am thrilled about the team's vision and the opportunity to make a high-impact contribution to upcoming initiatives.

After carefully evaluating the total compensation package alongside current industry market data for ${roleTitle} roles in this market, I would love to discuss adjusting the base salary. Based on recent market benchmarks and my track record of engineering impact, I am targeting a base salary of $${targetBase.toLocaleString()}.

If we can align on a base salary of $${targetBase.toLocaleString()} (or a combined total compensation package including a sign-on bonus of $${targetSignOn.toLocaleString()}), I am prepared to sign and finalize the offer immediately!

Thank you again for your time and flexibility. I look forward to your thoughts!

Warm regards,
[Your Name]
[Your Phone Number]`,
      },
      equity_pivot: {
        title: "The Equity & Sign-On Pivot",
        subtitle: "Best when the company states base salary budget is capped.",
        subject: `Compensation Package Review — ${roleTitle} — [Your Name]`,
        body: `Dear [Hiring Manager / Recruiter Name],

Thank you very much for sending over the formal offer for the ${roleTitle} position at ${companyName}. I am genuinely excited about the role and confident I can deliver immediate value to the team.

I understand that base salary bands can be strictly structured at this stage. If there is limited flexibility on the base salary of $${offeredBase.toLocaleString()}, I would love to explore bridging the gap through equity (RSUs) or a one-time sign-on bonus of $${targetSignOn.toLocaleString()}.

An increase in equity or a sign-on bonus would allow me to comfortably accept the offer right away while aligning my long-term financial goals with ${companyName}'s growth.

I look forward to discussing this and finding a win-win path forward!

Best regards,
[Your Name]`,
      },
      perks_flexible: {
        title: "The Flexible Perks & 6-Month Review Counter",
        subtitle: "Best for requesting early performance reviews, learning stipends, or remote perks.",
        subject: `Discussion Regarding Offer Details — ${roleTitle} — [Your Name]`,
        body: `Dear [Hiring Manager / Recruiter Name],

I am very excited about the offer to join ${companyName}! The team's culture and roadmap align perfectly with what I am looking for in my next career step.

To ensure complete alignment before signing, I wanted to propose a minor adjustment to the terms. If the base salary remains at $${offeredBase.toLocaleString()}, I would appreciate including a formal 6-month performance & compensation review clause, along with an annual learning/conference stipend of $3,000.

Having a structured 6-month review cycle will allow me to demonstrate tangible impact early and unlock milestone-based compensation adjustments.

Please let me know if these terms can be incorporated into the final agreement. I am eager to get started!

Sincerely,
[Your Name]`,
      },
    };
  }, [roleTitle, companyName, offeredBase, targetBase, targetSignOn]);

  const activeScript = scripts[selectedTemplate];

  const handleCopyScript = () => {
    const textToCopy = `Subject: ${activeScript.subject}\n\n${activeScript.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toastSuccess("Counter-offer script copied to clipboard!", "Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "20px",
        marginTop: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
      }}
      className={className}
    >
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <DollarSign size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
              Counter-Offer Script & Market Benchmark Generator
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--ink-muted)" }}>
              Generate strategic, high-leverage email templates tailored to your salary offer.
            </p>
          </div>
        </div>

        {/* Market Benchmark Badge */}
        <div
          style={{
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            borderRadius: "99px",
            padding: "4px 12px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#8b5cf6",
            fontFamily: "DM Mono, monospace",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <TrendingUp size={12} />
          <span>75th Percentile: ${benchmarks.p75.toLocaleString()}/yr</span>
        </div>
      </div>

      {/* Target Salary Inputs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
          background: "var(--paper-warm)",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
        }}
      >
        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", display: "block", marginBottom: "4px" }}>
            Offered Base Salary ($)
          </label>
          <input
            type="number"
            value={offeredBase}
            disabled
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--paper)",
              color: "var(--ink-muted)",
              fontSize: "12.5px",
              fontFamily: "DM Mono, monospace",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", display: "block", marginBottom: "4px" }}>
            Target Counter Base ($)
          </label>
          <input
            type="number"
            value={targetBase}
            onChange={(e) => setTargetBase(Number(e.target.value) || 0)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1.5px solid var(--accent)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "12.5px",
              fontWeight: 700,
              fontFamily: "DM Mono, monospace",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", display: "block", marginBottom: "4px" }}>
            Target Sign-On Bonus ($)
          </label>
          <input
            type="number"
            value={targetSignOn}
            onChange={(e) => setTargetSignOn(Number(e.target.value) || 0)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1.5px solid #10b981",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "12.5px",
              fontWeight: 700,
              fontFamily: "DM Mono, monospace",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Template Strategy Selector Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
        {(Object.keys(scripts) as CounterTemplateId[]).map((tKey) => {
          const tItem = scripts[tKey];
          const active = selectedTemplate === tKey;
          return (
            <button
              key={tKey}
              onClick={() => setSelectedTemplate(tKey)}
              style={{
                background: active ? "var(--accent)" : "var(--paper)",
                color: active ? "white" : "var(--ink-muted)",
                border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tItem.title}
            </button>
          );
        })}
      </div>

      {/* Generated Email Script Box */}
      <div
        style={{
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "12px",
          padding: "16px",
          color: "#e6edf3",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          lineHeight: "1.6",
          fontSize: "13px",
          position: "relative",
          marginBottom: "14px",
        }}
      >
        <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #21262d" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Subject Line:
          </span>
          <div style={{ fontWeight: 700, color: "#58a6ff", fontSize: "13.5px", marginTop: "2px" }}>
            {activeScript.subject}
          </div>
        </div>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            margin: 0,
            color: "#c9d1d9",
          }}
        >
          {activeScript.body}
        </pre>
      </div>

      {/* Copy & Action Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={handleCopyScript}
          style={{
            background: copied ? "#10b981" : "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Copied to Clipboard!" : "Copy Counter-Offer Email"}</span>
        </button>
      </div>
    </div>
  );
}
