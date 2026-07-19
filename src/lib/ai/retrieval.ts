/**
 * retrieval.ts
 *
 * Vector similarity search + hybrid retrieval via Supabase pgvector.
 *
 * Two retrieval modes:
 *  1. retrieveRelevantChunks() — pure dense (semantic) search via match_resume_chunks()
 *  2. retrieveHybrid()         — BM25 + dense + RRF via match_resume_chunks_hybrid()
 *                                Use this as the primary path (2025-2026 standard).
 *
 * Also provides:
 *  - routeQueryToChunkType(): metadata pre-filtering (query routing)
 *  - hasEmbeddings():          graceful fallback check
 *  - formatChunksForPrompt():  prompt formatting
 *  - aggregateSectionScores(): per-section similarity scores for job matching
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import logger from "@/lib/logger";
import { withRetryAndTimeout, rerankModel } from "./client";

export interface RetrievedChunk {
  id: string;
  content: string;
  chunk_type: string;
  analysis_id?: string;
  similarity: number;
}

// ─── Query routing — metadata pre-filtering ───────────────────────────────────

/**
 * Classify a query into a specific chunk type for pre-filtering.
 * Routing the query to the right chunk type significantly improves precision
 * and reduces noise from unrelated sections.
 *
 * Returns null for general queries → search across all chunk types.
 *
 * Examples:
 *   "What are my Python skills?" → "skills"
 *   "Tell me about my time at Google" → "experience"
 *   "Where did I study?" → "education"
 *   "How should I improve my resume?" → null (general)
 */
export function routeQueryToChunkType(
  query: string
): string | null {
  const q = query.toLowerCase();

  // Skills / tech
  if (/\b(skill|technology|tech|stack|programm|language|framework|tool|library|software|proficien|expertise|know|certif|cloud|devops|database|api)\b/.test(q)) {
    return "skills";
  }

  // Experience / work
  if (/\b(experience|work(ed)?|job|career|employ|compan|role|position|manag|engineer|develop|senior|junior|intern|freelanc|achiev|accomplish|built|led|team|project at)\b/.test(q)) {
    return "experience";
  }

  // Education
  if (/\b(educat|degree|university|college|school|gpa|academic|major|stud|graduate|bachelor|master|phd|diploma|coursework)\b/.test(q)) {
    return "education";
  }

  // Projects / portfolio
  if (/\b(project|portfolio|github|open.?source|side.?project|personal.?project|built|created|developed|demo)\b/.test(q)) {
    return "projects";
  }

  // Summary / overview
  if (/\b(summary|overview|background|profile|about|introduc|describe yourself|who are you|tell me about yourself)\b/.test(q)) {
    return "summary";
  }

  // Certifications
  if (/\b(certif|credential|license|accreditat|aws certif|google certif|microsoft certif)\b/.test(q)) {
    return "certifications";
  }

  return null; // general query — search all chunk types
}

// ─── RankGPT listwise reranking (2026 standard) ─────────────────────────────

/**
 * Listwise Reranking (RankGPT-style): uses gemini-2.5 to precisely score and rank
 * candidate chunks based on multi-dimensional relevance to the user's query.
 * Falls back to initial hybrid ranking if LLM call fails.
 */
export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  topK: number = 5,
): Promise<RetrievedChunk[]> {
  if (chunks.length <= 1) return chunks.slice(0, topK);

  try {
    const candidates = chunks.map((c) => ({
      id: c.id,
      chunk_type: c.chunk_type,
      content: c.content,
    }));

    const prompt = `Search Query: "${query}"

Candidate Chunks:
${JSON.stringify(candidates, null, 2)}

Evaluate the relevance of each candidate chunk to the query. Sort them from most relevant to least relevant. Return only the top ${topK} chunk IDs in a JSON object structure:
{
  "rankedIds": ["id1", "id2", ...]
}`;

    const result = await withRetryAndTimeout(() =>
      rerankModel.generateContent(prompt)
    );

    const raw = result.response.text();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as { rankedIds: string[] };

    if (Array.isArray(parsed.rankedIds) && parsed.rankedIds.length > 0) {
      const rankMap = new Map<string, number>();
      parsed.rankedIds.forEach((id, idx) => rankMap.set(id, idx));

      // Filter and sort chunks based on the reranked list
      const reranked = chunks
        .filter((c) => rankMap.has(c.id))
        .sort((a, b) => rankMap.get(a.id)! - rankMap.get(b.id)!);

      if (reranked.length > 0) {
        logger.info(`[retrieval] Reranked candidates. Top candidate ID: ${reranked[0].id}`);
        return reranked;
      }
    }
  } catch (err) {
    logger.warn("[retrieval] LLM reranking failed, falling back to database ordering:", err);
  }

  // Fallback to initial order
  return chunks.slice(0, topK);
}

// ─── Hybrid retrieval (primary path — 2025/2026 standard) ────────────────────

