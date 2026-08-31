import type { AnalysisResult } from "@/types";
import { model } from "./client";
import { buildAnalysisPrompt } from "./analyze";
import { extractCleanJson } from "@/lib/cleanJson";
import { AnalysisResultSchema } from "@/lib/schemas/ai";
import { runAtsChecks } from "@/lib/atsRulesChecker";
import { logger } from "@/lib/logger";

/**
 * Formats a Server-Sent Event (SSE) payload string.
 */
export function formatSseEvent(event: string, data: unknown): string {
  const serialized = typeof data === "string" ? data : JSON.stringify(data);
  return `event: ${event}\ndata: ${serialized}\n\n`;
}

export type SseCallback = (event: string, data: unknown) => void;

/**
 * Executes a streaming resume analysis pipeline:
 * 1. Emits deterministic ATS checks immediately (T+100ms)
 * 2. Streams raw LLM tokens and intermediate state as Gemini generates them
 * 3. Validates final output against Zod schema and emits completion event
 */
export async function streamAnalyzeResume(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
  onEvent?: SseCallback
): Promise<AnalysisResult> {
  // ── Step 1: Immediate Deterministic Checks (T + 100ms) ────────
  const atsRules = runAtsChecks(resumeText, targetRole);
  if (onEvent) {
    onEvent("deterministic", {
      ats_rules: atsRules,
      deterministicScore: atsRules.deterministicScore,
    });
  }

  // ── Step 2: Stream LLM Generation ─────────────────────────────
  const prompt = buildAnalysisPrompt(resumeText, jobDescription, targetRole);
  let accumulatedText = "";

  try {
    const responseStream = await model.generateContentStream(prompt);

    for await (const chunk of responseStream.stream) {
      const textChunk = chunk.text();
      accumulatedText += textChunk;

      if (onEvent) {
        onEvent("token", { chunk: textChunk });
      }
    }
  } catch (err: unknown) {
    logger.error("Error during streaming LLM generation:", err);
    throw err;
  }

  // ── Step 3: Parse and Validate Final Result ────────────────────
  const parsed = extractCleanJson<Record<string, unknown>>(accumulatedText);
  if (!parsed) {
    throw new Error("Failed to parse valid JSON from streaming AI response");
  }

  // Ensure deterministic rules are attached
  parsed.ats_rules = atsRules;

  const validated = AnalysisResultSchema.parse(parsed) as AnalysisResult;

  if (onEvent) {
    onEvent("complete", validated);
  }

  return validated;
}
