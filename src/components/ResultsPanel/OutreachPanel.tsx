"use client";

import React from "react";
import { Send, Check, PenTool } from "lucide-react";
import styles from "../ResultsPanel.module.css";
import Section from "./Section";
import { useOutreach } from "./useOutreach";

interface Props {
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
}

export default function OutreachPanel({ resumeText, jobDescription, targetRole }: Props) {
  const {
    outreachMessage,
    setOutreachMessage,
    outreachType,
    setOutreachType,
    companyName,
    setCompanyName,
    recruiterName,
    setRecruiterName,
    isGenerating,
    copied,
    error,
    handleGenerateOutreach,
    handleCopyOutreach,
  } = useOutreach(resumeText, jobDescription, targetRole);

  return (
    <div className="print:hidden">
      <Section title="Outreach Message Generator" delay={5.5}>
        {!outreachMessage ? (
          <div className={styles.coverCenter}>
            <p className="text-sm text-ink-muted max-w-lg leading-relaxed mb-4">
              Need a cold outreach message? Generate a highly personalized email or LinkedIn note
              matching your resume against the job description.
            </p>

            <div className="w-full max-w-md mx-auto flex flex-col gap-3.5 mb-5 text-left bg-paper-warm/40 border border-border p-4 rounded-2xl">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted block mb-1">
                  Recipient Type
                </label>
                <select
                  value={outreachType}
                  onChange={(e) => setOutreachType(e.target.value as "recruiter" | "peer")}
                  className={styles.select}
                  style={{ width: "100%", padding: "8px 12px" }}
                >
                  <option value="recruiter">Recruiter (Professional & Direct)</option>
                  <option value="peer">Peer / Engineer (Casual & Technical)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted block mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={styles.select}
                  style={{ width: "100%", padding: "8px 12px" }}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted block mb-1">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe, Tech Recruiter"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className={styles.select}
                  style={{ width: "100%", padding: "8px 12px" }}
                />
              </div>
            </div>

            <button
              onClick={handleGenerateOutreach}
              disabled={isGenerating}
              className={`${styles.coverBtn} flex items-center justify-center gap-2`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">Generating Outreach Note...</span>
                </span>
              ) : (
                <>
                  <Send size={14} />
                  <span>Generate Outreach Note</span>
                </>
              )}
            </button>
            {error && (
              <div className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className={styles.coverGeneratedActions}>
              <button onClick={handleCopyOutreach} className={styles.btn}>
                {copied ? (
                  <>
                    <Check size={12} />
                    <span>Copied!</span>
                  </>
                ) : (
                  "Copy to Clipboard"
                )}
              </button>
              <button
                onClick={() => setOutreachMessage(null)}
                className={`${styles.btnPrimary} flex items-center gap-2`}
              >
                <PenTool size={14} />
                <span>Edit Options / Generate New</span>
              </button>
            </div>
            <div className={styles.coverBox} style={{ whiteSpace: "pre-wrap" }}>
              {outreachMessage}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
