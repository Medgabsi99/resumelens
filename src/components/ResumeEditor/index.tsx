"use client";
import { logger } from "@/lib/logger";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { RewriteSuggestion } from "@/types";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import TechProTemplate from "../resume-templates/TechProTemplate";
import ProfessionalTemplate from "../resume-templates/ProfessionalTemplate";
import ModernTemplate from "../resume-templates/ModernTemplate";
import CreativeTemplate from "../resume-templates/CreativeTemplate";
import MinimalTemplate from "../resume-templates/MinimalTemplate";
import ExecutiveTemplate from "../resume-templates/ExecutiveTemplate";
import { useResumeVersions } from "./useResumeVersions";
import { runAtsChecks } from "@/lib/atsRulesChecker";
import ToolbarButton from "./ToolbarButton";
import ScoreTrendChart from "./ScoreTrendChart";
import VersionDiffModal from "./VersionDiffModal";
import EditorHistorySidebar from "./EditorHistorySidebar";
import { TemplateId, ResumeVersion, ResumeCustomStyle } from "./types";
import { useSmartEnhance } from "./useSmartEnhance";
import { useSelectionOptimizer } from "./useSelectionOptimizer";
import { useDesignCustomizer } from "./useDesignCustomizer";
import {
  Palette,
  Download,
  Sparkles,
  RotateCcw,
  History,
  Check,
  Copy,
  AlertTriangle,
  FileText,
  Loader2,
  PenTool,
  Bot,
  Edit3,
  Trash,
  Plus,
  TrendingUp,
  Zap,
  X,
  Target,
} from "lucide-react";

interface Props {
  initialText: string;
  suggestions: RewriteSuggestion[];
  targetRole?: string;
  jobDescription?: string;
  resultScore: number;
  analysisId?: string;
}

const TEMPLATES: { id: TemplateId; label: string; ats?: boolean }[] = [
  { id: "tech-pro", label: "Tech Pro ✓", ats: true },
  { id: "professional", label: "Classic Pro", ats: true },
  { id: "modern", label: "Modern", ats: true },
  { id: "creative", label: "Creative", ats: true },
  { id: "minimal", label: "Minimal", ats: true },
  { id: "executive", label: "Executive", ats: false },
];

