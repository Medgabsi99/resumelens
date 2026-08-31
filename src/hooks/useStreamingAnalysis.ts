"use client";

import { useState, useCallback, useRef } from "react";
import type { AnalysisResult, AtsRulesResult } from "@/types";

export type StreamingStage = "idle" | "deterministic" | "streaming" | "complete" | "error";

export interface StreamingAnalysisState {
  isStreaming: boolean;
  stage: StreamingStage;
  progress: number;
  atsRules: AtsRulesResult | null;
  analysisId: string | null;
  result: AnalysisResult | null;
  error: string | null;
}

export function useStreamingAnalysis() {
  const [state, setState] = useState<StreamingAnalysisState>({
    isStreaming: false,
    stage: "idle",
    progress: 0,
    atsRules: null,
    analysisId: null,
    result: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const startStreamingAnalysis = useCallback(
    async (params: {
      resumeText: string;
      jobDescription?: string;
      targetRole?: string;
      onComplete?: (result: AnalysisResult, analysisId?: string) => void;
      onError?: (error: string) => void;
    }) => {
      cancelStream();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState({
        isStreaming: true,
        stage: "deterministic",
        progress: 15,
        atsRules: null,
        analysisId: null,
        result: null,
        error: null,
      });

      try {
        const response = await fetch("/api/analyze/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: params.resumeText,
            jobDescription: params.jobDescription,
            targetRole: params.targetRole,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Stream failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response stream body available");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            if (!block.trim()) continue;

            const eventMatch = block.match(/^event:\s*(\w+)/m);
            const dataMatch = block.match(/^data:\s*(.+)$/m);

            if (!eventMatch || !dataMatch) continue;

            const eventType = eventMatch[1];
            let data: unknown;
            try {
              data = JSON.parse(dataMatch[1]);
            } catch {
              data = dataMatch[1];
            }

            if (eventType === "deterministic") {
              const payload = data as { ats_rules: AtsRulesResult };
              setState((s) => ({
                ...s,
                stage: "streaming",
                progress: 35,
                atsRules: payload.ats_rules,
              }));
            } else if (eventType === "token") {
              setState((s) => ({
                ...s,
                stage: "streaming",
                progress: Math.min(85, s.progress + 2),
              }));
            } else if (eventType === "complete") {
              const fullResult = data as AnalysisResult;
              setState((s) => ({
                ...s,
                progress: 95,
                result: fullResult,
              }));
            } else if (eventType === "done") {
              const donePayload = data as { finalResult: AnalysisResult; analysisId?: string };
              setState((s) => ({
                ...s,
                isStreaming: false,
                stage: "complete",
                progress: 100,
                result: donePayload.finalResult,
                analysisId: donePayload.analysisId || null,
              }));

              params.onComplete?.(donePayload.finalResult, donePayload.analysisId);
            } else if (eventType === "error") {
              const errPayload = data as { message?: string };
              throw new Error(errPayload.message || "Streaming analysis error");
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;

        const errMsg = (err as Error).message || "Streaming analysis failed";
        setState((s) => ({
          ...s,
          isStreaming: false,
          stage: "error",
          error: errMsg,
        }));
        params.onError?.(errMsg);
      }
    },
    [cancelStream]
  );

  return {
    ...state,
    startStreamingAnalysis,
    cancelStream,
  };
}
