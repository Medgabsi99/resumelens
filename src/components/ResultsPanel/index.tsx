"use client";

import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { AnalysisResult } from "@/types";
import ClassicTemplate from "@/components/pdf-templates/ClassicTemplate";
import ModernTemplate from "@/components/pdf-templates/ModernTemplate";
import MinimalTemplate from "@/components/pdf-templates/MinimalTemplate";
import CreativeTemplate from "@/components/pdf-templates/CreativeTemplate";
import ResumeEditor from "@/components/ResumeEditor";
import ResumeTemplateSelector from "@/components/ResumeTemplateSelector";
import SaveResumeModal from "@/components/SaveResumeModal";
import JobMatchPanel from "@/components/JobMatchPanel";
import MockInterviewBoard from "@/components/MockInterviewBoard";
import PersonalPortfolioGenerator from "@/components/PersonalPortfolioGenerator";
import styles from "../ResultsPanel.module.css";
import Toast from "../Toast";

// Extracted Subcomponents
import Section from "./Section";
import TagList from "./TagList";
import Chip from "./Chip";
import AtsBar from "./AtsBar";
import RewriteSuggestionCard from "./RewriteSuggestionCard";

// Extracted Custom Hooks
import { useCoverLetter } from "./useCoverLetter";
import { useInterviewPrep } from "./useInterviewPrep";
import { useResumeChat } from "./useResumeChat";

interface Props {
  result: AnalysisResult;
  hasJD: boolean;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  analysisId?: string;
}

type PdfTemplate = "results" | "classic" | "modern" | "minimal" | "creative";

