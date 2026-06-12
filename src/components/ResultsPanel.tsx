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
import styles from "./ResultsPanel.module.css";
import Toast from "./Toast";

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
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  const [barWidth, setBarWidth] = useState(0);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [clError, setClError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState<PdfTemplate>("results");
  const [isExporting, setIsExporting] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [isChatting, setIsChatting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<string | null>(null);
  const [isGeneratingIQ, setIsGeneratingIQ] = useState(false);
  const [iqError, setIqError] = useState<string | null>(null);

  // Mock Interview States
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [mockQuestions, setMockQuestions] = useState<string[]>([]);
  const [isFetchingMock, setIsFetchingMock] = useState(false);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory, isChatting]);

  async function handleChatSubmit(overrideMsg?: string) {
    const activeMsg = overrideMsg !== undefined ? overrideMsg : chatInput;
    if (!activeMsg.trim() || !resumeText) return;

    const userMsg = activeMsg.trim();
    if (overrideMsg === undefined) {
      setChatInput("");
    }

    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsChatting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          resumeText,
          jobDescription,
          targetRole,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setChatHistory((prev) => [...prev, { role: "ai", text: data.data }]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "ai",
            text: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "Network error. Please try again." },
      ]);
    } finally {
      setIsChatting(false);
    }
  }

  async function handleGenerateInterviewQuestions() {
    if (!resumeText) {
      setIqError("No resume text available to generate interview questions.");
      return;
    }

    setIsGeneratingIQ(true);
    setIqError(null);

    try {
      const res = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        setIqError(data?.error || "Failed to generate interview questions.");
        return;
      }

      setInterviewQuestions(data.data || "");
    } catch (e) {
      console.error(e);
      setIqError("Network error while generating interview questions.");
    } finally {
      setIsGeneratingIQ(false);
    }
  }

  async function handleStartMockInterview() {
    if (!resumeText) return;

    if (mockQuestions.length > 0) {
      setShowMockInterview(true);
      return;
    }

    setIsFetchingMock(true);
    setIqError(null);

    try {
      const res = await fetch("/api/interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        throw new Error(data?.error || "Failed to generate mock questions.");
      }

      setMockQuestions(data.questions || []);
      setShowMockInterview(true);
    } catch (err: any) {
      console.error(err);
      setIqError(err.message || "Failed to start mock interview.");
    } finally {
      setIsFetchingMock(false);
    }
  }

  async function handleGenerateCoverLetter() {
    if (!resumeText) {
      setClError("No resume text available to generate a cover letter.");
      return;
    }

    setIsGeneratingCL(true);
    setClError(null);

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        setClError(data?.error || "Failed to generate cover letter.");
        return;
      }

      setCoverLetter(data.coverLetter || data.data || "");
    } catch (e) {
      console.error(e);
      setClError("Network error while generating cover letter.");
    } finally {
      setIsGeneratingCL(false);
    }
  }

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

    if (pdfTemplate === "classic") {
      return (
        <ClassicTemplate
          resumeText={resumeText}
          jobDescription={jobDescription}
          targetRole={targetRole}
          result={result}
        />
      );
    }

    if (pdfTemplate === "modern") {
      return (
        <ModernTemplate
          resumeText={resumeText}
          jobDescription={jobDescription}
          targetRole={targetRole}
          result={result}
        />
      );
    }

    if (pdfTemplate === "minimal") {
      return (
        <MinimalTemplate
          resumeText={resumeText}
          jobDescription={jobDescription}
          targetRole={targetRole}
          result={result}
        />
      );
    }

    return (
      <CreativeTemplate
        resumeText={resumeText}
        jobDescription={jobDescription}
        targetRole={targetRole}
        result={result}
      />
    );
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
                    onClick={() => {
                      navigator.clipboard.writeText(coverLetter);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={styles.btn}
                  >
                    {copied ? "Copied! ✓" : "Copy to Clipboard"}
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
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={styles.btn}
                  >
                    {copied ? "✓ Copied" : "Copy Questions"}
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

function Section({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
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

function TagList({
  tags,
  variant,
}: {
  tags: string[];
  variant: "success" | "warn";
}) {
  const colors =
    variant === "success"
      ? { bg: "rgba(16, 185, 129, 0.06)", color: "#10b981", border: "rgba(16, 185, 129, 0.15)" }
      : { bg: "rgba(245, 158, 11, 0.06)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.15)" };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-xs px-3.5 py-2 rounded-xl border font-medium leading-relaxed"
          style={{
            background: colors.bg,
            color: colors.color,
            borderColor: colors.border,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function Chip({
  label,
  variant,
}: {
  label: string;
  variant: "match" | "miss";
}) {
  const colors =
    variant === "match"
      ? { bg: "rgba(16, 185, 129, 0.06)", color: "#10b981", border: "rgba(16, 185, 129, 0.15)" }
      : { bg: "rgba(239, 68, 68, 0.06)", color: "#ef4444", border: "rgba(239, 68, 68, 0.15)" };

  return (
    <span
      className="text-xs font-mono font-medium px-3 py-1 rounded-lg border"
      style={{
        background: colors.bg,
        color: colors.color,
        borderColor: colors.border,
      }}
    >
      {label}
    </span>
  );
}

function RewriteSuggestionCard({
  s,
}: {
  s: AnalysisResult["suggestions"][number];
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(s.after);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card bg-paper-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
      <div
        className="px-4 py-2.5 bg-paper-warm/40 border-b flex justify-between items-center"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-wider">{s.section}</span>
        <span className="font-mono text-[9px] text-ink-faint uppercase">Suggested Rewrite</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div
          className="p-4 text-sm leading-relaxed border-r"
          style={{
            color: "#ef4444",
            background: "rgba(239, 68, 68, 0.02)",
            borderColor: "var(--border)",
            textDecoration: "line-through",
            textDecorationColor: "rgba(239, 68, 68, 0.2)",
          }}
        >
          {s.before}
        </div>
        <div
          className="p-4 text-sm leading-relaxed relative flex flex-col justify-between gap-4"
          style={{
            color: "#10b981",
            background: "rgba(16, 185, 129, 0.02)",
          }}
        >
          <div className="pr-8">{s.after}</div>
          <button
            onClick={handleCopy}
            className="self-end px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border flex items-center gap-1.5 transition-all duration-200"
            style={{
              background: copied ? "#10b981" : "var(--paper-card)",
              color: copied ? "white" : "var(--ink-muted)",
              borderColor: copied ? "#10b981" : "var(--border)",
            }}
          >
            {copied ? (
              <span>✓ Copied</span>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Rewrite</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function AtsBar({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  const clamped = Math.max(1, Math.min(100, value));
  const color =
    clamped >= 75 ? "#10b981" : clamped >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <div className="glass-card bg-paper-card border border-border rounded-2xl p-5 shadow-sm hover:scale-[1.01]">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-ink">
          {label}
        </span>
        <span
          className="font-display text-2xl font-bold leading-none"
          style={{ color }}
        >
          {clamped}
        </span>
      </div>
      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden mb-3.5">
        <div
          className="h-full rounded-full transition-all duration-[1.2s] cubic-bezier(0.16,1,0.3,1)"
          style={{
            width: `${clamped}%`,
            background: color,
          }}
        />
      </div>
      <div className="font-mono text-[9px] text-ink-faint tracking-wide leading-relaxed">
        {hint}
      </div>
    </div>
  );
}