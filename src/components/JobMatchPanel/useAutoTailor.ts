import { logger } from "@/lib/logger";
import { useState } from "react";

interface UseAutoTailorArgs {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
}

export function useAutoTailor({ resumeText, jobDescription, jobTitle }: UseAutoTailorArgs) {
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [tailoredResult, setTailoredResult] = useState<Record<string, unknown> | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [appliedTailored, setAppliedTailored] = useState(false);

  async function handleAutoTailor() {
    if (!resumeText || !jobDescription) return;
    setIsTailoring(true);
    setTailorError(null);
    try {
      const res = await fetch("/api/job-match/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          targetRole: jobTitle || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Auto-tailoring failed.");
      }
      setTailoredResult(data);
      setShowDiff(true);
    } catch (err: unknown) {
      logger.error(err);
      setTailorError((err as Error).message || "Failed to auto-tailor resume.");
    } finally {
      setIsTailoring(false);
    }
  }

  function applyTailoredResume() {
    if (!tailoredResult) return;
    window.dispatchEvent(
      new CustomEvent("apply-tailored-resume", {
        detail: {
          tailoredText: tailoredResult.tailoredText,
          tailoredResume: tailoredResult.tailoredResume,
          recommendedTemplate: tailoredResult.recommendedTemplate,
        },
      })
    );
    setAppliedTailored(true);
    setShowDiff(false);
  }

  function resetTailor() {
    setTailoredResult(null);
    setShowDiff(false);
    setAppliedTailored(false);
    setTailorError(null);
  }

  return {
    isTailoring,
    tailorError,
    tailoredResult,
    showDiff, setShowDiff,
    appliedTailored,
    handleAutoTailor,
    applyTailoredResume,
    resetTailor,
  };
}
