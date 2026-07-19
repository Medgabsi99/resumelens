/**
 * contextual.ts — Contextual Retrieval (Anthropic, Sept 2024)
 *
 * Problem: when chunks are extracted from a resume, they lose their surrounding
 * context. A chunk that says "Led team of 8 engineers to cut deploy time by 40%"
 * gives no signal about *which company*, *which role*, or *which year* — making
 * retrieval fragile for follow-up questions like "tell me more about your work
 * at Stripe" or "what did you achieve in 2022?".
 *
 * Solution: before embedding, prepend a 1-sentence LLM-generated context to
 * each chunk situating it within the full resume. The embedding then encodes
 * BOTH the section content AND its position in the candidate's story.
 *
 * Anthropic reported: 49% reduction in retrieval failures with this technique.
 * Reference: https://www.anthropic.com/news/contextual-retrieval
 *
 * Implementation details:
 *  - Single batched gemini-2.5 call for all chunks (efficient — not one call/chunk)
 *  - Context generation uses the full resume text as reference
 *  - Original chunk content is preserved in the DB for display
 *  - Only the embedding uses the contextualized version
 *  - Rule-based fallback when LLM call fails
 */

import { contextModel } from "./client";
import type { ResumeChunk } from "./chunker";
import logger from "@/lib/logger";

/** Maximum characters of the resume to pass as context reference */
const MAX_RESUME_CONTEXT_CHARS = 4_000;

/** Maximum characters of each chunk to include in the context prompt */
const MAX_CHUNK_PREVIEW_CHARS = 500;

export interface ContextualizedChunk extends ResumeChunk {
  /** 1-sentence LLM-generated context prefix, or "" if unavailable */
  contextPrefix: string;
  /**
   * Full text to embed: `contextPrefix + "\n\n" + content`
   * This is what gets sent to text-embedding-004 — NOT the raw content.
   */
  embeddingText: string;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Enrich resume chunks with LLM-generated context prefixes (Contextual Retrieval).
 * Uses a single batched gemini-2.5 call for all chunks.
 * Falls back to rule-based context if LLM fails.
 */
export async function contextualizeChunks(
  fullResumeText: string,
  chunks: ResumeChunk[]
): Promise<ContextualizedChunk[]> {
  if (chunks.length === 0) return [];

  try {
    const contexts = await generateContextsBatch(fullResumeText, chunks);
    logger.info(`[contextual] Generated ${contexts.length} context prefixes`);

    return chunks.map((chunk, i) => {
      const contextPrefix = (contexts[i] ?? "").trim();
      return buildContextualizedChunk(chunk, contextPrefix);
    });
  } catch (err) {
    logger.warn(
      "[contextual] Batch context generation failed, using rule-based fallback:",
      err
    );
    return chunks.map((chunk) =>
      buildContextualizedChunk(chunk, ruleBasedContext(chunk))
    );
  }
}

// ─── LLM batch context generation ────────────────────────────────────────────

async function generateContextsBatch(
  fullResumeText: string,
  chunks: ResumeChunk[]
): Promise<string[]> {
  const resumeSnippet = fullResumeText.slice(0, MAX_RESUME_CONTEXT_CHARS);

  const chunksText = chunks
    .map(
      (c, i) =>
        `CHUNK ${i + 1} [section: ${c.type}]:\n${c.content.slice(0, MAX_CHUNK_PREVIEW_CHARS)}`
    )
    .join("\n\n---\n\n");

  const prompt = `Here is a candidate's resume (truncated for context):

<resume>
${resumeSnippet}
</resume>

For each numbered chunk below, write ONE sentence (max 20 words) that:
1. Names the section type (e.g. "From the Experience section")
2. Identifies the company/institution/role if visible in the resume
3. Gives the date range if identifiable

This helps a semantic search engine retrieve the right chunk for user questions.

Return ONLY a JSON array of strings, one per chunk, in order.
Example: ["From the Experience section at Google (2020–2022), Senior SWE role.", "From the Skills section listing programming languages."]

<chunks>
${chunksText}
</chunks>`;

  const result = await contextModel.generateContent(prompt);
  const raw = result.response.text().trim();
  const clean = raw.replace(/^```json\s*|^```\s*|```$/gm, "").trim();

  const parsed: unknown = JSON.parse(clean);
  if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
  if (parsed.length !== chunks.length) {
    throw new Error(
      `Expected ${chunks.length} contexts, got ${parsed.length}`
    );
  }

  return (parsed as unknown[]).map((c) =>
    String(c ?? "").slice(0, 250).trim()
  );
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────

/**
 * When LLM generation fails, produce a generic but still useful context prefix
 * based solely on the chunk's detected section type.
 */
function ruleBasedContext(chunk: ResumeChunk): string {
  const labels: Record<string, string> = {
    contact: "From the Contact section: personal details and links.",
    summary: "From the Summary section: professional overview and career goals.",
    experience:
      "From the Experience section: employment history and work achievements.",
    education:
      "From the Education section: degrees, institutions, and academic history.",
    skills:
      "From the Skills section: technical skills, tools, and competencies.",
    projects:
      "From the Projects section: personal or professional portfolio work.",
    certifications:
      "From the Certifications section: credentials and professional training.",
    awards:
      "From the Awards/Achievements section: recognition and accomplishments.",
    other: "From an additional section of the resume.",
  };
  return labels[chunk.type] ?? "From the candidate's resume.";
}

// ─── Builder ──────────────────────────────────────────────────────────────────

function buildContextualizedChunk(
  chunk: ResumeChunk,
  contextPrefix: string
): ContextualizedChunk {
  const embeddingText = contextPrefix
    ? `${contextPrefix}\n\n${chunk.content}`
    : chunk.content;

  return { ...chunk, contextPrefix, embeddingText };
}
