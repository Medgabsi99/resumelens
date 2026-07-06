import { logger } from "@/lib/logger";
import { useState } from "react";

export function useInterviewPrep(
  resumeText?: string,
  jobDescription?: string,
  targetRole?: string
) {
  const [interviewQuestions, setInterviewQuestions] = useState<string | null>(null);
  const [isGeneratingIQ, setIsGeneratingIQ] = useState(false);
  const [iqError, setIqError] = useState<string | null>(null);

  // Mock Interview States
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [mockQuestions, setMockQuestions] = useState<string[]>([]);
  const [isFetchingMock, setIsFetchingMock] = useState(false);

  const handleGenerateInterviewQuestions = async () => {
    if (!resumeText) {
      setIqError("No resume text available to generate interview questions.");
      return;
    }

    setIsGeneratingIQ(true);
    setIqError(null);
    setInterviewQuestions("");

    try {
      const res = await fetch("/api/interviews/questions/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setIqError(data?.error || "Failed to generate interview questions.");
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
          setInterviewQuestions(accumulated);
        }
      }
    } catch (e: any) {
      logger.error(e);
      setIqError(e.message || "Network error while generating interview questions.");
    } finally {
      setIsGeneratingIQ(false);
    }
  };

  const handleStartMockInterview = async () => {
    if (!resumeText) return;

    if (mockQuestions.length > 0) {
      setShowMockInterview(true);
      return;
    }

    setIsFetchingMock(true);
    setIqError(null);

    try {
      const res = await fetch("/api/interviews/questions/structured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        throw new Error(data?.error || "Failed to generate mock questions.");
      }

      setMockQuestions(data.questions || []);
      setShowMockInterview(true);
    } catch (err: any) {
      logger.error(err);
      setIqError(err.message || "Failed to start mock interview.");
    } finally {
      setIsFetchingMock(false);
    }
  };

  return {
    interviewQuestions,
    isGeneratingIQ,
    iqError,
    setIqError,
    showMockInterview,
    setShowMockInterview,
    mockQuestions,
    isFetchingMock,
    handleGenerateInterviewQuestions,
    handleStartMockInterview,
  };
}
