import { useState } from "react";

interface UseSelectionOptimizerArgs {
  text: string;
  targetRole?: string;
  jobDescription?: string;
  setText: (t: string) => void;
  setParsedData: (d: null) => void;
  setIsEnhanced: (v: boolean) => void;
}

export function useSelectionOptimizer({
  text,
  targetRole,
  jobDescription,
  setText,
  setParsedData,
  setIsEnhanced,
}: UseSelectionOptimizerArgs) {
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [bubbleCoords, setBubbleCoords] = useState<{ top: number; left: number } | null>(null);
  const [showOptimizerBubble, setShowOptimizerBubble] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedAlternatives, setOptimizedAlternatives] = useState<{
    metricDriven: string;
    actionFocused: string;
    skillsTargeted: string;
  } | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start !== end) {
      const selected = el.value.slice(start, end).trim();
      if (selected.length > 3 && selected.length < 500) {
        setSelectedText(selected);
        setSelectionRange({ start, end });

        const linesBefore = el.value.slice(0, start).split("\n").length;
        const totalLines = el.value.split("\n").length || 1;
        const textareaHeight = el.offsetHeight || 400;
        const calculatedTop = Math.max(10, Math.min(textareaHeight - 120, (linesBefore / totalLines) * textareaHeight));

        setBubbleCoords({ top: calculatedTop, left: el.offsetWidth - 230 });

        if (!isOptimizing) {
          setOptimizedAlternatives(null);
          setOptimizeError(null);
          setShowOptimizerBubble(true);
        }
        return;
      }
    }

    if (!isOptimizing && !optimizedAlternatives) {
      setShowOptimizerBubble(false);
    }
  };

  const handleOptimizeBullet = async () => {
    if (!selectedText.trim()) return;
    setIsOptimizing(true);
    setOptimizeError(null);
    setOptimizedAlternatives(null);

    try {
      const res = await fetch("/api/optimize-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, targetRole, jobDescription }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate alternatives");
      setOptimizedAlternatives(data.alternatives);
    } catch (err: unknown) {
      setOptimizeError((err as Error).message || "Something went wrong optimizing");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyAlternative = (alternative: string) => {
    if (!selectionRange) return;
    const newText = text.slice(0, selectionRange.start) + alternative + text.slice(selectionRange.end);
    setText(newText);

    setShowOptimizerBubble(false);
    setOptimizedAlternatives(null);
    setSelectedText("");
    setSelectionRange(null);

    // Clear parsedData so preview re-parses with the new text
    setParsedData(null);
    setIsEnhanced(false);
  };

  return {
    selectedText,
    bubbleCoords,
    showOptimizerBubble, setShowOptimizerBubble,
    isOptimizing,
    optimizedAlternatives,
    optimizeError,
    handleTextareaSelect,
    handleOptimizeBullet,
    handleApplyAlternative,
    closeOptimizer: () => {
      setShowOptimizerBubble(false);
      setOptimizedAlternatives(null);
      setSelectionRange(null);
    },
  };
}
