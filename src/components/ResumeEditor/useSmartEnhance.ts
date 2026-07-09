import { useState } from "react";
import { ParsedResume } from "@/lib/parseResume";
import { TemplateId } from "./types";

interface UseSmartEnhanceArgs {
  text: string;
  targetRole?: string;
  setText: (t: string) => void;
  setParsedData: (d: ParsedResume | null) => void;
  setIsEnhanced: (v: boolean) => void;
  setSelectedTemplate: (id: TemplateId) => void;
  setSmartError: (err: string | null) => void;
}

const VALID_TEMPLATES: TemplateId[] = ["professional", "modern", "creative", "minimal", "executive"];

export function useSmartEnhance({
  text,
  targetRole,
  setText,
  setParsedData,
  setIsEnhanced,
  setSelectedTemplate,
  setSmartError,
}: UseSmartEnhanceArgs) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSmartGenerate = async () => {
    setIsGenerating(true);
    setSmartError(null);
    try {
      const res = await fetch("/api/smart-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text, targetRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");

      setParsedData(data.parsedResume);
      setIsEnhanced(true);

      if (data.enhancedText) setText(data.enhancedText);

      if (data.recommendedTemplate && VALID_TEMPLATES.includes(data.recommendedTemplate)) {
        setSelectedTemplate(data.recommendedTemplate as TemplateId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err as Error).message : "Smart generation failed";
      setSmartError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, handleSmartGenerate };
}
