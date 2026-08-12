import { useState, useEffect } from "react";

const DRAFT_KEY = "resumelens_active_draft_v1";

export interface DraftData {
  resumeText: string;
  jobDescription: string;
  targetRole: string;
  timestamp: number;
}

export function useAutoSaveDraft(resumeText: string, jobDescription: string, targetRole: string) {
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [savedDraft, setSavedDraft] = useState<DraftData | null>(null);

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DraftData;
        if (
          parsed.resumeText &&
          (parsed.resumeText.length > 50 || parsed.jobDescription?.length > 50)
        ) {
          setSavedDraft(parsed);
          setHasSavedDraft(true);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Debounced auto-save (saves 1.5s after typing stops)
  useEffect(() => {
    if (!resumeText.trim() && !jobDescription.trim()) return;

    const timer = setTimeout(() => {
      try {
        const draft: DraftData = {
          resumeText,
          jobDescription,
          targetRole,
          timestamp: Date.now(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Ignore
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [resumeText, jobDescription, targetRole]);

  const clearSavedDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasSavedDraft(false);
      setSavedDraft(null);
    } catch {
      // Ignore
    }
  };

  return { hasSavedDraft, savedDraft, clearSavedDraft };
}
