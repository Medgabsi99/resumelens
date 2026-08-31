"use client";

import React from "react";
import { Target, Mic } from "lucide-react";
import styles from "../ResultsPanel.module.css";
import Section from "./Section";
import StreamingText from "@/components/StreamingText";
import { useInterviewPrep } from "./useInterviewPrep";
import { useToast } from "../ToastProvider";
import dynamic from "next/dynamic";

const MockInterviewBoard = dynamic(() => import("@/components/MockInterviewBoard"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-muted text-sm">Loading Interview Simulator...</div>
  ),
});

interface Props {
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
}

export default function InterviewPrepPanel({ resumeText, jobDescription, targetRole }: Props) {
  const { success: toastSuccess } = useToast();

  const {
    interviewQuestions,
    mockQuestions,
    isGeneratingIQ,
    isFetchingMock,
    iqError,
    showMockInterview,
    setShowMockInterview,
    handleGenerateInterviewQuestions,
    handleStartMockInterview,
  } = useInterviewPrep(resumeText, jobDescription, targetRole);

  return (
    <div className="print:hidden">
      <Section title="Interview Prep Questions" delay={6}>
        {!interviewQuestions ? (
          <div className={styles.coverCenter}>
            <p className="text-sm text-ink-muted max-w-lg leading-relaxed">
              Prepare for your interview with AI-generated questions tailored to your resume and the
              job description.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 12,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button
                onClick={handleGenerateInterviewQuestions}
                disabled={isGeneratingIQ}
                className={`${styles.coverBtn} flex items-center gap-2`}
              >
                {isGeneratingIQ ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-pulse">Generating...</span>
                  </span>
                ) : (
                  <>
                    <Target size={14} />
                    <span>Generate Questions</span>
                  </>
                )}
              </button>
              <button
                onClick={handleStartMockInterview}
                disabled={isFetchingMock}
                className={`${styles.coverBtn} flex items-center gap-2`}
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                  border: "none",
                  color: "white",
                  boxShadow: "0 4px 14px var(--brand-glow)",
                }}
              >
                <Mic size={14} />
                <span>Start Interactive Simulator</span>
              </button>
            </div>
            {iqError && (
              <div className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold">
                {iqError}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className={styles.coverGeneratedActions}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(interviewQuestions);
                  toastSuccess("Interview questions copied");
                }}
                className={styles.btn}
              >
                Copy Questions
              </button>
              <button
                onClick={handleStartMockInterview}
                disabled={isFetchingMock}
                className={`${styles.btnPrimary} flex items-center gap-2`}
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                  border: "none",
                  boxShadow: "0 2px 10px var(--brand-glow)",
                }}
              >
                <Mic size={14} />
                <span>Start Interactive Simulator</span>
              </button>
            </div>
            <div className={styles.coverBox}>
              <StreamingText
                text={interviewQuestions || ""}
                isStreaming={isGeneratingIQ}
                style={{ whiteSpace: "normal" }}
              />
            </div>
          </div>
        )}
      </Section>

      {showMockInterview && mockQuestions.length > 0 && (
        <MockInterviewBoard
          questions={mockQuestions}
          resumeText={resumeText || ""}
          jobDescription={jobDescription}
          onClose={() => setShowMockInterview(false)}
        />
      )}
    </div>
  );
}
