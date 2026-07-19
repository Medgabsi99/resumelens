import React from "react";
import { motion } from "framer-motion";

interface SectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  delay: number;
}

export default function Section({ title, children, delay }: SectionProps) {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 26,
        delay: delay * 0.1,
      }}
    >
      <div className="font-mono text-[10px] font-bold tracking-widest text-ink-faint uppercase mb-4 flex items-center gap-3">
        <span>{title}</span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>
      {children}
    </motion.div>
  );
}
