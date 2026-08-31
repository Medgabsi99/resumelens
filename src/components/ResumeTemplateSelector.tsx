"use client";

import { logger } from "@/lib/logger";
import React, { useState, useRef } from "react";
import { Loader2, Sparkles, AlertTriangle, ArrowDown, Check } from "lucide-react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import { sanitizeResumeData } from "@/lib/pdf/pdfSanitizer";
import TechProTemplate from "./resume-templates/TechProTemplate";
import ProfessionalTemplate from "./resume-templates/ProfessionalTemplate";
import ModernTemplate from "./resume-templates/ModernTemplate";
import CreativeTemplate from "./resume-templates/CreativeTemplate";
import MinimalTemplate from "./resume-templates/MinimalTemplate";
import ExecutiveTemplate from "./resume-templates/ExecutiveTemplate";
import SidebarTemplate from "./resume-templates/SidebarTemplate";
import BoldHeaderTemplate from "./resume-templates/BoldHeaderTemplate";
import ElegantTemplate from "./resume-templates/ElegantTemplate";
import {
  TechProThumb,
  ProfessionalThumb,
  ModernThumb,
  CreativeThumb,
  MinimalThumb,
  ExecutiveThumb,
  SidebarThumb,
  BoldHeaderThumb,
  ElegantThumb,
} from "./resume-templates/TemplateThumbnails";

interface Props {
  resumeText: string;
  targetRole?: string;
}

type TemplateId =
  | "tech-pro"
  | "professional"
  | "modern"
  | "creative"
  | "minimal"
  | "executive"
  | "sidebar"
  | "bold-header"
  | "elegant";

interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  component: React.ComponentType<{
    resumeText: string;
    targetRole?: string;
    parsedData?: ParsedResume;
  }>;
  thumbnail: React.ReactNode;
}

/* ─── Template Registry ──────────────────────────────────────────────── */

const templates: TemplateInfo[] = [
  {
    id: "tech-pro",
    name: "Tech Pro",
    description: "ATS-optimized for IT & SWE roles — dark header, skills-first",
    badge: "ATS ✓",
    badgeColor: "#16a34a",
    component: TechProTemplate,
    thumbnail: <TechProThumb />,
  },
  {
    id: "professional",
    name: "Classic Pro",
    description: "Timeless serif format — corporate, banking, consulting",
    component: ProfessionalTemplate,
    thumbnail: <ProfessionalThumb />,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Gradient header, skill chips, great for tech roles",
    component: ModernTemplate,
    thumbnail: <ModernThumb />,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Color sidebar accent, bold typography",
    component: CreativeTemplate,
    thumbnail: <CreativeThumb />,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Whitespace-forward, clean and timeless",
    component: MinimalTemplate,
    thumbnail: <MinimalThumb />,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Serif font, formal structure for senior roles",
    component: ExecutiveTemplate,
    thumbnail: <ExecutiveThumb />,
  },
  {
    id: "sidebar",
    name: "Sidebar Pro",
    description: "Two-column with colored sidebar for contact & skills",
    badge: "NEW",
    badgeColor: "#059669",
    component: SidebarTemplate,
    thumbnail: <SidebarThumb />,
  },
  {
    id: "bold-header",
    name: "Bold Header",
    description: "Gradient hero header with timeline experience",
    badge: "NEW",
    badgeColor: "#1e3a8a",
    component: BoldHeaderTemplate,
    thumbnail: <BoldHeaderThumb />,
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Gold serif CV style, ideal for senior candidates",
    badge: "NEW",
    badgeColor: "#b8860b",
    component: ElegantTemplate,
    thumbnail: <ElegantThumb />,
  },
];

/* ─── Component ─────────────────────────────────────────────────────── */

