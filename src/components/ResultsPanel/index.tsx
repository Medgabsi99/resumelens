"use client";

import { useEffect, useRef, useState } from "react";
import { AnalysisResult } from "@/types";
import { parseResume } from "@/lib/parseResume";
import ClassicTemplate from "@/components/pdf-templates/ClassicTemplate";
import ModernTemplate from "@/components/pdf-templates/ModernTemplate";
import MinimalTemplate from "@/components/pdf-templates/MinimalTemplate";
import CreativeTemplate from "@/components/pdf-templates/CreativeTemplate";
import ExecutiveTemplate from "@/components/pdf-templates/ExecutiveTemplate";
import ResumeEditor from "@/components/ResumeEditor";
import ResumeTemplateSelector from "@/components/ResumeTemplateSelector";
import SaveResumeModal from "@/components/SaveResumeModal";
import JobMatchPanel from "@/components/JobMatchPanel";
import MockInterviewBoard from "@/components/MockInterviewBoard";
import PersonalPortfolioGenerator from "@/components/PersonalPortfolioGenerator";
import styles from "../ResultsPanel.module.css";
import { useToast } from "../ToastProvider";

// Extracted Subcomponents
import Section from "./Section";
import TagList from "./TagList";
import Chip from "./Chip";
import AtsBar from "./AtsBar";
import RewriteSuggestionCard from "./RewriteSuggestionCard";
import BulletRewriterCard from "./BulletRewriterCard";
import ScoreRing from "@/components/ScoreRing";
import StreamingText from "@/components/StreamingText";

// Extracted Custom Hooks
import { useCoverLetter } from "./useCoverLetter";
import { useInterviewPrep } from "./useInterviewPrep";
import { useResumeChat } from "./useResumeChat";
import { useOutreach } from "./useOutreach";

interface Props {
  result: AnalysisResult;
  hasJD: boolean;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  analysisId?: string;
}

type PdfTemplate = "results" | "classic" | "modern" | "minimal" | "creative" | "executive";

