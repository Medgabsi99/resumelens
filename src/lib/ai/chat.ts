/**
 * chat.ts — RAG-powered resume chat (2025-2026 standard)
 *
 * Retrieval pipeline:
 *  1. routeQueryToChunkType()  → detect query intent → pre-filter chunk_type
 *  2. embedText(query, "RETRIEVAL_QUERY") → 768-dim vector
 *  3. retrieveHybrid()         → BM25 + dense + RRF (match_resume_chunks_hybrid)
 *     • Dense channel:  catches semantic paraphrases and concepts
 *     • BM25 channel:   catches exact tech names, company names, acronyms
 *     • RRF merge:      promotes chunks ranking well in both channels
 *  4. formatChunksForPrompt()  → labelled context block for LLM
 *  5. buildPrompt()            → injects retrieved context + conversation history
 *
 * Graceful fallback chain:
 *   Hybrid → Dense-only → Full-text stuffing (if no embeddings stored yet)
 *
 * History awareness:
 *   The last 4 messages are concatenated into the retrieval query so
 *   follow-up questions ("expand on that", "what about my second job?")
 *   retrieve the right chunks even without explicit keywords.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { withRetryAndTimeout, chatModel } from "./client";
import { embedText } from "./embeddings";
import {
  retrieveHybrid,
  hasEmbeddings,
  formatChunksForPrompt,
  routeQueryToChunkType,
} from "./retrieval";
import logger from "@/lib/logger";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── RAG streaming chat (primary) ────────────────────────────────────────────

/**
 * Stream a resume chat response using hybrid RAG retrieval.
 *
 * @param message        User's question
 * @param userId         Auth user ID (scopes vector search)
 * @param supabase       Authenticated Supabase client
 * @param resumeText     Full resume text — used as fallback if no embeddings
 * @param jobDescription Optional JD for additional context
 * @param targetRole     Optional target role hint
 * @param history        Prior conversation turns (last 6 used for context)
 * @param analysisId     Optional — scope retrieval to a specific analysis
 */
export async function chatWithResumeStream(
  message: string,
  userId: string,
  supabase: SupabaseClient,
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
  history?: ChatHistoryMessage[],
  analysisId?: string | null,
) {
  const contextBlock = await buildContext(
    message, userId, supabase, resumeText,
    jobDescription, targetRole, history, analysisId,
  );
  const prompt = buildPrompt(message, contextBlock, targetRole, history);
  return withRetryAndTimeout(() => chatModel.generateContentStream(prompt));
}

/**
 * Non-streaming variant.
 */
export async function chatWithResume(
  message: string,
  userId: string,
  supabase: SupabaseClient,
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
  history?: ChatHistoryMessage[],
  analysisId?: string | null,
): Promise<string> {
  const contextBlock = await buildContext(
    message, userId, supabase, resumeText,
    jobDescription, targetRole, history, analysisId,
  );
  const prompt = buildPrompt(message, contextBlock, targetRole, history);
  const result = await withRetryAndTimeout(() => chatModel.generateContent(prompt));
  return result.response.text().trim();
}

// ─── Context builder ──────────────────────────────────────────────────────────

