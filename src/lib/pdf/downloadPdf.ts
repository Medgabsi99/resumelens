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

/**
 * Generates and downloads a clean formatted PDF version of the Cover Letter.
 */
export async function downloadCoverLetterPdf(coverLetterText: string, targetRole?: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    const blob = new Blob([coverLetterText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover_Letter_${(targetRole || "Application").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const paragraphs = coverLetterText
    .split(/\n{2,}/)
    .map((p) => `<p>${p.trim()}</p>`)
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cover Letter - ${targetRole || "Application"}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 48px; color: #1f2937; line-height: 1.65; font-size: 14px; max-width: 750px; margin: 0 auto; }
          p { margin-bottom: 16px; white-space: pre-wrap; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div>${paragraphs}</div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
