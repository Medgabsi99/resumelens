"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { RewriteSuggestion } from "@/types";
import { type ParsedResume } from "@/lib/parseResume";
import ProfessionalTemplate from "./resume-templates/ProfessionalTemplate";
import ModernTemplate from "./resume-templates/ModernTemplate";
import CreativeTemplate from "./resume-templates/CreativeTemplate";
import MinimalTemplate from "./resume-templates/MinimalTemplate";
import ExecutiveTemplate from "./resume-templates/ExecutiveTemplate";
import * as Diff from "diff";

interface Props {
  initialText: string;
  suggestions: RewriteSuggestion[];
  targetRole?: string;
  resultScore: number;
  analysisId?: string;
}

export interface ResumeVersion {
  id: string;
  version_name: string;
  resume_text: string;
  score: number | null;
  created_at: string;
}

type TemplateId = "professional" | "modern" | "creative" | "minimal" | "executive";

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
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Version History States
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [compareVersion, setCompareVersion] = useState<ResumeVersion | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    if (!analysisId) return;
    setIsLoadingVersions(true);
    setVersionError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/versions`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch versions");
      setVersions(data.data || []);
    } catch (err: any) {
      setVersionError(err.message || "Could not load version history");
    } finally {
      setIsLoadingVersions(false);
    }
  }, [analysisId]);

  useEffect(() => {
    if (analysisId && showHistory) {
      fetchVersions();
    }
  }, [analysisId, showHistory, fetchVersions]);

  const handleSaveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisId || !newVersionName.trim()) return;
    setIsSavingVersion(true);
    setVersionError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionName: newVersionName.trim(),
          resumeText: text,
          score: resultScore,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save version");
      
      setNewVersionName("");
      setVersions((prev) => [data.data, ...prev]);
    } catch (err: any) {
      setVersionError(err.message || "Could not save version");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!analysisId) return;
    if (!confirm("Are you sure you want to delete this version snapshot?")) return;
    
    setVersionError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/versions?versionId=${versionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete version");
      
      setVersions((prev) => prev.filter((v) => v.id !== versionId));
      if (compareVersion?.id === versionId) {
        setCompareVersion(null);
      }
    } catch (err: any) {
      setVersionError(err.message || "Could not delete version");
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


  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: `Resume - ${targetRole || "Resume"}`,
  });

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
          {/* ── Left Pane: Live Preview ── */}
          <div
            style={{
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              background: "var(--paper-warm)",
            }}
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
                onClick={() => handlePrint()}
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "5px 14px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Instrument Sans, sans-serif",
                  transition: "all 0.15s",
                  boxShadow: "0 2px 8px var(--brand-glow)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF
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
              display: "flex",
              flexDirection: "column",
            }}
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

// ─── Toolbar Button ─────────────────────────────────────────

function ToolbarButton({
  onClick,
  label,
  disabled = false,
  variant = "default",
  active = true,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
  active?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: "transparent",
      color: "var(--ink)",
      border: "1px solid var(--border)",
    },
    primary: {
      background: "var(--accent)",
      color: "white",
      border: "none",
    },
    danger: {
      background: "transparent",
      color: active ? "#7a2020" : "var(--ink-faint)",
      border: `1px solid ${active ? "rgba(122,32,32,0.3)" : "var(--border)"}`,
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Instrument Sans, sans-serif",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Score Progression Chart (Custom SVG) ───────────────────────

function ScoreTrendChart({ versions }: { versions: ResumeVersion[] }) {
  const chartData = useMemo(() => {
    return [...versions]
      .reverse()
      .map((v) => ({
        name: v.version_name,
        score: v.score || 0,
        date: new Date(v.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [versions]);

  if (chartData.length < 2) {
    return (
      <div style={{
        padding: "16px 12px",
        textAlign: "center",
        color: "var(--ink-faint)",
        fontSize: "11.5px",
        border: "1px dashed var(--border)",
        borderRadius: 8,
        background: "rgba(0,0,0,0.02)",
        marginBottom: "16px",
      }}>
        📈 Save at least 2 versions to see score trend analytics.
      </div>
    );
  }

  const width = 300;
  const height = 80;
  const paddingX = 20;
  const paddingY = 15;

  const minScore = 0;
  const maxScore = 100;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.score - minScore) / (maxScore - minScore)) * (height - 2 * paddingY);
    return { x, y, score: d.score, name: d.name, date: d.date };
  });

  const pathD = points.reduce((acc, p, i) => {
    return acc + `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div style={{
      background: "var(--paper-warm)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "12px",
      marginBottom: "16px",
    }}>
      <div style={{
        fontSize: 10,
        fontFamily: "DM Mono, monospace",
        color: "var(--ink-muted)",
        marginBottom: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span>📈 SCORE TREND</span>
        <span style={{ fontWeight: 700, color: "var(--accent)" }}>
          {chartData[chartData.length - 1].score - chartData[0].score >= 0 ? "+" : ""}
          {chartData[chartData.length - 1].score - chartData[0].score} pts
        </span>
      </div>
      <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((val, idx) => {
            const y = paddingY + val * (height - 2 * paddingY);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            );
          })}

          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="var(--paper-card)"
                stroke="var(--accent)"
                strokeWidth="2"
              />
              {i === 0 || i === points.length - 1 || points.length <= 5 ? (
                <text
                  x={p.x}
                  y={p.y - 7}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="var(--ink)"
                  style={{ fontFamily: "Instrument Sans, sans-serif" }}
                >
                  {p.score}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "9px",
        fontFamily: "DM Mono, monospace",
        color: "var(--ink-faint)",
        marginTop: "4px",
        padding: "0 4px",
      }}>
        <span>{chartData[0].date}</span>
        <span>{chartData[chartData.length - 1].date}</span>
      </div>
    </div>
  );
}