export default function ResultsPanel({
  result,
  hasJD,
  resumeText,
  jobDescription,
  targetRole,
  analysisId,
}: Props) {
  const componentRef = useRef<HTMLDivElement>(null);
  const pdfPrintRef = useRef<HTMLDivElement>(null);
  const clRef = useRef<HTMLDivElement>(null);

  // State Management
  const [pdfTemplate, setPdfTemplate] = useState<PdfTemplate>("results");
  const [barWidth, setBarWidth] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

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

  const {
    outreachMessage,
    setOutreachMessage,
    isGenerating: isGeneratingOutreach,
    error: outreachError,
    copied: outreachCopied,
    recruiterName,
    setRecruiterName,
    companyName,
    setCompanyName,
    outreachType,
    setOutreachType,
    handleGenerateOutreach,
    handleCopyOutreach,
  } = useOutreach(resumeText, jobDescription, targetRole);

  // Set default company name if empty on load
  useEffect(() => {
    if (companyName === "") {
      setCompanyName("Target Company");
    }
  }, [companyName, setCompanyName]);

  // Score Bar Animation (kept for the small header ring fallback)
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(result.score), 200);
    return () => clearTimeout(t);
  }, [result.score]);

  const scoreColor =
    result.score >= 85
      ? "#10b981"
      : result.score >= 70
      ? "#6366f1"
      : result.score >= 55
      ? "#f59e0b"
      : "#ef4444";

  const radius = 22;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (barWidth / 100) * circumference;

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const { downloadReviewPdf } = await import("@/lib/pdf/downloadPdf");
      await downloadReviewPdf(pdfTemplate, result, targetRole, jobDescription);
      
      toastSuccess("PDF generated successfully.", "Download complete");
    } catch (err: any) {
      console.error("PDF export error:", err);
      toastError(err.message || "Failed to download PDF.", "Download error");
    } finally {
      setIsDownloading(false);
    }
  };

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
      case "executive":
        return <ExecutiveTemplate {...templateProps} />;
      default:
        return <CreativeTemplate {...templateProps} />;
    }
  };

  const handleDownloadCoverLetter = () => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover-Letter-${(targetRole || "Resume").replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={componentRef} className={`${styles.container} fade-up`}>
      {resumeText && resumeText.length > 16000 && (
        <div style={{ margin: "16px 30px 0", padding: "12px 16px", borderRadius: 10, border: "1px solid #f59e0b", background: "#fffbeb", color: "#b45309", fontSize: "12.5px" }} className="print:hidden">
          ⚠️ <strong>Note:</strong> Your resume text was shortened for analysis. Some older experience might not be fully evaluated.
        </div>
      )}

      {result.ats_breakdown && result.ats_breakdown.impact < 70 && (
        <div style={{ margin: "16px 30px 0", padding: "16px", borderRadius: 12, border: "1px solid #c084fc", background: "#faf5ff", color: "#581c87", display: "flex", flexDirection: "column", gap: 10 }} className="print:hidden">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: "bold", fontSize: "13px" }}>
            <span>⚡</span> Critical Priority: Add Quantified Achievements
          </div>
          <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
            Your impact score is low ({result.ats_breakdown.impact}/100) due to weak action verbs or missing metrics. Recruiters expect numbers (revenue, users, speedups). Use the <strong>AI Bullet Rewriter</strong> in the <strong>Areas to Improve</strong> section below to optimize your bullets before exporting.
          </p>
          <div>
            <button
              onClick={() => {
                const el = document.getElementById("areas-to-improve-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              style={{ padding: "6px 12px", background: "#8b5cf6", border: "none", color: "white", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              Start Rewriting ➔
            </button>
          </div>
        </div>
      )}

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
              <option value="executive">Executive Template</option>
            </select>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className={`${styles.btnPrimary} print:hidden`}
            >
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className={styles.sectionHeader} style={{ marginBottom: 2 }}>Overall Score</div>
            <div className="text-[11px] text-ink-muted font-medium">ATS Match Level</div>
          </div>
          {/* Compact ring in the header */}
          <ScoreRing score={result.score} size={72} showGrade={false} showLabel={false} />
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
          {/* ── Hero Score Ring ──────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "8px 0 28px",
              gap: 16,
            }}
          >
            <ScoreRing score={result.score} size={220} />

            {/* Thin divider below ring */}
            <div
              style={{
                width: "100%",
                height: 1,
                background: "linear-gradient(90deg, transparent, var(--border), transparent)",
              }}
            />
          </div>

          {/* Assessment text */}
          <div className={styles.assessment}>{result.summary}</div>
        </Section>

        <div className={styles.gridTwo}>
          <Section title="Strengths" delay={2}>
            <TagList tags={result.strengths} variant="success" />
          </Section>
          <div id="areas-to-improve-section" style={{ flex: 1 }}>
            <Section title="Areas to Improve" delay={2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.weaknesses.map((w, i) => (
                  <BulletRewriterCard
                    key={i}
                    bullet={w}
                    resumeContext={resumeText}
                    targetRole={targetRole}
                  />
                ))}
              </div>
            </Section>
          </div>
        </div>

        {hasJD && result.keywords_matched && (
          <Section title="Keyword Analysis" delay={3}>
            {result.ats_breakdown && result.ats_breakdown.keywords < 70 && result.keywords_missing && result.keywords_missing.length > 0 && (
              <div style={{ padding: "12px", border: "1px solid #fca5a5", background: "#fef2f2", borderRadius: "8px", color: "#991b1b", fontSize: "12px", marginBottom: "12px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>⚠️ Low Keyword Match Rate ({result.ats_breakdown.keywords}%)</div>
                <div>Your resume is missing critical keywords. To optimize ATS parsing, weave these terms into your <strong>Summary</strong> or <strong>Skills</strong> sections:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  {result.keywords_missing.slice(0, 6).map((kw) => (
                    <span key={kw} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "bold" }}>{kw}</span>
                  ))}
                </div>
              </div>
            )}
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
                  <button onClick={handleDownloadCoverLetter} className={styles.btnPrimary}>
                    ↓ Download Cover Letter (.txt)
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

        <div className="print:hidden">
          <Section title="Outreach Message Generator" delay={5.5}>
            {!outreachMessage ? (
              <div className={styles.coverCenter}>
                <p className="text-sm text-ink-muted max-w-lg leading-relaxed mb-4">
                  Need a cold outreach message? Generate a highly personalized email or LinkedIn note matching your resume against the job description.
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
                  disabled={isGeneratingOutreach}
                  className={styles.coverBtn}
                >
                  {isGeneratingOutreach ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-pulse">Generating Outreach Note...</span>
                    </span>
                  ) : (
                    "Generate Outreach Note 🚀"
                  )}
                </button>
                {outreachError && (
                  <div className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold">
                    {outreachError}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className={styles.coverGeneratedActions}>
                  <button
                    onClick={handleCopyOutreach}
                    className={styles.btn}
                  >
                    {outreachCopied ? "Copied! ✓" : "Copy to Clipboard"}
                  </button>
                  <button
                    onClick={() => setOutreachMessage(null)}
                    className={styles.btnPrimary}
                  >
                    ✏️ Edit Options / Generate New
                  </button>
                </div>
                <div className={styles.coverBox} style={{ whiteSpace: "pre-wrap" }}>
                  {outreachMessage}
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
                      toastSuccess("Interview questions copied");
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
                  <StreamingText
                    text={interviewQuestions || ""}
                    isStreaming={isGeneratingIQ}
                    style={{ whiteSpace: "normal" }}
                  />
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
                  chatHistory.map((msg, i) => {
                    const isLastAI =
                      msg.role === "ai" && i === chatHistory.length - 1;
                    const stillStreaming = isLastAI && isChatting;
                    return (
                      <div
                        key={i}
                        className={msg.role === "user" ? styles.userBubble : styles.aiBubble}
                      >
                        {msg.role === "ai" ? (
                          <StreamingText
                            text={msg.text}
                            isStreaming={stillStreaming}
                            style={{ fontSize: "13.5px", lineHeight: "1.6" }}
                          />
                        ) : (
                          msg.text
                        )}
                      </div>
                    );
                  })
                )}
                {/* Show typing dots only while waiting for the FIRST token */}
                {isChatting && chatHistory[chatHistory.length - 1]?.role !== "ai" && (
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

      {/* Removed old print container */}
      {showSaveModal && resumeText && (
        <SaveResumeModal
          resumeText={resumeText}
          currentScore={result.score}
          targetRole={targetRole}
          jobDescription={jobDescription}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {
            setShowSaveModal(false);
            toastSuccess("Resume saved to library", "Saved!");
          }}
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
