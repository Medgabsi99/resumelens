import React from "react";

interface AtsBarProps {
  label: string;
  value: number;
  hint: string;
}

export default function AtsBar({ label, value: rawValue, hint }: AtsBarProps) {
  const safeValue = typeof rawValue === "number" && !isNaN(rawValue) ? rawValue : 0;
  const clamped = Math.max(0, Math.min(100, safeValue));
  const color =
    clamped >= 75 ? "#10b981" : clamped >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <div className="glass-card bg-paper-card border border-border rounded-2xl p-5 shadow-sm hover:scale-[1.01]">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-ink">
          {label}
        </span>
        <span
          className="font-display text-2xl font-bold leading-none"
          style={{ color }}
        >
          {clamped}
        </span>
      </div>
      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden mb-3.5">
        <div
          className="h-full rounded-full transition-all duration-[1.2s] cubic-bezier(0.16,1,0.3,1)"
          style={{
            width: `${clamped}%`,
            background: color,
          }}
        />
      </div>
      <div className="font-mono text-[9px] text-ink-faint tracking-wide leading-relaxed">
        {hint}
      </div>
    </div>
  );
}