/**
 * Hybrid search: BM25 (keyword) + dense (semantic) merged via Reciprocal Rank Fusion,
 * followed by LLM-based Listwise Reranking for top-tier retrieval precision.
 *
 * Better than pure dense retrieval because:
 * - Dense: catches paraphrases and semantic similarity
 * - BM25:  catches exact tech names, company names, acronyms that dense misses
 * - RRF:   promotes chunks that rank well in BOTH channels
 * - Rerank: LLM-based listwise sorting isolates the absolute most relevant chunks.
 *
 * @param queryEmbedding  768-dim float vector of the search query (RETRIEVAL_QUERY task)
 * @param queryText       Raw query string for BM25 (passed to plainto_tsquery)
 * @param userId          User ID for row-level scoping
 * @param supabase        Authenticated Supabase client
 * @param k               Max results (default 5)
 * @param analysisId      Optional — scope to a specific analysis
 * @param chunkType       Optional — pre-filter to a specific section type (query routing)
 */
export async function retrieveHybrid(
  queryEmbedding: number[],
  queryText: string,
  userId: string,
  supabase: SupabaseClient,
  k: number = 5,
  analysisId?: string | null,
  chunkType?: string | null,
): Promise<RetrievedChunk[]> {
  try {
    // Fetch a larger candidate pool (up to 12 chunks) for LLM reranking
    const fetchLimit = Math.max(12, k * 2);

    const { data, error } = await supabase.rpc("match_resume_chunks_hybrid", {
      query_embedding: queryEmbedding,
      query_text: queryText,
      match_user_id: userId,
      match_count: fetchLimit,
      filter_analysis_id: analysisId ?? null,
      filter_chunk_type: chunkType ?? null,
    });

    if (error) {
      logger.warn("[retrieval] match_resume_chunks_hybrid RPC failed:", error.message);
      // Fall back to dense-only without reranking for speed in error paths
      return retrieveRelevantChunks(queryEmbedding, userId, supabase, k, 0.2, analysisId, chunkType);
    }

    if (!data || data.length === 0) return [];

    // Sort initially by similarity/RRF score
    const candidates = (data as RetrievedChunk[]).sort((a, b) => b.similarity - a.similarity);

    // Apply listwise LLM reranking to target the top k chunks
    return await rerankChunks(queryText, candidates, k);
  } catch (err) {
    logger.warn("[retrieval] Hybrid retrieval error, falling back to dense:", err);
    return retrieveRelevantChunks(queryEmbedding, userId, supabase, k, 0.2, analysisId, chunkType);
  }
}

// ─── Pure semantic retrieval (fallback / job-match use) ──────────────────────

/**
 * Pure cosine similarity search via match_resume_chunks().
 * Used as a fallback when hybrid search fails, and for job matching
 * (where the "query" is a full JD, not a short keyword query).
 */
export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  userId: string,
  supabase: SupabaseClient,
  k: number = 5,
  threshold: number = 0.3,
  analysisId?: string | null,
  chunkType?: string | null,
): Promise<RetrievedChunk[]> {
  try {
    const { data, error } = await supabase.rpc("match_resume_chunks", {
      query_embedding: queryEmbedding,
      match_user_id: userId,
      match_count: k,
      match_threshold: threshold,
      filter_analysis_id: analysisId ?? null,
      filter_chunk_type: chunkType ?? null,
    });

    if (error) {
      logger.warn("[retrieval] match_resume_chunks RPC failed:", error.message);
      return [];
    }

    if (!data || data.length === 0) return [];
    return (data as RetrievedChunk[]).sort((a, b) => b.similarity - a.similarity);
  } catch (err) {
    logger.warn("[retrieval] Unexpected retrieval error:", err);
    return [];
  }
}

// ─── Embeddings existence check ───────────────────────────────────────────────

/**
 * Returns true if the user has at least one stored embedding.
 * Used for graceful fallback in chat and job-match handlers.
 */
export async function hasEmbeddings(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from("resume_chunks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("embedding", "is", null)
      .limit(1);

    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

// ─── Prompt formatting ────────────────────────────────────────────────────────

/**
 * Format retrieved chunks into a context string for the LLM prompt.
 * Labels each chunk with its section type and similarity score.
 */
export function formatChunksForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  const lines = chunks.map((c) => {
    const simPct = Math.round(c.similarity * 100);
    return `[${c.chunk_type.toUpperCase()} — ${simPct}% relevance]\n${c.content}`;
  });

  return (
    "[RETRIEVED RESUME SECTIONS — ranked by relevance to your question]\n\n" +
    lines.join("\n\n---\n\n") +
    "\n\n[END RETRIEVED SECTIONS]"
  );
}

/**
 * Group retrieved chunks by section type and compute per-type average similarity.
 * Used by job matching to produce structured embedding scores.
 */
export function aggregateSectionScores(
  chunks: RetrievedChunk[]
): Record<string, number> {
  const groups: Record<string, number[]> = {};

  for (const chunk of chunks) {
    if (!groups[chunk.chunk_type]) groups[chunk.chunk_type] = [];
    groups[chunk.chunk_type].push(chunk.similarity);
  }

  const scores: Record<string, number> = {};
  for (const [type, sims] of Object.entries(groups)) {
    scores[type] = parseFloat(
      (sims.reduce((a, b) => a + b, 0) / sims.length).toFixed(3)
    );
  }

  return scores;
}
