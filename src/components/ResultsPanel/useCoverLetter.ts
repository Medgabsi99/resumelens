import { logger } from "@/lib/logger";
import { useState } from "react";

export function useCoverLetter(
  resumeText?: string,
  jobDescription?: string,
  targetRole?: string
) {
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [clError, setClError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateCoverLetter = async () => {
    if (!resumeText) {
      setClError("No resume text available to generate a cover letter.");
      return;
    }

    setIsGeneratingCL(true);
    setClError(null);
    setCoverLetter("");

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setClError(data?.error || "Failed to generate cover letter.");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream reader available.");
      }

      const decoder = new TextDecoder();
      let done = false;
      let accumulated = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulated += chunk;
          setCoverLetter(accumulated);
        }
      }
    } catch (e: any) {
      logger.error(e);
      setClError(e.message || "Network error while generating cover letter.");
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleCopyCoverLetter = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    coverLetter,
    isGeneratingCL,
    clError,
    copied,
    handleGenerateCoverLetter,
    handleCopyCoverLetter,
  };
}
