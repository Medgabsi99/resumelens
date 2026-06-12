import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
}

export default function StatCard({
  label,
  value,
  color = "var(--ink)",
}: StatCardProps) {
  return (
    <div className="glass-card bg-paper-card border border-border rounded-2xl p-5 shadow-sm hover:scale-[1.02] transition-transform duration-200">
      <div className="font-mono text-[9px] font-bold tracking-widest text-ink-faint uppercase mb-2">
        {label}
      </div>
      <div
        className="font-display text-3xl font-bold tracking-tight"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
