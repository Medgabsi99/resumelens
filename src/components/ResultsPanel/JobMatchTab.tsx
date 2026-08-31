"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { AnalysisResult } from "@/types";
import AtsVendorBadge from "@/components/AtsVendorBadge";
import SkillBridgeModal from "@/components/SkillBridgeModal";

const JobMatchPanel = dynamic(() => import("@/components/JobMatchPanel"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-muted text-sm">Loading Job Match Matrix...</div>
  ),
});

const AtsVendorSimulator = dynamic(() => import("@/components/AtsVendorSimulator"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-muted text-sm">Loading ATS Vendor Simulator...</div>
  ),
});

interface Props {
  displayResult: AnalysisResult;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  onGoToEditor?: () => void;
  onOpenAutoFix?: () => void;
}

export default function JobMatchTab({
  displayResult,
  resumeText,
  jobDescription,
  targetRole,
  onGoToEditor,
  onOpenAutoFix,
}: Props) {
  const [selectedBridgeSkill, setSelectedBridgeSkill] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-2 sm:p-4 lg:p-6 flex flex-col gap-6"
    >
      {/* ── 1. Target ATS Vendor Intelligence Badge ── */}
      <AtsVendorBadge />

      {/* ── 2. Missing Skills Fast-Track Learning Bridges ── */}
      {displayResult.keywords_missing && displayResult.keywords_missing.length > 0 && (
        <div className="bento-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              🎓 Skill Gap Fast-Track Pathways
            </span>
            <span className="text-[11px] text-ink-faint">
              1-Click credentials &amp; portfolio projects
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {displayResult.keywords_missing.slice(0, 8).map((kw, i) => (
              <button
                key={i}
                onClick={() => setSelectedBridgeSkill(kw)}
                className="px-3 py-1.5 rounded-xl border border-border bg-paper-warm hover:bg-accent-bg hover:border-accent/40 text-xs font-bold text-ink hover:text-accent transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{kw}</span>
                <span className="text-[10px] text-accent">➔ Bridge</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Interactive Job Match Panel ── */}
      {resumeText && (
        <JobMatchPanel
          resumeText={resumeText}
          defaultJobDescription={jobDescription}
          defaultJobTitle={targetRole}
          onGoToEditor={onGoToEditor}
          onOpenAutoFix={onOpenAutoFix}
        />
      )}

      {/* ── 4. Real-World ATS Vendor Simulator ── */}
      {resumeText && <AtsVendorSimulator resumeText={resumeText} jobDescription={jobDescription} />}

      {/* Skill Gap Bridge Learning Modal */}
      {selectedBridgeSkill && (
        <SkillBridgeModal
          isOpen={!!selectedBridgeSkill}
          onClose={() => setSelectedBridgeSkill(null)}
          skillName={selectedBridgeSkill}
        />
      )}
    </motion.div>
  );
}