export default function ResumeEditor({
  initialText,
  suggestions,
  targetRole,
  jobDescription,
  resultScore,
  analysisId,
}: Props) {
  const [text, setText] = useState(initialText);

  // Bounded Ring Buffer Undo/Redo History Stack (Max 50 states)
  const MAX_HISTORY = 50;
  const [history, setHistory] = useState<string[]>([initialText]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateTextWithHistory = useCallback(
    (newText: string) => {
      setText(newText);
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        const updated = [...truncated, newText];
        if (updated.length > MAX_HISTORY) {
          return updated.slice(updated.length - MAX_HISTORY);
        }
        return updated;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setText(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setText(history[newIndex]);
    }
  }, [history, historyIndex]);

  const [copied, setCopied] = useState(false);
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("tech-pro");
  const [editorOpen, setEditorOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Version History States
  const [showHistory, setShowHistory] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [compareVersion, setCompareVersion] = useState<ResumeVersion | null>(null);

  // ATS Plain-Text Sandbox
  const [showAtsView, setShowAtsView] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  // Live ATS Score Recalculation (runs in real-time as user types)
  const liveAtsRules = useMemo(() => runAtsChecks(text, jobDescription), [text, jobDescription]);

  // ── Extracted hooks ──────────────────────────────────────
  const { showCustomizer, setShowCustomizer, customStyle, setCustomStyle } = useDesignCustomizer();

  // Page Budget & Height Measurement
  const [previewHeight, setPreviewHeight] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);

  useEffect(() => {
    if (!previewRef.current) return;
    const observer = new ResizeObserver(() => {
      if (previewRef.current) {
        setPreviewHeight(previewRef.current.offsetHeight);
      }
    });
    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [text, selectedTemplate, customStyle, editorOpen]);

  const pageStatus = useMemo(() => {
    const targetSinglePageHeight = 1080;
    const ratio = previewHeight / targetSinglePageHeight;
    const pageCount = Math.max(1, Math.round(ratio * 10) / 10);
    const isSpillover = previewHeight > targetSinglePageHeight + 40;
    const spilloverLines = Math.max(1, Math.ceil((previewHeight - targetSinglePageHeight) / 24));

    return {
      pageCount,
      isSpillover,
      spilloverText: `${spilloverLines} line${spilloverLines > 1 ? "s" : ""} spillover`,
    };
  }, [previewHeight]);

  const handleAutoFitToOnePage = () => {
    if (previewHeight <= 1080) return;
    // Calculate exact zoom needed to fit content into 1080px height
    const targetHeight = 1060; // small buffer below the cutoff line
    const zoom = targetHeight / previewHeight;
    // Clamp: don't zoom below 60% (too small to read) or above 1
    setPreviewZoom(Math.max(0.6, Math.min(1, zoom)));
  };

  const handleResetZoom = () => setPreviewZoom(1);

  const { isGenerating, handleSmartGenerate } = useSmartEnhance({
    text,
    targetRole,
    setText,
    setParsedData,
    setIsEnhanced,
    setSelectedTemplate,
    setSmartError,
  });

  const {
    bubbleCoords,
    showOptimizerBubble,
    isOptimizing,
    optimizedAlternatives,
    optimizeError,
    handleTextareaSelect,
    handleOptimizeBullet,
    handleApplyAlternative,
    closeOptimizer,
  } = useSelectionOptimizer({
    text,
    targetRole,
    jobDescription,
    setText,
    setParsedData,
    setIsEnhanced,
  });

  // ── Version History Hook ─────────────────────────────────
  const { versions, isLoadingVersions, isSavingVersion, versionError, saveVersion, deleteVersion } =
    useResumeVersions(analysisId, showHistory, text, resultScore);

  // ── Handlers ─────────────────────────────────────────────
  const handleSaveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisId || !newVersionName.trim()) return;
    try {
      await saveVersion(newVersionName.trim());
      setNewVersionName("");
    } catch (err: unknown) {
      // Error handled by hook state
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!analysisId) return;
    if (!confirm("Are you sure you want to delete this version snapshot?")) return;
    try {
      await deleteVersion(versionId);
      if (compareVersion?.id === versionId) setCompareVersion(null);
    } catch (err: unknown) {
      // Error handled by hook state
    }
  };

  const handleRestoreVersion = (version: ResumeVersion) => {
    if (
      !confirm(
        `Are you sure you want to restore "${version.version_name}"? This will overwrite your current draft.`
      )
    )
      return;
    setText(version.resume_text);
    setParsedData(null);
    setIsEnhanced(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && editorOpen) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text, editorOpen]);

  // Listen for tailored resume application events
  useEffect(() => {
    const handleApplyTailored = (e: Event) => {
      const customEvent = e as CustomEvent<{
        tailoredText: string;
        tailoredResume: ParsedResume;
        recommendedTemplate?: string;
      }>;
      if (customEvent.detail) {
        const { tailoredText, tailoredResume, recommendedTemplate } = customEvent.detail;
        if (tailoredText) setText(tailoredText);
        if (tailoredResume) setParsedData(tailoredResume);
        setIsEnhanced(true);
        setEditorOpen(true);
        setSmartError(null);

        // Auto-switch to recommended template if any
        if (recommendedTemplate) {
          const valid: TemplateId[] = [
            "tech-pro",
            "professional",
            "modern",
            "creative",
            "minimal",
            "executive",
          ];
          if (valid.includes(recommendedTemplate as TemplateId)) {
            setSelectedTemplate(recommendedTemplate as TemplateId);
          }
        }

        // Scroll the editor container into view smoothly
        setTimeout(() => {
          const editorElement = document.querySelector(".sbs-editor-grid");
          if (editorElement) {
            editorElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    };

    window.addEventListener("apply-tailored-resume", handleApplyTailored);
    return () => {
      window.removeEventListener("apply-tailored-resume", handleApplyTailored);
    };
  }, []);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const data = parsedData || parseResume(text);
      const { downloadResumePdf } = await import("@/lib/pdf/downloadPdf");
      await downloadResumePdf(selectedTemplate, data, targetRole, customStyle);
    } catch (err: unknown) {
      logger.error("PDF download error:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      const data = parsedData || parseResume(text);
      const { downloadResumeDocx } = await import("@/lib/docxExport");
      await downloadResumeDocx(data, targetRole);
    } catch (err: unknown) {
      logger.error("Docx download error:", err);
      alert("Failed to download Word document. Please try again.");
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const applySuggestion = useCallback((index: number, before: string, after: string) => {
    setText((prev) => {
      // 1. Try exact match
      const idx = prev.indexOf(before);
      if (idx !== -1) {
        setAppliedIndices((prevSet) => new Set(prevSet).add(index));
        return prev.slice(0, idx) + after + prev.slice(idx + before.length);
      }

      // 2. Try case-insensitive exact match
      const lower = prev.toLowerCase();
      const lowerBefore = before.toLowerCase();
      const ciIdx = lower.indexOf(lowerBefore);
      if (ciIdx !== -1) {
        setAppliedIndices((prevSet) => new Set(prevSet).add(index));
        return prev.slice(0, ciIdx) + after + prev.slice(ciIdx + before.length);
      }

      // 3. Robust case-insensitive and whitespace-insensitive match using regular expressions
      try {
        // Escape regular expression special characters in "before" text
        const escaped = before.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");

        // Replace any sequences of whitespace with a regex matcher that matches any layout changes (\s+)
        const cleanEscaped = escaped.trim().replace(/\s+/g, "\\s+");

        if (cleanEscaped.length > 3) {
          const regex = new RegExp(cleanEscaped, "i");
          const match = prev.match(regex);

          if (match && match.index !== undefined) {
            setAppliedIndices((prevSet) => new Set(prevSet).add(index));
            return prev.slice(0, match.index) + after + prev.slice(match.index + match[0].length);
          }
        }
      } catch (e) {
        logger.error("Suggestion match error:", e);
      }

      return prev;
    });
  }, []);

  const handleDownloadTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ResumeLens-Edited-Resume.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setText(initialText);
    setAppliedIndices(new Set());
    setParsedData(null);
    setIsEnhanced(false);
    setSmartError(null);
  };

  // Clear parsedData when user manually edits text (so preview re-parses)
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (parsedData) {
      setParsedData(null);
      setIsEnhanced(false);
    }
  };

  const hasEdits = text !== initialText;
  const appliedCount = appliedIndices.size;

  // Memoize the rendered template to avoid unnecessary re-renders during typing
  const TemplatePreview = useMemo(() => {
    const props = {
      resumeText: text,
      targetRole,
      parsedData: parsedData || undefined,
      customStyle,
    };
    switch (selectedTemplate) {
      case "tech-pro":
        return <TechProTemplate {...props} />;
      case "modern":
        return <ModernTemplate {...props} />;
      case "creative":
        return <CreativeTemplate {...props} />;
      case "minimal":
        return <MinimalTemplate {...props} />;
      case "executive":
        return <ExecutiveTemplate {...props} />;
      default:
        return <ProfessionalTemplate {...props} />;
    }
  }, [text, selectedTemplate, targetRole, parsedData, customStyle]);

  return (
    <div>
      {/* ── Toggle Button — premium CTA ── */}
      <button
        onClick={() => setEditorOpen(!editorOpen)}
        style={{
          background: editorOpen ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
          color: editorOpen ? "white" : "var(--accent)",
          border: `1.5px solid ${editorOpen ? "transparent" : "var(--accent-border)"}`,
          borderRadius: 10,
          padding: "10px 22px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "Instrument Sans, sans-serif",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          boxShadow: editorOpen ? "0 4px 15px rgba(99,102,241,0.35)" : "none",
          letterSpacing: "-0.01em",
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        {editorOpen ? "Close Editor" : "Open Side-by-Side Editor"}
        {hasEdits && !editorOpen && (
          <span
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: "#059669",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 700,
              marginLeft: 2,
              border: "1px solid rgba(16,185,129,0.25)",
            }}
          >
            {appliedCount} edit{appliedCount !== 1 ? "s" : ""}
          </span>
        )}
      </button>

      {/* Side-by-Side Editor */}
      {editorOpen && (
        <div className="sbs-editor-grid animate-fadeIn" style={{ marginTop: 16 }}>
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden bg-paper border-b border-border p-2 gap-2">
            <button
              type="button"
              onClick={() => setMobileTab("edit")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                mobileTab === "edit"
                  ? "bg-accent text-white shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-paper-warm"
              }`}
            >
              <PenTool size={13} />
              <span>Edit Draft</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                mobileTab === "preview"
                  ? "bg-accent text-white shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-paper-warm"
              }`}
            >
              <FileText size={13} />
              <span>View Preview</span>
            </button>
          </div>

          {/* ── Left Pane: Live Preview ── */}
          <div
            style={{
              borderRight: "1px solid var(--border)",
              flexDirection: "column",
              background: "var(--paper-warm)",
            }}
            className={`w-full flex-col ${mobileTab === "preview" ? "flex" : "hidden lg:flex"}`}
          >
            {/* ── Left Pane Header: template selector ── */}
            <div
              style={{
                background: "var(--paper-card)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {/* Label + AI badge row */}
              <div
                style={{
                  padding: "10px 14px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <FileText size={9} style={{ color: "var(--accent)" }} />
                  Live Preview
                </span>
                {isEnhanced && (
                  <span
                    style={{
                      background: "rgba(124,58,237,0.1)",
                      color: "#7c3aed",
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      border: "1px solid rgba(124,58,237,0.2)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      animation: "fadeIn 0.3s ease",
                    }}
                  >
                    <Sparkles size={9} />
                    <span>AI Enhanced</span>
                  </span>
                )}
              </div>
              {/* Template tabs strip */}
              <div
                style={{
                  padding: "0 12px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  overflowX: "auto",
                  overflowY: "hidden",
                  flexWrap: "nowrap",
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="sbs-template-tab"
                    data-active={selectedTemplate === t.id ? "true" : "false"}
                    onClick={() => setSelectedTemplate(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {/* ── Download & Style row ── */}
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 5,
                background: "var(--paper-card)",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setShowCustomizer(!showCustomizer)}
                style={{
                  background: showCustomizer ? "rgba(99,102,241,0.1)" : "transparent",
                  color: "var(--accent)",
                  border: `1.5px solid ${showCustomizer ? "rgba(99,102,241,0.4)" : "var(--accent-border)"}`,
                  borderRadius: 7,
                  padding: "0 10px",
                  height: 28,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Instrument Sans, sans-serif",
                  transition: "all 0.15s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                  boxShadow: showCustomizer ? "0 0 0 3px rgba(99,102,241,0.08)" : "none",
                }}
              >
                <Palette size={11} />
                <span>Style</span>
              </button>
              <span style={{ width: 1, height: 16, background: "var(--border)", flexShrink: 0 }} />
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                style={{
                  background: isDownloading
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: "white",
                  border: "none",
                  borderRadius: 7,
                  padding: "0 12px",
                  height: 28,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: isDownloading ? "wait" : "pointer",
                  fontFamily: "Instrument Sans, sans-serif",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 10px rgba(79,70,229,0.35)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  opacity: isDownloading ? 0.8 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {isDownloading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Download size={11} />
                )}
                <span>{isDownloading ? "Exporting..." : "PDF"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={isDownloadingDocx}
                style={{
                  background: "var(--paper-warm)",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "0 10px",
                  height: 28,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: isDownloadingDocx ? "wait" : "pointer",
                  fontFamily: "Instrument Sans, sans-serif",
                  transition: "all 0.15s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: isDownloadingDocx ? 0.7 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {isDownloadingDocx ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <FileText size={11} />
                )}
                <span>{isDownloadingDocx ? "Exporting..." : "Word"}</span>
              </button>
            </div>

            {/* ── Page Budget & Auto-Fit Bar ── */}
            <div
              style={{
                padding: "7px 14px",
                background: pageStatus.isSpillover
                  ? "rgba(245,158,11,0.04)"
                  : "rgba(16,185,129,0.03)",
                borderBottom: `1px solid ${pageStatus.isSpillover ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.12)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                flexShrink: 0,
                fontSize: 11,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {pageStatus.isSpillover ? (
                  <span
                    style={{
                      color: "#92400e",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                    }}
                  >
                    <AlertTriangle size={11} style={{ color: "#d97706" }} />
                    <span>
                      <strong style={{ fontWeight: 800 }}>
                        {pageStatus.pageCount.toFixed(1)} pages
                      </strong>
                      <span
                        style={{ color: "#92400e", fontWeight: 400, marginLeft: 4, fontSize: 10.5 }}
                      >
                        ({pageStatus.spilloverText} over)
                      </span>
                    </span>
                  </span>
                ) : (
                  <span
                    style={{
                      color: "#065f46",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                    }}
                  >
                    <Check size={11} style={{ color: "#10b981" }} />
                    <span>
                      <strong style={{ fontWeight: 800 }}>1 Page</strong>
                      <span
                        style={{ color: "#065f46", fontWeight: 400, marginLeft: 4, fontSize: 10.5 }}
                      >
                        fits perfectly
                      </span>
                    </span>
                  </span>
                )}
              </div>

              {pageStatus.isSpillover && (
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {previewZoom < 1 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      style={{
                        background: "transparent",
                        color: "var(--ink-muted)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "3px 8px",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontFamily: "Instrument Sans, sans-serif",
                      }}
                    >
                      <RotateCcw size={10} />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAutoFitToOnePage}
                    style={{
                      background:
                        previewZoom < 1
                          ? "linear-gradient(135deg, #059669, #10b981)"
                          : "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      boxShadow:
                        previewZoom < 1
                          ? "0 2px 6px rgba(5,150,105,0.3)"
                          : "0 2px 6px rgba(245,158,11,0.35)",
                      fontFamily: "Instrument Sans, sans-serif",
                    }}
                  >
                    <Zap size={10} />
                    <span>
                      {previewZoom < 1
                        ? `Zoomed ${Math.round(previewZoom * 100)}%`
                        : "Auto-Fit to 1 Page"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* ── Design Customizer Panel ── */}
            {showCustomizer && (
              <div
                style={{
                  background: "var(--paper-card)",
                  borderBottom: "1px solid var(--border)",
                  padding: "14px 16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 12,
                  animation: "fadeIn 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--ink-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    Font
                  </label>
                  <select
                    value={customStyle.fontFamily}
                    onChange={(e) =>
                      setCustomStyle((prev) => ({
                        ...prev,
                        fontFamily: e.target.value as ResumeCustomStyle["fontFamily"],
                      }))
                    }
                    style={{
                      width: "100%",
                      background: "var(--paper-warm)",
                      border: "1px solid var(--border)",
                      borderRadius: 7,
                      padding: "5px 8px",
                      fontSize: 11,
                      color: "var(--ink)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="serif">Serif (Classic)</option>
                    <option value="sans">Sans (Modern)</option>
                    <option value="mono">Mono (Clean)</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--ink-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    Size
                  </label>
                  <select
                    value={customStyle.fontSize}
                    onChange={(e) =>
                      setCustomStyle((prev) => ({
                        ...prev,
                        fontSize: e.target.value as ResumeCustomStyle["fontSize"],
                      }))
                    }
                    style={{
                      width: "100%",
                      background: "var(--paper-warm)",
                      border: "1px solid var(--border)",
                      borderRadius: 7,
                      padding: "5px 8px",
                      fontSize: 11,
                      color: "var(--ink)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="10pt">10pt · Compact</option>
                    <option value="10.5pt">10.5pt · Medium</option>
                    <option value="11pt">11pt · Normal</option>
                    <option value="12pt">12pt · Large</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--ink-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    Spacing
                  </label>
                  <select
                    value={customStyle.lineHeight}
                    onChange={(e) =>
                      setCustomStyle((prev) => ({
                        ...prev,
                        lineHeight: e.target.value as ResumeCustomStyle["lineHeight"],
                      }))
                    }
                    style={{
                      width: "100%",
                      background: "var(--paper-warm)",
                      border: "1px solid var(--border)",
                      borderRadius: 7,
                      padding: "5px 8px",
                      fontSize: 11,
                      color: "var(--ink)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="1.4">1.4 · Compact</option>
                    <option value="1.5">1.5 · Default</option>
                    <option value="1.6">1.6 · Relaxed</option>
                    <option value="1.7">1.7 · Spacious</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--ink-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    Margins
                  </label>
                  <select
                    value={customStyle.padding}
                    onChange={(e) =>
                      setCustomStyle((prev) => ({
                        ...prev,
                        padding: e.target.value as ResumeCustomStyle["padding"],
                      }))
                    }
                    style={{
                      width: "100%",
                      background: "var(--paper-warm)",
                      border: "1px solid var(--border)",
                      borderRadius: 7,
                      padding: "5px 8px",
                      fontSize: 11,
                      color: "var(--ink)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="36px 32px">Tight</option>
                    <option value="56px 48px">Normal</option>
                    <option value="76px 64px">Wide</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--ink-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Theme
                  </label>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                    {[
                      { hex: "#1e3a8a", label: "Navy" },
                      { hex: "#4f46e5", label: "Indigo" },
                      { hex: "#10b981", label: "Emerald" },
                      { hex: "#374151", label: "Charcoal" },
                      { hex: "#8b5cf6", label: "Purple" },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() =>
                          setCustomStyle((prev) => ({ ...prev, primaryColor: col.hex }))
                        }
                        title={col.label}
                        aria-label={`Select ${col.label} theme`}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: col.hex,
                          border:
                            customStyle.primaryColor === col.hex
                              ? "2.5px solid #fff"
                              : "1.5px solid rgba(0,0,0,0.12)",
                          cursor: "pointer",
                          transition: "transform 0.15s, box-shadow 0.15s",
                          transform:
                            customStyle.primaryColor === col.hex ? "scale(1.25)" : "scale(1)",
                          boxShadow:
                            customStyle.primaryColor === col.hex
                              ? `0 0 0 2.5px ${col.hex}`
                              : "none",
                          outline: "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Scaled Preview Container ── */}
            <div
              className="sbs-preview-viewport"
              style={{
                flex: 1,
                overflow: "auto",
                padding: 16,
                position: "relative",
                background: "#eef2f7",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(0,0,0,0.12) transparent",
              }}
            >
              <div ref={previewRef} style={{ position: "relative" }}>
                <div
                  className="sbs-preview-scale"
                  style={{
                    fontSize: customStyle.fontSize,
                    lineHeight: customStyle.lineHeight,
                    zoom: previewZoom,
                    transition: "zoom 0.3s ease",
                    borderRadius: 2,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                  }}
                >
                  {TemplatePreview}
                </div>
                {/* Page 1 Cutoff Line */}
                {previewHeight > 1080 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 1080 * previewZoom,
                      left: 0,
                      right: 0,
                      borderTop: "2px dashed rgba(239,68,68,0.7)",
                      zIndex: 20,
                      pointerEvents: "none",
                      display: "flex",
                      justifyContent: "flex-end",
                      paddingRight: 8,
                    }}
                  >
                    <span
                      style={{
                        background: "#ef4444",
                        color: "white",
                        fontSize: 8.5,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "0 0 5px 5px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontFamily: "DM Mono, monospace",
                        boxShadow: "0 2px 6px rgba(239,68,68,0.3)",
                      }}
                    >
                      Page 1 End
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Pane: Editor ── */}
          <div
            style={{
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
            }}
            className={`w-full flex-col ${mobileTab === "edit" ? "flex" : "hidden lg:flex"}`}
          >
            {/* ═══ Toolbar — 2 Rows, Always Fully Visible ═══ */}
            <div
              style={{
                flexShrink: 0,
                background: "var(--accent-bg)",
                borderBottom: "1px solid var(--accent-border)",
              }}
            >
              {/* Row 1: Status badges + Smart Generate CTA */}
              <div
                style={{
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  height: 42,
                  borderBottom: "1px solid var(--accent-border)",
                }}
              >
                {/* Left: status info */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "DM Mono, monospace",
                      color: "var(--ink-muted)",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <PenTool size={11} className="text-accent" />
                    <span>Editor</span>
                  </span>

                  <span
                    style={{
                      width: 1,
                      height: 14,
                      background: "var(--accent-border)",
                      flexShrink: 0,
                    }}
                  />

                  {/* ATS Score pill */}
                  <div
                    title="Real-time ATS Score"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "0 8px",
                      height: 22,
                      borderRadius: 11,
                      fontSize: 10,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background:
                        liveAtsRules.deterministicScore >= 80
                          ? "#dcfce7"
                          : liveAtsRules.deterministicScore >= 60
                            ? "#fef9c3"
                            : "#fee2e2",
                      color:
                        liveAtsRules.deterministicScore >= 80
                          ? "#15803d"
                          : liveAtsRules.deterministicScore >= 60
                            ? "#92400e"
                            : "#991b1b",
                      border: `1px solid ${liveAtsRules.deterministicScore >= 80 ? "#86efac" : liveAtsRules.deterministicScore >= 60 ? "#fde68a" : "#fca5a5"}`,
                    }}
                  >
                    <Zap size={10} />
                    <span>ATS {liveAtsRules.deterministicScore}/100</span>
                  </div>

                  {appliedCount > 0 && (
                    <span
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        color: "#059669",
                        padding: "0 7px",
                        height: 20,
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                        border: "1px solid rgba(16,185,129,0.25)",
                      }}
                    >
                      ✓ {appliedCount} applied
                    </span>
                  )}
                </div>

                {/* Right: Smart Generate — always pinned right */}
                <button
                  type="button"
                  onClick={handleSmartGenerate}
                  disabled={isGenerating || !text.trim()}
                  style={{
                    background: isGenerating
                      ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                      : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                    color: "white",
                    border: "none",
                    borderRadius: 7,
                    padding: "0 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: isGenerating ? "wait" : "pointer",
                    fontFamily: "Instrument Sans, sans-serif",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 10px rgba(99,102,241,0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    opacity: isGenerating || !text.trim() ? 0.7 : 1,
                    whiteSpace: "nowrap",
                    height: 30,
                    flexShrink: 0,
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span>Smart Generate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Row 2: Secondary action buttons — all always visible */}
              <div
                style={{
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  height: 34,
                }}
              >
                <ToolbarButton
                  onClick={handleReset}
                  disabled={!hasEdits && !isEnhanced}
                  label={
                    <span className="flex items-center gap-1">
                      <RotateCcw size={10} />
                      <span>Reset</span>
                    </span>
                  }
                  variant="danger"
                  active={hasEdits || isEnhanced}
                />
                {analysisId && (
                  <ToolbarButton
                    onClick={() => setShowHistory((prev) => !prev)}
                    label={
                      <span className="flex items-center gap-1">
                        <History size={10} />
                        <span>{showHistory ? "Hide History" : "History"}</span>
                      </span>
                    }
                    variant={showHistory ? "primary" : "default"}
                  />
                )}
                <ToolbarButton
                  onClick={handleCopyAll}
                  label={
                    <span className="flex items-center gap-1">
                      {copied ? (
                        <Check size={10} className="text-emerald-500" />
                      ) : (
                        <Copy size={10} />
                      )}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </span>
                  }
                  variant="default"
                />
                <ToolbarButton
                  onClick={handleDownloadTxt}
                  label={
                    <span className="flex items-center gap-1">
                      <Download size={10} />
                      <span>.txt</span>
                    </span>
                  }
                  variant="primary"
                />
                <ToolbarButton
                  onClick={() => setShowAtsView((v) => !v)}
                  label={
                    <span className="flex items-center gap-1">
                      {showAtsView ? <PenTool size={10} /> : <Bot size={10} />}
                      <span>{showAtsView ? "Edit Mode" : "ATS View"}</span>
                    </span>
                  }
                  variant={showAtsView ? "primary" : "default"}
                />
              </div>
            </div>

            {/* Smart Error banner */}
            {smartError && (
              <div
                style={{
                  color: "#dc2626",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "6px 14px",
                  background: "rgba(220, 38, 38, 0.05)",
                  borderBottom: "1px solid rgba(220, 38, 38, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={12} />
                <span>{smartError}</span>
              </div>
            )}

            {/* Editor content area — fills all remaining height */}
            <div
              style={{
                display: "flex",
                flex: 1,
                minHeight: 0,
                position: "relative",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* ATS Plain-Text Sandbox */}
              {showAtsView ? (
                <div
                  style={{
                    flex: 1,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    background: "#0d1117",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#161b22",
                      borderBottom: "1px solid #30363d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#21262d",
                          border: "1px solid #30363d",
                          borderRadius: 6,
                          padding: "3px 10px",
                          fontSize: 10,
                          fontFamily: "DM Mono, monospace",
                          color: "#58a6ff",
                          fontWeight: 700,
                        }}
                      >
                        <Bot size={11} />
                        <span>ATS Parser Simulation</span>
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: "#8b949e",
                          fontFamily: "DM Mono, monospace",
                        }}
                      >
                        This is what machines see — no formatting, no icons
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span
                        style={{
                          background: "#1f6feb",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 9.5,
                          fontWeight: 700,
                          fontFamily: "DM Mono, monospace",
                        }}
                      >
                        {text.split(/\s+/).filter(Boolean).length} words
                      </span>
                      <span
                        style={{
                          background: text.length > 10000 ? "#da3633" : "#238636",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 9.5,
                          fontWeight: 700,
                          fontFamily: "DM Mono, monospace",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {text.length > 10000 ? (
                          <>
                            <AlertTriangle size={11} />
                            <span>Too Long</span>
                          </>
                        ) : (
                          <>
                            <Check size={11} />
                            <span>Char Count OK</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* The actual ATS-rendered text */}
                  <pre
                    style={{
                      margin: 0,
                      padding: "16px 20px",
                      fontFamily: "DM Mono, Courier New, monospace",
                      fontSize: 11.5,
                      color: "#c9d1d9",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      flex: 1,
                      overflow: "auto",
                    }}
                  >
                    {/* Strip markdown/emoji/special chars to simulate ATS */}
                    {text
                      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "[emoji]")
                      .replace(/[*_~`#>]/g, "")
                      .replace(/\|/g, " ")
                      .replace(/(-{3,}|={3,})/g, "---")
                      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
                      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
                      .replace(/\s{3,}/g, "  ")
                      .trim()}
                  </pre>

                  {/* Checklist */}
                  <div
                    style={{
                      borderTop: "1px solid #30363d",
                      background: "#161b22",
                      padding: "10px 16px",
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      flexShrink: 0,
                    }}
                  >
                    {[
                      { check: !/[*_~`]/.test(text), label: "No Markdown" },
                      { check: !/[\u{1F300}-\u{1FAFF}]/u.test(text), label: "No Emoji" },
                      { check: !/\|/.test(text), label: "No Tables" },
                      {
                        check: text.split("\n").some((l) => /^[A-Z][A-Z ]{3,}$/.test(l.trim())),
                        label: "Clear Sections",
                      },
                      { check: /\d/.test(text), label: "Has Metrics" },
                    ].map((item) => (
                      <span
                        key={item.label}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 10,
                          fontFamily: "DM Mono, monospace",
                          color: item.check ? "#3fb950" : "#f85149",
                          background: item.check ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)",
                          border: `1px solid ${item.check ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)"}`,
                          padding: "3px 9px",
                          borderRadius: 20,
                          fontWeight: 700,
                        }}
                      >
                        {item.check ? <Check size={10} /> : <X size={10} />}
                        <span>{item.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                /* Normal textarea — fills all available height with scroll */
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  onSelect={handleTextareaSelect}
                  className="sbs-editor-textarea"
                  style={{ flex: 1, minHeight: 0, height: "100%" }}
                  spellCheck={false}
                  placeholder="Start typing your resume here..."
                />
              )}

              {/* Floating selection optimizer bubble */}
              {showOptimizerBubble && bubbleCoords && (
                <div
                  style={{
                    position: "absolute",
                    top: bubbleCoords.top,
                    right: 16,
                    width: "280px",
                    background: "var(--paper-card)",
                    border: "1px solid var(--accent-border)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                    padding: "12px",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "DM Mono, monospace",
                        color: "var(--accent)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Sparkles size={11} />
                      <span>Bullet Optimizer</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => closeOptimizer()}
                      aria-label="Close optimizer panel"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--ink-faint)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {!isOptimizing && !optimizedAlternatives && (
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--ink-muted)",
                          margin: "0 0 8px 0",
                          lineHeight: 1.4,
                        }}
                      >
                        Highlight text and click to optimize phrasing with targeted keywords or
                        metrics.
                      </p>
                      <button
                        type="button"
                        onClick={handleOptimizeBullet}
                        style={{
                          width: "100%",
                          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <span>Optimize Selected Text</span>
                        <Sparkles size={12} />
                      </button>
                    </div>
                  )}

                  {isOptimizing && (
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                      <Loader2 size={16} className="animate-spin text-accent mx-auto" />
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ink-muted)",
                          marginTop: 6,
                          fontWeight: 500,
                        }}
                      >
                        Hiring Manager is drafting alternatives...
                      </div>
                    </div>
                  )}

                  {optimizeError && (
                    <div
                      style={{
                        color: "#dc2626",
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "4px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <AlertTriangle size={12} />
                      <span>{optimizeError}</span>
                    </div>
                  )}

                  {optimizedAlternatives && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        maxHeight: "240px",
                        overflowY: "auto",
                        paddingRight: 4,
                      }}
                    >
                      {[
                        {
                          key: "metricDriven",
                          label: "Metric-Driven",
                          icon: <TrendingUp size={11} />,
                          text: optimizedAlternatives.metricDriven,
                        },
                        {
                          key: "actionFocused",
                          label: "Action-Focused",
                          icon: <Zap size={11} />,
                          text: optimizedAlternatives.actionFocused,
                        },
                        {
                          key: "skillsTargeted",
                          label: "Skills-Targeted",
                          icon: <Target size={11} />,
                          text: optimizedAlternatives.skillsTargeted,
                        },
                      ].map((alt) => (
                        <div
                          key={alt.key}
                          onClick={() => handleApplyAlternative(alt.text)}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: 8,
                            background: "var(--paper-warm)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          className="hover:border-accent hover:bg-accent-bg"
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--accent)",
                              marginBottom: 4,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {alt.icon}
                            <span>{alt.label}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink)", lineHeight: 1.4 }}>
                            {alt.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* History Sidebar */}
              {showHistory && analysisId && (
                <EditorHistorySidebar
                  versions={versions}
                  isLoadingVersions={isLoadingVersions}
                  isSavingVersion={isSavingVersion}
                  versionError={versionError}
                  newVersionName={newVersionName}
                  setNewVersionName={setNewVersionName}
                  handleSaveVersion={handleSaveVersion}
                  setShowHistory={setShowHistory}
                  compareVersion={compareVersion}
                  setCompareVersion={setCompareVersion}
                  handleRestoreVersion={handleRestoreVersion}
                  handleDeleteVersion={handleDeleteVersion}
                />
              )}
            </div>

            {/* One-click Rewrite Suggestions — horizontally scrollable strip */}
            {suggestions.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  background: "var(--paper-warm)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    padding: "8px 14px 4px",
                    fontSize: 9.5,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--ink-faint)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Zap size={9} style={{ color: "var(--accent)" }} />
                  One-Click Rewrites
                  <span
                    style={{
                      background: "var(--accent-bg)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-border)",
                      borderRadius: 8,
                      padding: "1px 6px",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {suggestions.length - appliedCount} pending
                  </span>
                </div>
                {/* Horizontally scrollable pill strip */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    padding: "6px 14px 10px",
                    overflowX: "auto",
                    overflowY: "hidden",
                    flexWrap: "nowrap",
                    scrollbarWidth: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {suggestions.map((s, i) => {
                    const applied = appliedIndices.has(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        className="sbs-rewrite-pill"
                        data-applied={applied ? "true" : "false"}
                        onClick={() => {
                          if (!applied) applySuggestion(i, s.before, s.after);
                        }}
                        disabled={applied}
                        title={`Replace "${s.before.slice(0, 60)}…" with "${s.after.slice(0, 60)}…"`}
                      >
                        <span className="flex items-center gap-1">
                          {applied ? <Check size={10} /> : <Sparkles size={10} />}
                          <span>{applied ? "Applied" : `Apply: ${s.section}`}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {compareVersion && (
        <VersionDiffModal
          version={compareVersion}
          currentText={text}
          onClose={() => setCompareVersion(null)}
          onRestore={() => {
            setText(compareVersion.resume_text);
            setParsedData(null);
            setIsEnhanced(false);
          }}
        />
      )}
    </div>
  );
}