export default function ResultsPanel({
  result,
  hasJD,
  resumeText,
  jobDescription,
  targetRole,
  analysisId,
}: Props) {
  const componentRef = useRef<HTMLDivElement>(null);
  const pdfClassicRef = useRef<HTMLDivElement>(null);
  const pdfModernRef = useRef<HTMLDivElement>(null);
  const clRef = useRef<HTMLDivElement>(null);

  // Printer handlers
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "ResumeLens-Analysis",
  });

  const handlePrintCL = useReactToPrint({
    contentRef: clRef,
    documentTitle: "ResumeLens-CoverLetter",
  });

  const handlePrintClassic = useReactToPrint({
    contentRef: pdfClassicRef,
    documentTitle: "ResumeLens-Classic",
  });

  const handlePrintModern = useReactToPrint({
    contentRef: pdfModernRef,
    documentTitle: "ResumeLens-Modern",
  });

  // State Management
  const [barWidth, setBarWidth] = useState(0);
  const [pdfTemplate, setPdfTemplate] = useState<PdfTemplate>("results");
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Custom Hooks
  const {
    coverLetter,
    isGeneratingCL,
    clError,
    copied: clCopied,
    handleGenerateCoverLetter,
    handleCopyCoverLetter,
  } = useCoverLetter(resumeText, jobDescription, targetRole);

  const {
    interviewQuestions,
    isGeneratingIQ,
    iqError,
    showMockInterview,
    setShowMockInterview,
    mockQuestions,
    isFetchingMock,
    handleGenerateInterviewQuestions,
    handleStartMockInterview,
  } = useInterviewPrep(resumeText, jobDescription, targetRole);

  const {
    chatInput,
    setChatInput,
    chatHistory,
    isChatting,
    chatScrollRef,
    handleChatSubmit,
  } = useResumeChat(resumeText, jobDescription, targetRole);

  // Score Bar Animation
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(result.score), 200);
    return () => clearTimeout(t);
  }, [result.score]);

  const scoreColor =
    result.score >= 75 ? "#2d6a4f" : result.score >= 55 ? "#92400e" : "#7a2020";

  const radius = 22;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (barWidth / 100) * circumference;

  async function handleExportPdf() {
    if (!resumeText) {
      setToastMessage("No resume text available for export.");
      setToastOpen(true);
      return;
    }

    setIsExporting(true);
    try {
      const payload = {
        template: pdfTemplate,
        result,
        targetRole,
        jobDescription,
        resumeText,
      };

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Export failed");
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (data?.url) {
          setExportedUrl(data.url);
          setToastMessage("PDF uploaded — click to open or copy link.");
          setToastOpen(true);
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(data.url);
            }
          } catch (err) {
            // ignore clipboard errors
          }
        } else {
          throw new Error(data?.error || "Export returned no URL.");
        }
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ResumeLens-${pdfTemplate}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      setToastMessage((e as Error).message || "Export failed");
      setToastOpen(true);
    } finally {
      setIsExporting(false);
    }
  }

  const renderSelectedTemplate = () => {
    if (pdfTemplate === "results") {
      return (
        <div style={{ padding: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}
            >
              {targetRole || "Resume Review"}
            </div>
            <div
              style={{
                fontSize: 22,
                fontFamily: "DM Serif Display, serif",
                color: scoreColor,
              }}
            >
              {result.score}
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              color: "var(--ink-muted)",
              whiteSpace: "pre-wrap",
            }}
          >
            {result.summary}
          </div>
        </div>
      );
    }

    const templateProps = {
      resumeText,
      jobDescription,
      targetRole,
      result,
    };

    switch (pdfTemplate) {
      case "classic":
        return <ClassicTemplate {...templateProps} />;
      case "modern":
        return <ModernTemplate {...templateProps} />;
      case "minimal":
        return <MinimalTemplate {...templateProps} />;
      default:
        return <CreativeTemplate {...templateProps} />;
    }
  };

  const handleSavePdf = () => {
    if (pdfTemplate === "results") {
      handlePrint();
      return;
    }

    if (pdfTemplate === "classic") {
      handlePrintClassic();
      return;
    }

    if (pdfTemplate === "modern") {
      handlePrintModern();
      return;
    }

    void handleExportPdf();
  };

  return (
    <div ref={componentRef} className={`${styles.container} fade-up`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitle}>Analysis Complete</div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={pdfTemplate}
              onChange={(e) => setPdfTemplate(e.target.value as PdfTemplate)}
              className={styles.select}
            >
              <option value="results">Results View</option>
              <option value="classic">Classic Template</option>
              <option value="modern">Modern Template</option>
              <option value="minimal">Minimal Template</option>
              <option value="creative">Creative Template</option>
            </select>

            <button
              onClick={handleSavePdf}
              className={`${styles.btn} print:hidden`}
            >
              ↓ Save PDF
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className={`${styles.btnPrimary} print:hidden`}
            >
              {isExporting ? "Generating PDF..." : "Download Hi-Fi PDF"}
            </button>
            {exportedUrl && (
              <div className={styles.exportLinkGroup}>
                <a
                  href={exportedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.openLink}
                >
                  Open PDF
                </a>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(exportedUrl);
                      setToastMessage("Link copied to clipboard");
                      setToastOpen(true);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 1800);
                    } catch (e) {
                      setToastMessage("Failed to copy link");
                      setToastOpen(true);
                    }
                  }}
                  className={
                    copiedLink
                      ? `${styles.copyBtn} ${styles.copied}`
                      : styles.copyBtn
                  }
                >
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className={styles.sectionHeader} style={{ marginBottom: 2 }}>Overall Score</div>
            <div className="text-[11px] text-ink-muted font-medium">ATS Match Level</div>
          </div>
          <div className="relative flex items-center justify-center w-16 h-16">
            <div 
              className="absolute inset-1 rounded-full blur-[6px] opacity-20 transition-all duration-[1.2s]"
              style={{
                background: scoreColor,
              }}
            />
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-border"
                strokeWidth={strokeWidth}
                fill="transparent"
                style={{ stroke: "var(--border)" }}
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={scoreColor}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1)"
              />
            </svg>
            <div
              className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold leading-none"
              style={{
                color: scoreColor,
              }}
            >
              {result.score}
            </div>
          </div>
        </div>
      </div>

      {/* ATS Breakdown */}
      {result.ats_breakdown && (
        <div style={{ padding: "24px 30px 0", marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--ink-faint)",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ATS Score Breakdown
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <AtsBar
              label="Format"
              value={result.ats_breakdown.format}
              hint="ATS-friendly structure"
            />
            <AtsBar
              label="Keywords"
              value={result.ats_breakdown.keywords}
              hint={result.keywords_matched ? "vs job description" : "Industry relevance"}
            />
            <AtsBar
              label="Impact"
              value={result.ats_breakdown.impact}
              hint="Action verbs + metrics"
            />
            <AtsBar
              label="Readability"
              value={result.ats_breakdown.readability}
              hint="Scannability & structure"
            />
          </div>

          {/* Launch ATS Structural Scanner & Heatmap */}
          {analysisId && (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }} className="print:hidden">
              <a
                href={`/dashboard/scanner?analysisId=${analysisId}`}
                style={{
                  background: "linear-gradient(135deg, var(--accent), #4f46e5)",
                  color: "white",
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.25)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                🔥 Open ATS Structural Scanner & Heatmap ➔
              </a>
            </div>
          )}
        </div>
      )}

      <div className={styles.previewSection}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              color: "var(--ink-faint)",
              marginBottom: 10,
            }}
          >
            Template Preview
          </div>
          <div className={styles.previewCard}>
            <div className={styles.previewCenter}>
              <div className={styles.previewInner}>
                {renderSelectedTemplate()}
              </div>
            </div>
          </div>
        </div>

        <Section title="Overall Assessment" delay={1}>
          <div className={styles.assessment}>{result.summary}</div>
        </Section>

        <div className={styles.gridTwo}>
          <Section title="Strengths" delay={2}>
            <TagList tags={result.strengths} variant="success" />
          </Section>
          <Section title="Areas to Improve" delay={2}>
            <TagList tags={result.weaknesses} variant="warn" />
          </Section>
        </div>

        {hasJD && result.keywords_matched && (
          <Section title="Keyword Analysis" delay={3}>
            <div className={styles.tagWrap} style={{ marginBottom: 10 }}>
              {(result.keywords_matched || []).slice(0, 14).map((k) => (
                <Chip key={k} label={`✓ ${k}`} variant="match" />
              ))}
            </div>
            <div className={styles.tagWrap}>
              {(result.keywords_missing || []).slice(0, 10).map((k) => (
                <Chip key={k} label={`✗ ${k}`} variant="miss" />
              ))}
            </div>
          </Section>
        )}

        <Section title="Rewrite Suggestions" delay={4}>
          <div style={{ display: "grid", gap: 14 }}>
            {result.suggestions.map((s, i) => (
              <RewriteSuggestionCard key={i} s={s} />
            ))}
          </div>
        </Section>

        {/* Inline Resume Editor */}
        <div className="print:hidden" style={{ marginTop: 8 }}>
          <ResumeEditor
            initialText={resumeText || ""}
            suggestions={result.suggestions}
            targetRole={targetRole}
            resultScore={result.score}
            analysisId={analysisId}
          />
        </div>

        {/* Resume Templates */}
        {resumeText && (
          <div className="print:hidden" style={{ marginTop: 16 }}>
            <Section title="Resume Templates" delay={5}>
              <p style={{ 
                fontSize: 14, 
                color: "var(--ink-muted)", 
                marginBottom: 16,
                lineHeight: 1.6,
              }}>
                Choose a professional template to format your resume. Click on a template to preview it with your content, then download as PDF.
              </p>
              <ResumeTemplateSelector 
                resumeText={resumeText} 
                targetRole={targetRole} 
              />
            </Section>
          </div>
        )}

        {/* Save to Library */}
        <div className="print:hidden" style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowSaveModal(true)}
            style={{
              background: "transparent",
              color: "var(--accent)",
              border: "1.5px solid var(--accent-border)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Instrument Sans, sans-serif",
              transition: "all 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Save to Resume Library
          </button>
          {savedToast && (
            <span style={{ marginLeft: 10, fontSize: 12, color: "#2d6a4f", fontWeight: 600 }}>
              ✓ Saved to library
            </span>
          )}
        </div>

        {/* Job Match — Resume vs Job Description */}
        {resumeText && (
          <div className="print:hidden">
            <Section title="Job Match 🎯" delay={5}>
              <JobMatchPanel
                resumeText={resumeText}
                defaultJobDescription={jobDescription}
                defaultJobTitle={targetRole}
              />
            </Section>
          </div>
        )}

        <div className="print:hidden">
          <Section title="Cover Letter Generator" delay={5}>
            {!coverLetter ? (
              <div className={styles.coverCenter}>
                <p className="text-sm text-ink-muted max-w-lg leading-relaxed">
                  Need a cover letter? Generate a highly personalized one
                  instantly using your resume and the job description.
                </p>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isGeneratingCL}
                  className={styles.coverBtn}
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
                    "Generate Cover Letter ✉️"
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
                  <button
                    onClick={handleCopyCoverLetter}
                    className={styles.btn}
                  >
                    {clCopied ? "Copied! ✓" : "Copy to Clipboard"}
                  </button>
                  <button onClick={handlePrintCL} className={styles.btnPrimary}>
                    ↓ Download Cover Letter
                  </button>
                </div>
                <div ref={clRef} className="print-cover-letter">
                  <div className="print:hidden">
                    <div className={styles.coverBox}>{coverLetter}</div>
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

        <div className="print:hidden">
          <Section title="Interview Prep Questions" delay={6}>
            {!interviewQuestions ? (
              <div className={styles.coverCenter}>
                <p className="text-sm text-ink-muted max-w-lg leading-relaxed">
                  Prepare for your interview with AI-generated questions tailored to your resume and the job description.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    onClick={handleGenerateInterviewQuestions}
                    disabled={isGeneratingIQ}
                    className={styles.coverBtn}
                  >
                    {isGeneratingIQ ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-pulse">Generating...</span>
                      </span>
                    ) : (
                      "Generate Questions 🎯"
                    )}
                  </button>
                  <button
                    onClick={handleStartMockInterview}
                    disabled={isFetchingMock}
                    className={styles.coverBtn}
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                      border: "none",
                      color: "white",
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    {isFetchingMock ? "Preparing Room..." : "🎙️ Start Interactive Simulator"}
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
                      setToastMessage("Interview questions copied");
                      setToastOpen(true);
                    }}
                    className={styles.btn}
                  >
                    Copy Questions
                  </button>
                  <button
                    onClick={handleStartMockInterview}
                    disabled={isFetchingMock}
                    className={styles.btnPrimary}
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                      border: "none",
                      boxShadow: "0 2px 10px rgba(99, 102, 241, 0.25)",
                    }}
                  >
                    {isFetchingMock ? "Preparing Room..." : "🎙️ Start Interactive Simulator"}
                  </button>
                </div>
                <div className={styles.coverBox}>
                  {interviewQuestions}
                </div>
              </div>
            )}
          </Section>
        </div>

        {resumeText && analysisId && (
          <div className="print:hidden">
            <Section title="Personal Portfolio Generator 🌐" delay={6.5}>
              <PersonalPortfolioGenerator
                analysisId={analysisId}
                resumeText={resumeText}
              />
            </Section>
          </div>
        )}

        <div className="print:hidden">
          <Section title="Chat with your Resume" delay={7}>
            <div className={styles.chatBox}>
              <div
                ref={chatScrollRef}
                className={styles.chatScroll}
                style={{
                  background:
                    chatHistory.length === 0
                      ? "var(--paper-warm)"
                      : "var(--paper)",
                }}
              >
                {chatHistory.length === 0 ? (
                  <div className="text-center text-ink-muted text-xs py-8">
                    <p className="mb-6 text-sm">
                      Have a specific question about your resume? Ask the AI
                      below or try one of these quick starts:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                      {[
                        "How can I rewrite my summary to sound more confident?",
                        "What are the biggest keyword gaps for this role?",
                        "Suggest 3 strong action verbs to replace weak ones.",
                        "How can I format this to make it more readable?",
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          onClick={() => handleChatSubmit(promptText)}
                          disabled={isChatting}
                          className={styles.chatQuickStart}
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={msg.role === "user" ? styles.userBubble : styles.aiBubble}
                    >
                      {msg.text}
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className={styles.typingIndicator}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                )}
              </div>

              <div className={styles.chatInputRow}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleChatSubmit();
                  }}
                  placeholder="Ask a question about your resume..."
                  disabled={isChatting || !resumeText}
                  className={styles.input}
                />
                <button
                  onClick={() => handleChatSubmit()}
                  disabled={isChatting || !chatInput.trim() || !resumeText}
                  className={styles.sendBtn}
                >
                  Send
                </button>
              </div>
            </div>
          </Section>
        </div>
      </div>

      <div style={{ position: "absolute", left: -9999, top: 0, width: 900 }}>
        <div ref={pdfClassicRef}>
          <ClassicTemplate
            resumeText={resumeText}
            jobDescription={jobDescription}
            targetRole={targetRole}
            result={result}
          />
        </div>
        <div ref={pdfModernRef}>
          <ModernTemplate
            resumeText={resumeText}
            jobDescription={jobDescription}
            targetRole={targetRole}
            result={result}
          />
        </div>
      </div>
      {showSaveModal && resumeText && (
        <SaveResumeModal
          resumeText={resumeText}
          currentScore={result.score}
          targetRole={targetRole}
          jobDescription={jobDescription}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {
            setShowSaveModal(false);
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 3000);
          }}
        />
      )}

      {toastOpen && toastMessage && (
        <Toast
          message={toastMessage}
          actionLabel={exportedUrl ? "Open" : undefined}
          onAction={() => exportedUrl && window.open(exportedUrl, "_blank")}
          onClose={() => setToastOpen(false)}
        />
      )}

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
