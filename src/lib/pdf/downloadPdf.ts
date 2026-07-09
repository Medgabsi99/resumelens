import { type ParsedResume } from "@/lib/parseResume";
import { type ResumeCustomStyle } from "@/components/ResumeEditor/types";

/**
 * Generates and downloads the resume PDF in the browser.
 * Dynamically imports `@react-pdf/renderer` to minimize initial bundle size.
 */
export async function downloadResumePdf(
  templateId: string,
  data: ParsedResume,
  targetRole?: string,
  customStyle?: ResumeCustomStyle
) {
  // Dynamically import to ensure code-splitting / lazy-loading
  const { pdf } = await import("@react-pdf/renderer");
  const { renderResumePdf } = await import("./generatePdf");

  const doc = renderResumePdf(templateId, data, targetRole, customStyle);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf's pdf() type expects Document but accepts ReactElement at runtime
  const blob = await pdf(doc as any).toBlob();

  const fileName = `${(data.contact.name || "Resume").replace(/\s+/g, "_")}-${templateId}.pdf`;
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

import { type AnalysisResult } from "@/types";

/**
 * Generates and downloads the resume review PDF in the browser.
 * Dynamically imports `@react-pdf/renderer` to minimize initial bundle size.
 */
export async function downloadReviewPdf(
  templateId: string,
  result: AnalysisResult,
  targetRole?: string,
  jobDescription?: string
) {
  // Dynamically import to ensure code-splitting / lazy-loading
  const { pdf } = await import("@react-pdf/renderer");
  const { renderReviewPdf } = await import("./generatePdf");

  const doc = renderReviewPdf(templateId, result, targetRole, jobDescription);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf's pdf() type expects Document but accepts ReactElement at runtime
  const blob = await pdf(doc as any).toBlob();

  const fileName = `Resume_Review_${(targetRole || "Analysis").replace(/\s+/g, "_")}-${templateId}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
