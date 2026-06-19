"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { RewriteSuggestion } from "@/types";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import ProfessionalTemplate from "../resume-templates/ProfessionalTemplate";
import ModernTemplate from "../resume-templates/ModernTemplate";
import CreativeTemplate from "../resume-templates/CreativeTemplate";
import MinimalTemplate from "../resume-templates/MinimalTemplate";
import ExecutiveTemplate from "../resume-templates/ExecutiveTemplate";
import { useResumeVersions } from "./useResumeVersions";
import ToolbarButton from "./ToolbarButton";
import ScoreTrendChart from "./ScoreTrendChart";
import VersionDiffModal from "./VersionDiffModal";
import { TemplateId, ResumeVersion } from "./types";

interface Props {
  initialText: string;
  suggestions: RewriteSuggestion[];
  targetRole?: string;
  resultScore: number;
  analysisId?: string;
}

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "modern", label: "Modern" },
  { id: "creative", label: "Creative" },
  { id: "minimal", label: "Minimal" },
  { id: "executive", label: "Executive" },
];

export default function ResumeEditor({
  initialText,
  suggestions,
  targetRole,
  resultScore,
  analysisId,
}: Props) {
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("professional");
  const [editorOpen, setEditorOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Version History States
  const [showHistory, setShowHistory] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [compareVersion, setCompareVersion] = useState<ResumeVersion | null>(null);

  // Version History Hook
  const {
    versions,
    isLoadingVersions,
    isSavingVersion,
    versionError,
    setVersionError,
    saveVersion,
    deleteVersion,
  } = useResumeVersions(analysisId, showHistory, text, resultScore);

  const handleSaveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisId || !newVersionName.trim()) return;
    try {
      await saveVersion(newVersionName.trim());
      setNewVersionName("");
    } catch (err: any) {
      // Error handled by hook state, but we can log it
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!analysisId) return;
    if (!confirm("Are you sure you want to delete this version snapshot?")) return;
    try {
      await deleteVersion(versionId);
      if (compareVersion?.id === versionId) {
        setCompareVersion(null);
      }
    } catch (err: any) {
      // Error handled by hook state
    }
  };

  const handleRestoreVersion = (version: ResumeVersion) => {
    if (!confirm(`Are you sure you want to restore "${version.version_name}"? This will overwrite your current draft.`)) return;
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
          const valid: TemplateId[] = ["professional", "modern", "creative", "minimal", "executive"];
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

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const data = parsedData || parseResume(text);
      const { downloadResumePdf } = await import("@/lib/pdf/downloadPdf");
      await downloadResumePdf(selectedTemplate, data, targetRole);
    } catch (err: any) {
      console.error("PDF download error:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const applySuggestion = useCallback(
    (index: number, before: string, after: string) => {
      setText((prev) => {
        const idx = prev.indexOf(before);
        if (idx !== -1) {
          setAppliedIndices((prevSet) => new Set(prevSet).add(index));
          return prev.slice(0, idx) + after + prev.slice(idx + before.length);
        }
        // case-insensitive fallback
        const lower = prev.toLowerCase();
        const lowerBefore = before.toLowerCase();
        const ciIdx = lower.indexOf(lowerBefore);
        if (ciIdx !== -1) {
          setAppliedIndices((prevSet) => new Set(prevSet).add(index));
          return prev.slice(0, ciIdx) + after + prev.slice(ciIdx + before.length);
        }
        return prev;
      });
    },
    []
  );

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

  const handleSmartGenerate = async () => {
    setIsGenerating(true);
    setSmartError(null);
    try {
      const res = await fetch("/api/smart-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text, targetRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");

      setParsedData(data.parsedResume);
      setIsEnhanced(true);

      // Update text in the editor with the enhanced plain-text version
      if (data.enhancedText) setText(data.enhancedText);

      // Auto-switch to recommended template
      if (data.recommendedTemplate) {
        const valid: TemplateId[] = ["professional", "modern", "creative", "minimal", "executive"];
        if (valid.includes(data.recommendedTemplate as TemplateId)) {
          setSelectedTemplate(data.recommendedTemplate as TemplateId);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Smart generation failed";
      setSmartError(msg);
    } finally {
      setIsGenerating(false);
    }
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
    const props = { resumeText: text, targetRole, parsedData: parsedData || undefined };
    switch (selectedTemplate) {
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
  }, [text, selectedTemplate, targetRole, parsedData]);

  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={() => setEditorOpen(!editorOpen)}
        style={{
          background: editorOpen ? "var(--accent)" : "transparent",
          color: editorOpen ? "white" : "var(--accent)",
          border: `1.5px solid ${editorOpen ? "var(--accent)" : "var(--accent-border)"}`,
          borderRadius: 10,
          padding: "10px 20px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "Instrument Sans, sans-serif",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        {editorOpen ? "Close Editor" : "✏️ Open Side-by-Side Editor"}
        {hasEdits && !editorOpen && (
          <span style={{
            background: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 700,
            marginLeft: 4,
          }}>
            {appliedCount} edit{appliedCount !== 1 ? "s" : ""}
          </span>
        )}
      </button>

      {/* Side-by-Side Editor */}
      {editorOpen && (
        <div className="sbs-editor-grid animate-fadeIn" style={{ marginTop: 16 }}>
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden flex border-b border-border bg-paper-card p-2 gap-2 w-full col-span-2">
            <button
              type="button"
              onClick={() => setMobileTab("edit")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                mobileTab === "edit"
                  ? "bg-accent text-white shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-paper-warm"
              }`}
            >
              ✏️ Edit Draft
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                mobileTab === "preview"
                  ? "bg-accent text-white shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-paper-warm"
              }`}
            >
              👁️ View Preview
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
            {/* Template Tabs + Download */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
                background: "var(--paper-card)",
              }}
            >
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
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
                {isEnhanced && (
                  <span style={{
                    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                    color: "white",
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 10,
                    fontWeight: 700,
                    marginLeft: 4,
                    letterSpacing: "0.03em",
                    animation: "fadeIn 0.3s ease",
                  }}>
                    ✨ AI Enhanced
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "5px 14px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: isDownloading ? "wait" : "pointer",
                  fontFamily: "Instrument Sans, sans-serif",
                  transition: "all 0.15s",
                  boxShadow: "0 2px 8px var(--brand-glow)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  opacity: isDownloading ? 0.7 : 1,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isDownloading ? "..." : "PDF"}
              </button>
            </div>

            {/* Scaled Preview Container */}
            <div
              className="sbs-preview-viewport"
              style={{
                flex: 1,
                overflow: "auto",
                padding: 16,
              }}
            >
              <div ref={previewRef}>
                <div className="sbs-preview-scale">
                  {TemplatePreview}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Pane: Editor ── */}
          <div
            style={{
              flexDirection: "column",
            }}
            className={`w-full flex-col ${mobileTab === "edit" ? "flex" : "hidden lg:flex"}`}
          >
            {/* Toolbar */}
            <div
              style={{
                padding: "10px 14px",
                background: "var(--accent-bg)",
                borderBottom: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                color: "var(--ink-muted)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.07em",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>✏️ Editor</span>
                {appliedCount > 0 && (
                  <span style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {appliedCount} rewrite{appliedCount !== 1 ? "s" : ""} applied
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
                    borderRadius: 8,
                    padding: "5px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: isGenerating ? "wait" : "pointer",
                    fontFamily: "Instrument Sans, sans-serif",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 12px rgba(99, 102, 241, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    opacity: isGenerating ? 0.85 : 1,
                  }}
                >
                  {isGenerating ? (
                    <>
                      <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      ✨ Smart Generate
                    </>
                  )}
                </button>
                <ToolbarButton
                  onClick={handleReset}
                  disabled={!hasEdits && !isEnhanced}
                  label="↺ Reset"
                  variant="danger"
                  active={hasEdits || isEnhanced}
                />
                {analysisId && (
                  <ToolbarButton
                    onClick={() => setShowHistory(prev => !prev)}
                    label={showHistory ? "🕒 Hide History" : "🕒 History"}
                    variant={showHistory ? "primary" : "default"}
                  />
                )}
                <ToolbarButton
                  onClick={handleCopyAll}
                  label={copied ? "✓ Copied" : "Copy"}
                  variant="default"
                />
                <ToolbarButton
                  onClick={handleDownloadTxt}
                  label="↓ .txt"
                  variant="primary"
                />
              </div>
              {smartError && (
                <div style={{
                  color: "#dc2626",
                  fontSize: 11,
                  fontWeight: 500,
                  marginTop: 4,
                  width: "100%",
                }}>
                  ⚠ {smartError}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                className="sbs-editor-textarea"
                style={{ flex: 1 }}
                spellCheck={false}
              />

              {/* History Sidebar */}
              {showHistory && analysisId && (
                <div style={{
                  width: "320px",
                  flexShrink: 0,
                  borderLeft: "1px solid var(--border)",
                  background: "var(--paper-card)",
                  display: "flex",
                  flexDirection: "column",
                  animation: "fadeIn 0.15s ease",
                  overflowY: "auto",
                  padding: "16px",
                  boxSizing: "border-box",
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "8px",
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--ink)",
                      fontFamily: "Instrument Sans, sans-serif",
                    }}>
                      Version History
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowHistory(false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--ink-muted)",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Score progression chart */}
                  <ScoreTrendChart versions={versions} />

                  {/* Save current draft version */}
                  <form onSubmit={handleSaveVersion} style={{ marginBottom: "20px" }}>
                    <div style={{
                      fontSize: 10,
                      fontFamily: "DM Mono, monospace",
                      color: "var(--ink-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                    }}>
                      💾 Create Save Point
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        placeholder="e.g. Initial draft, Post review..."
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                        required
                        disabled={isSavingVersion}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1.5px solid var(--accent-border)",
                          background: "var(--paper)",
                          color: "var(--ink)",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isSavingVersion || !newVersionName.trim()}
                        style={{
                          background: "var(--accent)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          opacity: isSavingVersion ? 0.7 : 1,
                        }}
                      >
                        {isSavingVersion ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>

                  {/* Version Timeline */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 10,
                      fontFamily: "DM Mono, monospace",
                      color: "var(--ink-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 10,
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "4px",
                    }}>
                      🕒 Saved Versions ({versions.length})
                    </div>

                    {versionError && (
                      <div style={{
                        color: "#dc2626",
                        fontSize: "11px",
                        marginBottom: "10px",
                        padding: "6px",
                        background: "rgba(220, 38, 38, 0.05)",
                        borderRadius: "4px",
                      }}>
                        ⚠ {versionError}
                      </div>
                    )}

                    {isLoadingVersions && versions.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--ink-faint)", fontSize: "12px" }}>
                        Loading version timeline...
                      </div>
                    ) : versions.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--ink-faint)", fontSize: "12px" }}>
                        No saved versions yet.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {versions.map((v) => (
                          <div
                            key={v.id}
                            style={{
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              padding: "10px",
                              background: "var(--paper)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                              <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--ink)", wordBreak: "break-word" }}>
                                {v.version_name}
                              </div>
                              {v.score !== null && (
                                <span style={{
                                  background: "var(--accent-bg)",
                                  color: "var(--accent)",
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "10px",
                                  whiteSpace: "nowrap",
                                }}>
                                  {v.score} pts
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--ink-muted)", marginBottom: "8px", fontFamily: "DM Mono, monospace" }}>
                              {new Date(v.created_at).toLocaleString()}
                            </div>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                onClick={() => setCompareVersion(v)}
                                style={{
                                  background: "transparent",
                                  color: "var(--accent)",
                                  border: "1px solid var(--accent-border)",
                                  borderRadius: "4px",
                                  padding: "3px 8px",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                🔍 Diff
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRestoreVersion(v)}
                                style={{
                                  background: "transparent",
                                  color: "var(--ink)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "4px",
                                  padding: "3px 8px",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                ↺ Restore
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVersion(v.id)}
                                style={{
                                  background: "transparent",
                                  color: "#dc2626",
                                  border: "1px solid rgba(220,38,38,0.15)",
                                  borderRadius: "4px",
                                  padding: "3px 6px",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rewrite Suggestions */}
            {suggestions.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  padding: "12px 14px",
                  background: "var(--paper-warm)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--ink-faint)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  One-click Rewrites — applied changes reflect live in preview
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
                        {applied ? "✓ Applied" : `Apply: ${s.section}`}
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
