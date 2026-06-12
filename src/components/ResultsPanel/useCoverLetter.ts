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

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        setClError(data?.error || "Failed to generate cover letter.");
        return;
      }

      setCoverLetter(data.coverLetter || data.data || "");
    } catch (e) {
      console.error(e);
      setClError("Network error while generating cover letter.");
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
