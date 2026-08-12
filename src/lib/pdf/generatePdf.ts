import React from "react";
import DocumentWrapper from "./DocumentWrapper";
import TechProPdfTemplate from "./TechProPdfTemplate";
import ProfessionalPdfTemplate from "./ProfessionalPdfTemplate";
import ModernPdfTemplate from "./ModernPdfTemplate";
import CreativePdfTemplate from "./CreativePdfTemplate";
import MinimalPdfTemplate from "./MinimalPdfTemplate";
import ExecutivePdfTemplate from "./ExecutivePdfTemplate";
import { type ParsedResume } from "@/lib/parseResume";
import { type ResumeCustomStyle } from "@/components/ResumeEditor/types";
import type { DocumentProps } from "@react-pdf/renderer";

export function getPdfTemplateComponent(
  templateId: string,
  data: ParsedResume,
  targetRole?: string,
  customStyle?: ResumeCustomStyle
) {
  const props = { data, targetRole, customStyle };
  switch (templateId) {
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
  const component = getPdfTemplateComponent(templateId, data, targetRole, customStyle);
  return React.createElement(
    DocumentWrapper,
    { title: `Resume - ${data.contact.name || "CV"}` },
    component
  );
}

import ResumeReviewPdfTemplate from "./ResumeReviewPdfTemplate";
import { type AnalysisResult } from "@/types";

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
