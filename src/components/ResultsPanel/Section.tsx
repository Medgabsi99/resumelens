import React from "react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  delay: number;
}

export default function Section({ title, children, delay }: SectionProps) {
  return (
    <div className={`fade-up fade-up-delay-${delay} mb-8`}>
      <div className="font-mono text-[10px] font-bold tracking-widest text-ink-faint uppercase mb-4 flex items-center gap-3">
        <span>{title}</span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>
      {children}
    </div>
  );
}
