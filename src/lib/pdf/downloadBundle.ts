import { downloadResumePdf, downloadCoverLetterPdf } from "./downloadPdf";
import { type ParsedResume } from "@/lib/parseResume";

/**
 * Downloads candidate's full application package (Resume PDF & Cover Letter PDF)
 */
export async function downloadApplicationBundle(
  templateId: string,
  resumeData: ParsedResume,
  coverLetterText?: string,
  targetRole?: string
) {
  // Download Resume PDF
  await downloadResumePdf(templateId, resumeData, targetRole);

  // If Cover Letter exists, download Cover Letter PDF
  if (coverLetterText) {
    setTimeout(async () => {
      await downloadCoverLetterPdf(coverLetterText, targetRole);
    }, 800);
  }
}
