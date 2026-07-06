"use client";
import { logger } from "@/lib/logger";

import React, { useState, useRef } from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import ProfessionalTemplate from "./resume-templates/ProfessionalTemplate";
import ModernTemplate from "./resume-templates/ModernTemplate";
import CreativeTemplate from "./resume-templates/CreativeTemplate";
import MinimalTemplate from "./resume-templates/MinimalTemplate";
import ExecutiveTemplate from "./resume-templates/ExecutiveTemplate";

interface Props {
  resumeText: string;
  targetRole?: string;
}

type TemplateId = "professional" | "modern" | "creative" | "minimal" | "executive";

interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  component: React.ComponentType<{ resumeText: string; targetRole?: string; parsedData?: ParsedResume }>;
}

const templates: TemplateInfo[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean, traditional layout with blue accents. Ideal for corporate roles.",
    component: ProfessionalTemplate,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Single-column design with gradient header. Great for tech and creative roles.",
    component: ModernTemplate,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Unique design with gradient accents. Perfect for design and marketing.",
    component: CreativeTemplate,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, simple layout with lots of whitespace. Ideal for any role.",
    component: MinimalTemplate,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Formal, detailed layout with serif fonts. Best for senior positions.",
    component: ExecutiveTemplate,
  },
];

export default function ResumeTemplateSelector({ resumeText, targetRole }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [recommendedTemplate, setRecommendedTemplate] = useState<TemplateId | null>(null);

  const handleSelectTemplate = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
    setShowPreview(true);
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownloadPdf = async () => {
    if (!selectedTemplate) return;
    setIsDownloading(true);
    try {
      const data = parsedData || parseResume(resumeText);
      const { downloadResumePdf } = await import("@/lib/pdf/downloadPdf");
      await downloadResumePdf(selectedTemplate, data, targetRole);
    } catch (err: any) {
      logger.error("PDF download error:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSmartGenerate = async () => {
    setIsGenerating(true);
    setSmartError(null);
    try {
      const res = await fetch("/api/smart-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");

      setParsedData(data.parsedResume);
      setIsEnhanced(true);

      // Auto-switch to recommended template
      if (data.recommendedTemplate) {
        const valid: TemplateId[] = ["professional", "modern", "creative", "minimal", "executive"];
        if (valid.includes(data.recommendedTemplate as TemplateId)) {
          setRecommendedTemplate(data.recommendedTemplate as TemplateId);
          setSelectedTemplate(data.recommendedTemplate as TemplateId);
          setShowPreview(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Smart generation failed";
      setSmartError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const SelectedTemplateComponent = selectedTemplate 
    ? templates.find(t => t.id === selectedTemplate)?.component 
    : null;

  return (
    <div>
      {/* Smart Generate Button */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
        flexWrap: "wrap",
      }}>
        <button
          type="button"
          onClick={handleSmartGenerate}
          disabled={isGenerating}
          style={{
            background: isGenerating
              ? "linear-gradient(135deg, #7c3aed, #6366f1)"
              : "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 22px",
            fontSize: 13,
            fontWeight: 700,
            cursor: isGenerating ? "wait" : "pointer",
            fontFamily: "Instrument Sans, sans-serif",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            opacity: isGenerating ? 0.85 : 1,
          }}
        >
          {isGenerating ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
              AI is restructuring your resume...
            </>
          ) : (
            <>
              ✨ Smart Generate
            </>
          )}
        </button>
        {isEnhanced && (
          <span style={{
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "white",
            padding: "4px 14px",
            borderRadius: 14,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.03em",
          }}>
            ✨ AI Enhanced
          </span>
        )}
        {smartError && (
          <span style={{ color: "#dc2626", fontSize: 12, fontWeight: 500 }}>
            ⚠ {smartError}
          </span>
        )}
      </div>

      {/* Template Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          const isRecommended = recommendedTemplate === template.id;
          return (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className="glass-card p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all duration-200"
              style={{
                borderWidth: "1.5px",
                borderColor: isSelected ? "var(--accent)" : isRecommended ? "#8b5cf6" : "var(--border)",
                background: isSelected ? "var(--accent-bg)" : "var(--paper-card)",
                transform: isSelected ? "translateY(-2px)" : "none",
                boxShadow: isSelected
                  ? "0 8px 20px -6px var(--brand-glow)"
                  : isRecommended
                  ? "0 4px 16px -4px rgba(139, 92, 246, 0.2)"
                  : "none",
                position: "relative",
              }}
            >
              {isRecommended && (
                <div style={{
                  position: "absolute",
                  top: -8,
                  right: 8,
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  color: "white",
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 8,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}>
                  ✨ AI Pick
                </div>
              )}
              <div>
                <div
                  className="text-sm font-semibold mb-1"
                  style={{
                    color: isSelected ? "var(--accent)" : "var(--ink)",
                  }}
                >
                  {template.name}
                </div>
                <div className="text-xs text-ink-muted leading-relaxed">
                  {template.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Section */}
      {showPreview && SelectedTemplateComponent && (
        <div
          className="glass-card p-6 rounded-2xl border border-border mt-6 fade-up"
          style={{
            background: "var(--paper-card)",
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <div className="text-sm font-semibold text-ink-muted">
              Previewing Template: <span className="text-accent font-bold">{templates.find(t => t.id === selectedTemplate)?.name}</span>
              {isEnhanced && (
                <span style={{
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  marginLeft: 8,
                }}>
                  ✨ AI Enhanced
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="text-xs font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-strong px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                style={{ background: "var(--paper-warm)" }}
              >
                Close Preview
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="btn-gradient text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                {isDownloading ? "Generating..." : "↓ Download PDF"}
              </button>
            </div>
          </div>
          <div
            ref={previewRef}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              maxHeight: "650px",
              overflowY: "auto",
              background: "#ffffff",
            }}
          >
            <SelectedTemplateComponent
              resumeText={resumeText}
              targetRole={targetRole}
              parsedData={parsedData || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}