async function buildContext(
  message: string,
  userId: string,
  supabase: SupabaseClient,
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
  history?: ChatHistoryMessage[],
  analysisId?: string | null,
): Promise<string> {

  // ── Attempt hybrid RAG retrieval ──────────────────────────
  try {
    const embeddingsExist = await hasEmbeddings(userId, supabase);

    if (embeddingsExist) {
      // Step 1: Query routing — detect intent and pre-filter by chunk type
      const routedChunkType = routeQueryToChunkType(message);
      if (routedChunkType) {
        logger.info(`[chat] Query routed to chunk_type="${routedChunkType}"`);
      }

      // Step 2: Build enriched retrieval query
      // Combine last 4 history messages + current message so follow-up questions
      // (e.g. "expand on that") still retrieve the right resume sections.
      const recentHistory = (history ?? [])
        .slice(-4)
        .map((h) => h.content)
        .join(" ");
      const queryText = recentHistory
        ? `${recentHistory} ${message}`
        : message;

      // Step 3: Embed with RETRIEVAL_QUERY task type
      const queryEmbedding = await embedText(queryText, "RETRIEVAL_QUERY");

      // Step 4: Hybrid retrieval — BM25 + dense vector + RRF
      // Falls back to dense-only automatically if hybrid RPC fails.
      const chunks = await retrieveHybrid(
        queryEmbedding,
        queryText,          // raw text for BM25 channel
        userId,
        supabase,
        5,                  // top-k after RRF merge
        analysisId,
        routedChunkType,    // query routing pre-filter (null = all types)
      );

      if (chunks.length > 0) {
        logger.info(
          `[chat] Hybrid RAG: ${chunks.length} chunks retrieved` +
          (routedChunkType ? ` (type=${routedChunkType})` : "") +
          ` — top score: ${chunks[0].similarity.toFixed(4)}`
        );

        let ctx = formatChunksForPrompt(chunks);
        if (jobDescription) {
          ctx += `\n\n[JOB DESCRIPTION]\n${jobDescription.slice(0, 2000)}\n[END JOB DESCRIPTION]`;
        }
        return ctx;
      }

      // If routing was too narrow, retry without chunk_type filter
      if (routedChunkType) {
        logger.info(`[chat] No results with type filter, retrying without routing`);
        const broader = await retrieveHybrid(
          queryEmbedding,
          queryText,
          userId,
          supabase,
          5,
          analysisId,
          null,   // remove chunk_type filter
        );

        if (broader.length > 0) {
          logger.info(`[chat] Broader retrieval found ${broader.length} chunks`);
          let ctx = formatChunksForPrompt(broader);
          if (jobDescription) {
            ctx += `\n\n[JOB DESCRIPTION]\n${jobDescription.slice(0, 2000)}\n[END JOB DESCRIPTION]`;
          }
          return ctx;
        }
      }

      logger.info("[chat] RAG: no chunks above threshold, falling back to full text");
    } else {
      logger.info("[chat] RAG: no embeddings stored yet, using full-text fallback");
    }
  } catch (err) {
    logger.warn("[chat] RAG retrieval error, falling back to full text:", err);
  }

  // ── Full-text fallback ────────────────────────────────────
  let ctx = `[RESUME]\n${resumeText.slice(0, 6000)}\n[END RESUME]`;
  if (targetRole) ctx += `\nTarget Role: ${targetRole}`;
  if (jobDescription) {
    ctx += `\n\n[JOB DESCRIPTION]\n${jobDescription.slice(0, 2000)}\n[END JOB DESCRIPTION]`;
  }
  return ctx;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  message: string,
  contextBlock: string,
  targetRole?: string,
  history?: ChatHistoryMessage[],
): string {
  const roleHint = targetRole
    ? ` The user is targeting the role: "${targetRole}".`
    : "";

  // Last 6 messages (3 turns) for follow-up awareness
  const historyBlock =
    history && history.length > 0
      ? "[CONVERSATION HISTORY]\n" +
        history
          .slice(-6)
          .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
          .join("\n") +
        "\n[END CONVERSATION HISTORY]\n\n"
      : "";

  return `You are an expert career coach and resume consultant.${roleHint}
Use ONLY the information provided in the retrieved context below to answer the question.
Be specific, actionable, and cite the exact experience or skills from the resume when relevant.
To ensure transparency and confidence, always link your claims back to specific parts of the resume by appending inline source citations matching the retrieved sections in square brackets, for example: [Experience - Stripe] or [Education - Stanford University].
If the context does not contain enough information to answer confidently, say so clearly.

${contextBlock}

${historyBlock}[USER QUESTION]
${message}
[END QUESTION]

Provide a concise, specific, and helpful answer based strictly on the above context, including inline source citations.`;
}
