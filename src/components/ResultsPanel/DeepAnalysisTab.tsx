"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import KeywordHighlighter from "./KeywordHighlighter";
import { runAtsChecks } from "@/lib/atsRulesChecker";
import type { AnalysisResult } from "@/types";

const AtsRulesPanel = dynamic(() => import("@/components/AtsRulesPanel"), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-muted text-sm">Loading ATS Rules Scanner...</div>
  ),
});

const RecruiterHeatmap = dynamic(() => import("@/components/RecruiterHeatmap"), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-muted text-sm">Loading Eye-Tracking Heatmap...</div>
  ),
});

const SkillRadarChart = dynamic(() => import("@/components/SkillRadarChart"), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-muted text-sm">Loading 360° Skill Radar...</div>
  ),
});

interface Props {
  displayResult: AnalysisResult;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
}

export default function DeepAnalysisTab({ displayResult, resumeText, jobDescription }: Props) {
  const atsRules = useMemo(() => {
    return (
      displayResult.ats_rules ?? (resumeText ? runAtsChecks(resumeText, jobDescription) : undefined)
    );
  }, [displayResult.ats_rules, resumeText, jobDescription]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-2 sm:p-4 lg:p-6 flex flex-col gap-6"
    >
      {/* ── 1. Deterministic ATS Rules Scanner ── */}
      {atsRules && <AtsRulesPanel atsRules={atsRules} />}

      {/* ── 2. Interactive Keyword Highlighter & Match Matrix ── */}
      {resumeText && (
        <KeywordHighlighter
          resumeText={resumeText}
          matched={displayResult.keywords_matched || []}
          missing={displayResult.keywords_missing || []}
        />
      )}

      {/* ── 3. 7-Second Recruiter Eye-Tracking Heatmap ── */}
      {resumeText && <RecruiterHeatmap resumeText={resumeText} />}

      {/* ── 4. 360° Skill Radar Benchmark Chart ── */}
      {resumeText && <SkillRadarChart resumeText={resumeText} />}
    </motion.div>
  );
}
