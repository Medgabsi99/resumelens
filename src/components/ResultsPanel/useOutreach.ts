import { useState } from "react";

export function useOutreach(
  resumeText?: string,
  jobDescription?: string,
  targetRole?: string
) {
  const [outreachMessage, setOutreachMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recruiterName, setRecruiterName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [outreachType, setOutreachType] = useState<"recruiter" | "peer">("recruiter");

  const handleGenerateOutreach = async () => {
    if (!resumeText) {
      setError("No resume text available to generate an outreach message.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setOutreachMessage(null);

    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription || "",
          jobTitle: targetRole || "Target Role",
          companyName: companyName.trim() || "Target Company",
          recruiterName: recruiterName.trim() || undefined,
          outreachType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate outreach message.");
      }

      setOutreachMessage(data.data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Network error while generating outreach message.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyOutreach = () => {
    if (!outreachMessage) return;
    navigator.clipboard.writeText(outreachMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    outreachMessage,
    setOutreachMessage,
    isGenerating,
    error,
    copied,
    recruiterName,
    setRecruiterName,
    companyName,
    setCompanyName,
    outreachType,
    setOutreachType,
    handleGenerateOutreach,
    handleCopyOutreach,
  };
}