export default function ResumeTemplateSelector({ resumeText, targetRole }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [recommendedTemplate, setRecommendedTemplate] = useState<TemplateId | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<TemplateId | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSelectTemplate = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
    setShowPreview(true);
  };

  const currentParsedData = React.useMemo(() => {
    const raw = parsedData || parseResume(resumeText);
    const { data } = sanitizeResumeData(raw);
    return data;
  }, [parsedData, resumeText]);

  const handleDownloadPdf = async () => {
    if (!selectedTemplate) return;
    setIsDownloading(true);
    try {
      const { downloadResumePdf } = await import("@/lib/pdf/downloadPdf");
      await downloadResumePdf(selectedTemplate, currentParsedData, targetRole);
    } catch (err: unknown) {
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
      const resData = data.data || data.parsedResume || data;
      setParsedData(resData);
      setIsEnhanced(true);
      const rec = resData.recommendedTemplate || data.recommendedTemplate;
      if (rec) {
        const valid: TemplateId[] = [
          "tech-pro",
          "professional",
          "modern",
          "creative",
          "minimal",
          "executive",
          "sidebar",
          "bold-header",
          "elegant",
        ];
        if (valid.includes(rec as TemplateId)) {
          setRecommendedTemplate(rec as TemplateId);
          setSelectedTemplate(rec as TemplateId);
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
    ? templates.find((t) => t.id === selectedTemplate)?.component
    : null;

  return (
    <div>
      {/* Smart Generate */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleSmartGenerate}
          disabled={isGenerating}
          style={{
            background: isGenerating
              ? "var(--accent-hover)"
              : "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 22px",
            fontSize: 13,
            fontWeight: 700,
            cursor: isGenerating ? "wait" : "pointer",
            fontFamily: "Instrument Sans, sans-serif",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 16px var(--brand-glow)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            opacity: isGenerating ? 0.85 : 1,
          }}
        >
          {isGenerating ? (
            <>
              <span style={{ display: "inline-flex", animation: "spin 1s linear infinite" }}>
                <Loader2 size={14} />
              </span>
              Restructuring resume structure...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Format & Align
            </>
          )}
        </button>
        {isEnhanced && (
          <span
            style={{
              background: "var(--accent-bg)",
              color: "var(--accent)",
              border: "1px solid var(--accent-border)",
              padding: "4px 14px",
              borderRadius: 14,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Sparkles size={11} /> Restructured
            </span>
          </span>
        )}
        {smartError && (
          <span style={{ color: "#dc2626", fontSize: 12, fontWeight: 500 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={12} /> {smartError}
            </span>
          </span>
        )}
      </div>

      {/* Template Grid with Visual Thumbnails */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          const isRecommended = recommendedTemplate === template.id;
          const isHovered = hoveredTemplate === template.id;

          return (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              style={{
                cursor: "pointer",
                borderRadius: 12,
                border: isSelected
                  ? "2px solid var(--accent)"
                  : isRecommended
                    ? "2px solid var(--accent)"
                    : "2px solid var(--border)",
                background: "var(--paper-card)",
                overflow: "hidden",
                position: "relative",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isSelected
                  ? "translateY(-3px)"
                  : isHovered
                    ? "translateY(-2px)"
                    : "none",
                boxShadow: isSelected
                  ? "0 8px 24px -6px var(--brand-glow)"
                  : isHovered
                    ? "0 4px 16px -4px rgba(0,0,0,0.12)"
                    : "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {/* NEW / Recommended badge */}
              {(template.badge || isRecommended) && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: isRecommended
                      ? "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)"
                      : template.badgeColor,
                    color: "white",
                    fontSize: 8,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 6,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    zIndex: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {isRecommended ? "★ Recommended" : template.badge}
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                  }}
                >
                  <Check size={10} color="white" strokeWidth={3} />
                </div>
              )}

              {/* Thumbnail SVG */}
              <div
                style={{
                  height: 130,
                  background: "#f9fafb",
                  borderBottom: "1px solid var(--border)",
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                {template.thumbnail}
              </div>

              {/* Label */}
              <div style={{ padding: "8px 10px 10px" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isSelected ? "var(--accent)" : "var(--ink)",
                    marginBottom: 3,
                    fontFamily: "Instrument Sans, sans-serif",
                  }}
                >
                  {template.name}
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    color: "var(--ink-muted)",
                    lineHeight: 1.4,
                  }}
                >
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
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              background: "var(--paper-warm)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>
              Previewing:{" "}
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                {templates.find((t) => t.id === selectedTemplate)?.name}
              </span>
              {isEnhanced && (
                <span
                  style={{
                    background: "var(--accent-bg)",
                    color: "var(--accent)",
                    border: "1px solid var(--accent-border)",
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 700,
                    marginLeft: 8,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={10} /> Restructured
                  </span>
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink-muted)",
                  border: "1px solid var(--border)",
                  background: "var(--paper-card)",
                  borderRadius: 10,
                  padding: "7px 14px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                style={{
                  background: isDownloading
                    ? "#9ca3af"
                    : "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "7px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isDownloading ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 10px var(--brand-glow)",
                }}
              >
                {isDownloading ? (
                  "Generating…"
                ) : (
                  <>
                    <ArrowDown size={13} /> Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            ref={previewRef}
            style={{
              border: "none",
              maxHeight: "700px",
              overflowY: "auto",
              background: "var(--paper-card)",
            }}
          >
            <SelectedTemplateComponent
              resumeText={resumeText}
              targetRole={targetRole}
              parsedData={currentParsedData}
            />
          </div>
        </div>
      )}
    </div>
  );
}
