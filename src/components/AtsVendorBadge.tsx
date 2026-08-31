"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
} from "lucide-react";
import {
  detectAtsVendorFromUrl,
  ATS_VENDOR_SPECS,
  type AtsVendorId,
  type AtsVendorSpec,
} from "@/lib/atsFingerprinter";

interface Props {
  jobUrl?: string;
  vendorId?: AtsVendorId;
  className?: string;
}

export default function AtsVendorBadge({ jobUrl, vendorId, className = "" }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const detectedResult = jobUrl ? detectAtsVendorFromUrl(jobUrl) : null;
  const detectedId: AtsVendorId =
    vendorId || (detectedResult?.vendorId as AtsVendorId) || "greenhouse";
  const spec: AtsVendorSpec = ATS_VENDOR_SPECS[detectedId] || ATS_VENDOR_SPECS.greenhouse;

  return (
    <div
      className={`rounded-2xl border border-border bg-paper-card overflow-hidden shadow-sm transition-all ${className}`}
    >
      {/* Top Banner */}
      <div
        className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-paper-warm/40 transition"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
            style={{ background: spec.accentColor }}
          >
            {spec.logoBadge}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink">{spec.name} Detected</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {spec.marketShare}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted line-clamp-1">{spec.parserEngine}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-accent">
          <span>{isExpanded ? "Hide ATS Rules" : "View ATS Strictness Rules"}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Expanded Strictness & Peculiarities Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border p-5 bg-paper-warm/20 flex flex-col gap-4 text-xs"
          >
            <p className="text-ink leading-relaxed">{spec.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Parsing Traps */}
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col gap-2">
                <span className="font-mono font-bold uppercase tracking-wider text-[10.5px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert size={13} /> Failure Traps for {spec.name}
                </span>
                <ul className="space-y-1.5 text-ink leading-normal">
                  {spec.failureModes.map((fm, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>{fm}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Strategy */}
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-2">
                <span className="font-mono font-bold uppercase tracking-wider text-[10.5px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Recommended Strategy
                </span>
                <ul className="space-y-1.5 text-ink leading-normal">
                  {spec.recommendedStrategy.map((strat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{strat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
