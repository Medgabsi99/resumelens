import { logger } from "@/lib/logger";
import { useState } from "react";
import { JobMatchResult } from "@/types";

interface UseJobMatchArgs {
  resumeText: string;
  defaultJobDescription?: string;
  defaultJobTitle?: string;
  defaultCompanyName?: string;
}

export function useJobMatch({
  resumeText,
  defaultJobDescription = "",
  defaultJobTitle = "",
  defaultCompanyName = "",
}: UseJobMatchArgs) {
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [companyName, setCompanyName] = useState(defaultCompanyName);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobMatchResult | null>(null);

  async function handleMatch() {
    if (!resumeText) {
      setError("No resume text available.");
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      setError("Please paste a job description (at least 50 characters).");
      return;
    }

    setIsMatching(true);
    setError(null);

    try {
      const res = await fetch("/api/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobTitle: jobTitle || undefined,
          companyName: companyName || undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        setError(data?.error || "Job match failed. Please try again.");
        return;
      }

      setResult(data.data);
    } catch (e) {
      logger.error("Job match failed", e);
      setError("Network error during job match.");
    } finally {
      setIsMatching(false);
    }
  }

  function clearResult() {
    setResult(null);
    setError(null);
  }

  return {
    jobDescription, setJobDescription,
    jobTitle, setJobTitle,
    companyName, setCompanyName,
    isMatching,
    error, setError,
    result,
    handleMatch,
    clearResult,
  };
}
