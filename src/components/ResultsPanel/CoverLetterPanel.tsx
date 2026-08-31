"use client";

import React, { useState } from "react";
import { Mail, Download, Check } from "lucide-react";
import styles from "../ResultsPanel.module.css";
import Section from "./Section";
import StreamingText from "@/components/StreamingText";
import { useCoverLetter } from "./useCoverLetter";
import { downloadCoverLetterPdf } from "@/lib/pdf/downloadPdf";
import { downloadApplicationBundle } from "@/lib/pdf/downloadBundle";
import { parseResume } from "@/lib/parseResume";

interface Props {
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
}

export default function CoverLetterPanel({ resumeText, jobDescription, targetRole }: Props) {
  const [clTone, setClTone] = useState<"professional" | "enthusiastic" | "confident">(
    "professional"
  );

  const {
    coverLetter,
    isGeneratingCL,
    clError,
    copied,
    handleGenerateCoverLetter,
    handleCopyCoverLetter,
  } = useCoverLetter(resumeText, jobDescription, targetRole);

  const handleDownloadTxt = () => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CoverLetter_${(targetRole || "Application").replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="print:hidden">
      <Section title="Cover Letter Generator" delay={5}>
        {!coverLetter ? (
          <div className={styles.coverCenter}>
            <p className="text-sm text-ink-muted max-w-lg leading-relaxed mb-4">
              Generate a tailored, professional cover letter matching your resume against the job
              description.
            </p>

            <div className="flex items-center gap-3 mb-5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
                Tone:
              </label>
              <select
                value={clTone}
                onChange={(e) =>
                  setClTone(e.target.value as "professional" | "enthusiastic" | "confident")
                }
                className={styles.select}
              >
                <option value="professional">Professional & Direct</option>
                <option value="enthusiastic">Enthusiastic & Driven</option>
                <option value="confident">Confident & Experienced</option>
              </select>
            </div>

            <button
              onClick={handleGenerateCoverLetter}
              disabled={isGeneratingCL}
              className={`${styles.coverBtn} flex items-center justify-center gap-2`}
            >
              {isGeneratingCL ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">Drafting Cover Letter...</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white dot-1" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white dot-2" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white dot-3" />
                  </span>
                </span>
              ) : (
                <>
                  <Mail size={14} />
                  <span>Generate Cover Letter</span>
                </>
              )}
            </button>
            {clError && (
              <div className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold">
                {clError}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className={styles.coverGeneratedActions}>
              <button onClick={handleCopyCoverLetter} className={styles.btn}>
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
                onClick={handleDownloadTxt}
                className={`${styles.btnPrimary} flex items-center gap-2`}
              >
                <Download size={14} />
                <span>Download .txt</span>
              </button>
              <button
                onClick={() => coverLetter && downloadCoverLetterPdf(coverLetter, targetRole)}
                className={`${styles.btnPrimary} flex items-center gap-2`}
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={async () => {
                  const data = parseResume(resumeText || "");
                  await downloadApplicationBundle(
                    "tech-pro",
                    data,
                    coverLetter || undefined,
                    targetRole
                  );
                }}
                className={`${styles.btnPrimary} flex items-center gap-2`}
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                }}
              >
                <Download size={14} />
                <span>📦 Application Bundle</span>
              </button>
            </div>
            <div className="print-cover-letter">
              <div className="print:hidden">
                <div className={styles.coverBox}>
                  <StreamingText
                    text={coverLetter || ""}
                    isStreaming={isGeneratingCL}
                    style={{ whiteSpace: "normal" }}
                  />
                </div>
              </div>

              <div
                className="hidden print:block"
                style={{
                  padding: "40px",
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: "12pt",
                  lineHeight: 1.6,
                  color: "black",
                  whiteSpace: "pre-wrap",
                }}
              >
                <div style={{ marginBottom: "2rem" }}>
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                {coverLetter}
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
