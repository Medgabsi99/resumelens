import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/types";
import ProfessionalTemplate from "@/components/pdf-templates/ProfessionalTemplate";
import ModernTemplate from "@/components/pdf-templates/ModernTemplate";
import MinimalTemplate from "@/components/pdf-templates/MinimalTemplate";
import CreativeTemplate from "@/components/pdf-templates/CreativeTemplate";
import ExecutiveTemplate from "@/components/pdf-templates/ExecutiveTemplate";

export type PdfTemplate = "results" | "professional" | "classic" | "modern" | "minimal" | "creative" | "executive";

interface UsePdfExportArgs {
  result: AnalysisResult;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  onSuccess: (msg: string, title?: string) => void;
  onError: (msg: string, title?: string) => void;
}

export function usePdfExport({
  result,
  resumeText,
  jobDescription,
  targetRole,
  onSuccess,
  onError,
}: UsePdfExportArgs) {
  const [pdfTemplate, setPdfTemplate] = useState<PdfTemplate>("results");
  const [barWidth, setBarWidth] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Animate score bar on mount
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(result.score), 200);
    return () => clearTimeout(t);
  }, [result.score]);

  const scoreColor =
    result.score >= 85
      ? "#10b981"
      : result.score >= 70
      ? "#6366f1"
      : result.score >= 55
      ? "#f59e0b"
      : "#ef4444";

  const radius = 22;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (barWidth / 100) * circumference;

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const { downloadReviewPdf } = await import("@/lib/pdf/downloadPdf");
      await downloadReviewPdf(pdfTemplate, result, targetRole, jobDescription);
      onSuccess("PDF generated successfully.", "Download complete");
    } catch (err: any) {
      logger.error("PDF export error:", err);
      onError(err.message || "Failed to download PDF.", "Download error");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderSelectedTemplate = () => {
    if (pdfTemplate === "results") {
      return (
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>
              {targetRole || "Resume Review"}
            </div>
            <div style={{ fontSize: 22, fontFamily: "DM Serif Display, serif", color: scoreColor }}>
              {result.score}
            </div>
          </div>
          <div style={{ marginTop: 8, color: "var(--ink-muted)", whiteSpace: "pre-wrap" }}>
            {result.summary}
          </div>
        </div>
      );
    }

    const templateProps = { resumeText, jobDescription, targetRole, result };
    switch (pdfTemplate) {
      case "professional":
      case "classic":  return <ProfessionalTemplate {...templateProps} />;
      case "modern":   return <ModernTemplate {...templateProps} />;
      case "minimal":  return <MinimalTemplate {...templateProps} />;
      case "executive": return <ExecutiveTemplate {...templateProps} />;
      default:         return <CreativeTemplate {...templateProps} />;
    }
  };

  return {
    pdfTemplate, setPdfTemplate,
    barWidth,
    isDownloading,
    scoreColor,
    radius, strokeWidth, circumference, strokeDashoffset,
    handleDownloadPdf,
    renderSelectedTemplate,
  };
}
