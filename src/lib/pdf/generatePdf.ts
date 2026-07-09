import React from "react";
import DocumentWrapper from "./DocumentWrapper";
import ProfessionalPdfTemplate from "./ProfessionalPdfTemplate";
import ModernPdfTemplate from "./ModernPdfTemplate";
import CreativePdfTemplate from "./CreativePdfTemplate";
import MinimalPdfTemplate from "./MinimalPdfTemplate";
import ExecutivePdfTemplate from "./ExecutivePdfTemplate";
import { type ParsedResume } from "@/lib/parseResume";

export function getPdfTemplateComponent(
  templateId: string,
  data: ParsedResume,
  targetRole?: string,
  customStyle?: Record<string, unknown>
) {
  const props = { data, targetRole, customStyle };
  switch (templateId) {
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
    default:
      return React.createElement(ProfessionalPdfTemplate, props);
  }
}

export function renderResumePdf(
  templateId: string,
  data: ParsedResume,
  targetRole?: string,
  customStyle?: Record<string, unknown>
): React.ReactElement {
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
): React.ReactElement {
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