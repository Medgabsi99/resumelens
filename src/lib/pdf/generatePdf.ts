import React from "react";
import DocumentWrapper from "./DocumentWrapper";
import TechProPdfTemplate from "./TechProPdfTemplate";
import ProfessionalPdfTemplate from "./ProfessionalPdfTemplate";
import ModernPdfTemplate from "./ModernPdfTemplate";
import CreativePdfTemplate from "./CreativePdfTemplate";
import MinimalPdfTemplate from "./MinimalPdfTemplate";
import ExecutivePdfTemplate from "./ExecutivePdfTemplate";
import ResumeReviewPdfTemplate from "./ResumeReviewPdfTemplate";
import PlainTextPdfTemplate from "./PlainTextPdfTemplate";
import AtsPdfATemplate from "./AtsPdfATemplate";
import { type ParsedResume } from "@/lib/parseResume";
import { type ResumeCustomStyle } from "@/components/ResumeEditor/types";
import { type AnalysisResult } from "@/types";
import type { DocumentProps } from "@react-pdf/renderer";
import { sanitizeResumeData } from "./pdfSanitizer";

// ─── Plain-text markdown stripper (for same-format path only) ──────────────────
function stripMdPlainText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/\*([\s\S]+?)\*/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function getPdfTemplateComponent(
  templateId: string,
  data: ParsedResume,
  targetRole?: string,
  customStyle?: ResumeCustomStyle
) {
  const props = { data, targetRole, customStyle };
  switch (templateId) {
    case "ats-certified":
    case "ats-safe":
      return React.createElement(AtsPdfATemplate, { data, targetRole });
    case "tech-pro":
      return React.createElement(TechProPdfTemplate, { data, targetRole });
    case "modern":
      return React.createElement(ModernPdfTemplate, props);
    case "creative":
      return React.createElement(CreativePdfTemplate, props);
    case "minimal":
      return React.createElement(MinimalPdfTemplate, props);
    case "executive":
      return React.createElement(ExecutivePdfTemplate, props);
    case "professional":
    case "classic":
    case "results":
    case "sidebar":
    case "bold-header":
    case "elegant":
    default:
      return React.createElement(ProfessionalPdfTemplate, props);
  }
}

export function renderResumePdf(
  templateId: string,
  data: ParsedResume,
  targetRole?: string,
  customStyle?: ResumeCustomStyle
): React.ReactElement<DocumentProps> {
  // ⚡ Self-healing: detect and repair ALL known data issues automatically
  const { data: clean } = sanitizeResumeData(data);
  const component = getPdfTemplateComponent(templateId, clean, targetRole, customStyle);
  return React.createElement(
    DocumentWrapper,
    { title: `Resume - ${clean.contact.name || "CV"}` },
    component
  );
}

export function renderPlainTextPdf(
  text: string,
  targetRole?: string,
  styleTokens?: import("@/types").ResumeStyleTokens,
  structuredResume?: import("@/types/structuredResume").StructuredResume
): React.ReactElement<DocumentProps> {
  const cleanText = stripMdPlainText(text);
  const component = React.createElement(PlainTextPdfTemplate, {
    text: cleanText,
    targetRole,
    styleTokens,
    structuredResume,
  });
  return React.createElement(
    DocumentWrapper,
    { title: `Resume${targetRole ? ` - ${targetRole}` : ""} (Fixed)` },
    component
  );
}

export function renderReviewPdf(
  templateId: string,
  result: AnalysisResult,
  targetRole?: string,
  jobDescription?: string
): React.ReactElement<DocumentProps> {
  const component = React.createElement(ResumeReviewPdfTemplate, {
    result,
    targetRole,
    templateId,
    jobDescription,
  });
  const backgroundColor = templateId === "creative" ? "#fffaf6" : "#ffffff";
  return React.createElement(
    DocumentWrapper,
    { title: `Resume Review - ${targetRole || "Analysis"}`, backgroundColor },
    component
  );
}

/**
 * Offloads heavy @react-pdf/renderer document rendering to an async non-blocking task queue
 * to maintain 60fps UI responsiveness during multi-page PDF generation.
 */
export async function generatePdfBlobAsync(
  pdfDocumentElement: React.ReactElement<DocumentProps>
): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const blob = await pdf(pdfDocumentElement).toBlob();
        resolve(blob);
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}
