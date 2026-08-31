"use client";

import React from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Globe, Users, PenTool, Layout } from "lucide-react";
import Section from "./Section";
import CoverLetterPanel from "./CoverLetterPanel";
import InterviewPrepPanel from "./InterviewPrepPanel";
import OutreachPanel from "./OutreachPanel";
import ResumeTemplateSelector from "@/components/ResumeTemplateSelector";
import type { AnalysisResult } from "@/types";

const PersonalPortfolioGenerator = dynamic(
  () => import("@/components/PersonalPortfolioGenerator"),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-muted text-sm">Loading Portfolio Generator...</div>
    ),
  }
);

const LinkedInOptimizer = dynamic(() => import("@/components/LinkedInOptimizer"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-muted text-sm">Loading LinkedIn Optimizer...</div>
  ),
});

const ResumeEditor = dynamic(() => import("@/components/ResumeEditor"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted text-sm">Loading Resume Editor...</div>,
});

interface Props {
  displayResult: AnalysisResult;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  analysisId?: string;
}

export default function ToolsTab({
  displayResult,
  resumeText,
  jobDescription,
  targetRole,
  analysisId,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-2 sm:p-4 lg:p-6 flex flex-col gap-6"
    >
      {/* ── 1. Cover Letter Generator ── */}
      <CoverLetterPanel
        resumeText={resumeText}
        jobDescription={jobDescription}
        targetRole={targetRole}
      />

      {/* ── 2. Recruiter Outreach & Networking Messages ── */}
      <OutreachPanel
        resumeText={resumeText}
        jobDescription={jobDescription}
        targetRole={targetRole}
      />

      {/* ── 3. Mock Interview Prep & Interactive Simulator ── */}
      <InterviewPrepPanel
        resumeText={resumeText}
        jobDescription={jobDescription}
        targetRole={targetRole}
      />

      {/* ── 4. Personal Portfolio Generator ── */}
      {resumeText && analysisId && (
        <div id="portfolio-section">
          <Section
            title={
              <span className="flex items-center gap-1.5">
                <Globe size={16} />
                <span>Personal Portfolio Generator</span>
              </span>
            }
            delay={6.5}
          >
            <PersonalPortfolioGenerator analysisId={analysisId} resumeText={resumeText} />
          </Section>
        </div>
      )}

      {/* ── 5. LinkedIn Profile Optimizer ── */}
      {resumeText && (
        <div id="linkedin-section">
          <Section
            title={
              <span className="flex items-center gap-1.5">
                <Users size={16} />
                <span>LinkedIn Headline &amp; About Optimizer</span>
              </span>
            }
            delay={7}
          >
            <LinkedInOptimizer
              defaultRole={targetRole}
              defaultJobDescription={jobDescription}
              resumeText={resumeText}
            />
          </Section>
        </div>
      )}

      {/* ── 6. Live Resume Visual Editor ── */}
      {resumeText && (
        <div id="editor-section">
          <Section
            title={
              <span className="flex items-center gap-1.5">
                <PenTool size={16} />
                <span>Visual Resume Editor</span>
              </span>
            }
            delay={7.5}
          >
            <ResumeEditor
              initialText={resumeText}
              suggestions={displayResult.suggestions || []}
              targetRole={targetRole}
              jobDescription={jobDescription}
              resultScore={displayResult.score}
              analysisId={analysisId}
            />
          </Section>
        </div>
      )}

      {/* ── 7. Resume Templates Gallery ── */}
      {resumeText && (
        <div id="templates-section">
          <Section
            title={
              <span className="flex items-center gap-1.5">
                <Layout size={16} />
                <span>Exportable Resume Templates</span>
              </span>
            }
            delay={8}
          >
            <ResumeTemplateSelector resumeText={resumeText} targetRole={targetRole} />
          </Section>
        </div>
      )}
    </motion.div>
  );
}