// ─── Git-Style Visual Diff Modal ───────────────────────────────

function VersionDiffModal({
  version,
  currentText,
  onClose,
  onRestore,
}: {
  version: ResumeVersion;
  currentText: string;
  onClose: () => void;
  onRestore: () => void;
}) {
  const diffs = useMemo(() => {
    return Diff.diffWordsWithSpace(version.resume_text, currentText);
  }, [version.resume_text, currentText]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "850px",
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--accent-bg)",
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--ink)",
              fontFamily: "Instrument Sans, sans-serif",
            }}>
              Comparing: {version.version_name}
            </h3>
            <p style={{
              margin: "4px 0 0 0",
              fontSize: "11px",
              color: "var(--ink-muted)",
              fontFamily: "DM Mono, monospace",
            }}>
              Saved on {new Date(version.created_at).toLocaleString()} • Score: {version.score ?? "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--ink-muted)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            &times;
          </button>
        </div>

        {/* Legend */}
        <div style={{
          padding: "10px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--paper-warm)",
          display: "flex",
          gap: "16px",
          fontSize: "11px",
          fontWeight: 600,
          fontFamily: "Instrument Sans, sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              background: "#ffebe9",
              border: "1px solid #ffc1c1",
              borderRadius: "3px",
              display: "inline-block",
            }} />
            <span style={{ color: "#b91c1c" }}>Deleted from Snapshot</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              background: "#e6ffec",
              border: "1px solid #abf2af",
              borderRadius: "3px",
              display: "inline-block",
            }} />
            <span style={{ color: "#15803d" }}>Added in Active Editor</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              display: "inline-block",
            }} />
            <span style={{ color: "var(--ink-muted)" }}>Unchanged</span>
          </div>
        </div>

        {/* Diff view */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "24px",
          background: "var(--paper)",
          fontFamily: "DM Mono, monospace",
          fontSize: "13px",
          lineHeight: "1.7",
          whiteSpace: "pre-wrap",
        }}>
          {diffs.map((part, index) => {
            let style: React.CSSProperties = {};
            if (part.added) {
              style = {
                background: "#e6ffec",
                color: "#15803d",
                textDecoration: "none",
                fontWeight: 600,
              };
            } else if (part.removed) {
              style = {
                background: "#ffebe9",
                color: "#b91c1c",
                textDecoration: "line-through",
              };
            }
            return (
              <span key={index} style={style}>
                {part.value}
              </span>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          background: "var(--paper-card)",
        }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to restore "${version.version_name}"? This will overwrite your current draft.`)) {
                onRestore();
                onClose();
              }
            }}
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px var(--brand-glow)",
            }}
          >
            ↺ Restore This Version
          </button>
        </div>
      </div>
    </div>
  );
}