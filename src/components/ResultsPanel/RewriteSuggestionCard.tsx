import { useState } from "react";
import { RewriteSuggestion } from "@/types";

interface RewriteSuggestionCardProps {
  s: RewriteSuggestion;
}

export default function RewriteSuggestionCard({ s }: RewriteSuggestionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(s.after);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card bg-paper-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
      <div
        className="px-4 py-2.5 bg-paper-warm/40 border-b flex justify-between items-center"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-wider">{s.section}</span>
        <span className="font-mono text-[9px] text-ink-faint uppercase">Suggested Rewrite</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div
          className="p-4 text-sm leading-relaxed border-r"
          style={{
            color: "#ef4444",
            background: "rgba(239, 68, 68, 0.02)",
            borderColor: "var(--border)",
            textDecoration: "line-through",
            textDecorationColor: "rgba(239, 68, 68, 0.2)",
          }}
        >
          {s.before}
        </div>
        <div
          className="p-4 text-sm leading-relaxed relative flex flex-col justify-between gap-4"
          style={{
            color: "#10b981",
            background: "rgba(16, 185, 129, 0.02)",
          }}
        >
          <div className="pr-8">{s.after}</div>
          <button
            onClick={handleCopy}
            className="self-end px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border flex items-center gap-1.5 transition-all duration-200"
            style={{
              background: copied ? "#10b981" : "var(--paper-card)",
              color: copied ? "white" : "var(--ink-muted)",
              borderColor: copied ? "#10b981" : "var(--border)",
            }}
          >
            {copied ? (
              <span>✓ Copied</span>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Rewrite</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
