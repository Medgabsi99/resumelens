/**
 * embeddings.ts
 *
 * Wraps Gemini `gemini-embedding-001`, truncated to 768 dimensions via
 * outputDimensionality (matches the `vector(768)` columns in
 * supabase/migrations/20240625_pgvector_resume_chunks.sql).
 *
 * NOTE: `text-embedding-004` was shut down by Google on Jan 14, 2026.
 * gemini-embedding-001 is the direct replacement, but its embedding space
 * is NOT compatible with text-embedding-004 — any rows already embedded
 * with the old model must be re-embedded, or similarity search will
 * silently return bad matches (no error, just wrong ranking).
 *
 * gemini-embedding-001 also does NOT auto-normalize truncated output the
 * way the newer gemini-embedding-2 does — Google's docs require manual
 * L2 normalization for any outputDimensionality other than the 3072
 * default, so we do that below before returning/storing vectors.
 *
 * Task types:
 *  - RETRIEVAL_DOCUMENT: for indexing resume chunks into the vector store
 *  - RETRIEVAL_QUERY:    for embedding user questions & job descriptions at query time
 *
 * Includes:
 *  - Exponential-backoff retry (429 / 503 rate-limit handling)
 *  - Batch embedding via batchEmbedContents (max 100 per call per Gemini limits)
 */

import { genAI } from "./client";
import logger from "@/lib/logger";

export type EmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "SEMANTIC_SIMILARITY";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

/**
 * L2-normalize a vector in place-safe fashion. Required for
 * gemini-embedding-001 whenever outputDimensionality !== 3072 (the model's
 * default). A zero vector (e.g. our empty-text placeholder) is returned
 * unchanged to avoid a divide-by-zero.
 */
function l2Normalize(vec: number[]): number[] {
  let sumSquares = 0;
  for (let i = 0; i < vec.length; i++) sumSquares += vec[i] * vec[i];
  const norm = Math.sqrt(sumSquares);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}
const MAX_BATCH_SIZE = 100; // Gemini API limit per batchEmbedContents call
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;

/** Gemini embedding model instance (singleton) */
const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

// ─── Single embedding ─────────────────────────────────────────────────────────

/**
 * Embed a single string and return the 768-dimensional float vector.
 * Use taskType RETRIEVAL_DOCUMENT when storing, RETRIEVAL_QUERY when searching.
 */
export async function embedText(
  text: string,
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    // Return a zero vector for empty text — avoids API errors
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const result = await embeddingModel.embedContent({
        content: { parts: [{ text: trimmed }], role: "user" },
        taskType: taskType as any, // SDK accepts string literals
        outputDimensionality: EMBEDDING_DIMENSIONS, // cast below; not in this SDK version's TS types
      } as any);
      return l2Normalize(result.embedding.values);
    } catch (err: any) {
      const isRateLimit =
        err?.status === 429 ||
        err?.status === 503 ||
        String(err?.message).includes("quota") ||
        String(err?.message).includes("rate");

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(`[embeddings] Rate limit hit, retrying in ${delay}ms (attempt ${attempt})`);
        await sleep(delay);
        continue;
      }

      logger.error("[embeddings] embedText failed:", err);
      throw err;
    }
  }
}

// ─── Batch embedding ──────────────────────────────────────────────────────────

/**
 * Embed multiple strings in a single batchEmbedContents call.
 * Automatically splits into batches of MAX_BATCH_SIZE.
 * Returns vectors in the same order as the input array.
 */
export async function embedBatch(
  texts: string[],
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: number[][] = [];

  // Process in chunks of MAX_BATCH_SIZE
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const batchResults = await embedBatchChunk(batch, taskType);
    results.push(...batchResults);

    // Small delay between batches to avoid rate limiting
    if (i + MAX_BATCH_SIZE < texts.length) {
      await sleep(200);
    }
  }

  return results;
}

async function embedBatchChunk(
  texts: string[],
  taskType: EmbeddingTaskType
): Promise<number[][]> {
  // Replace empty strings with a placeholder to avoid API errors
  const sanitized = texts.map((t) => t.trim() || " ");

  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const result = await embeddingModel.batchEmbedContents({
        requests: sanitized.map((text) => ({
          content: { parts: [{ text }], role: "user" },
          taskType: taskType as any,
          outputDimensionality: EMBEDDING_DIMENSIONS,
        })),
      } as any);

      return result.embeddings.map((e) => {
        // Empty inputs get the zero vector
        return e.values.length > 0
          ? l2Normalize(e.values)
          : new Array(EMBEDDING_DIMENSIONS).fill(0);
      });
    } catch (err: any) {
      const isRateLimit =
        err?.status === 429 ||
        err?.status === 503 ||
        String(err?.message).includes("quota");

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(`[embeddings] Batch rate limit, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      // Fall back to sequential on batch failure
      logger.warn("[embeddings] batchEmbedContents failed, falling back to sequential:", err);
      return sequentialEmbed(sanitized, taskType);
    }
  }
}

/** Sequential fallback — used when batch API fails */
async function sequentialEmbed(
  texts: string[],
  taskType: EmbeddingTaskType
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text, taskType));
    await sleep(150);
  }
  return results;
}

// ─── Cosine similarity (CPU-side, for small result sets) ──────────────────────

/**
 * Cosine similarity between two vectors. Returns value in [-1, 1].
 * Used for re-ranking retrieved chunks client-side if needed.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vector dimension mismatch");
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { EMBEDDING_DIMENSIONS };