import { createAdminClient } from "@/lib/supabase-server";
import { chunkResume } from "@/lib/ai/chunker";
import { contextualizeChunks } from "@/lib/ai/contextual";
import { embedBatch } from "@/lib/ai/embeddings";
import logger from "@/lib/logger";

export interface EmbedOptions {
  userId: string;
  resumeText: string;
  analysisId?: string;
  resumeId?: string;
}

export interface EmbedResult {
  success: boolean;
  chunksCreated: number;
  error?: string;
}

/**
 * Core server-side embedding pipeline for RAG (Contextual Retrieval + Batch Embeddings + pgvector).
 *
 * Can be safely called directly inside Route Handlers, Next.js `after()`, or background workers
 * without relying on an unawaited HTTP loopback fetch.
 */
export async function generateAndStoreEmbeddings({
  userId,
  resumeText,
  analysisId,
  resumeId,
}: EmbedOptions): Promise<EmbedResult> {
  if (!userId) {
    return { success: false, chunksCreated: 0, error: "userId is required" };
  }

  if (!resumeText || resumeText.trim().length < 100) {
    return { success: false, chunksCreated: 0, error: "resumeText must be ≥100 characters" };
  }

  const supabase = createAdminClient();

  try {
    // 1. Delete previous chunks for this analysis/resume scope to avoid duplicate vectors
    if (analysisId) {
      await supabase
        .from("resume_chunks")
        .delete()
        .eq("user_id", userId)
        .eq("analysis_id", analysisId);
    } else if (resumeId) {
      await supabase.from("resume_chunks").delete().eq("user_id", userId).eq("resume_id", resumeId);
    }

    // 2. Section-aware chunking
    const chunks = chunkResume(resumeText);
    if (chunks.length === 0) {
      logger.info(`[embedPipeline] No chunks extracted for user ${userId}`);
      return { success: true, chunksCreated: 0 };
    }

    // 3. Contextual Retrieval Enrichment (Anthropic 2024 technique)
    let contextualChunks;
    try {
      contextualChunks = await contextualizeChunks(resumeText, chunks);
    } catch (err) {
      logger.warn("[embedPipeline] Contextualization failed, falling back to raw content:", err);
      contextualChunks = chunks.map((c) => ({
        ...c,
        contextPrefix: "",
        embeddingText: c.content,
      }));
    }

    // 4. Batch Gemini vector embeddings (text-embedding-004)
    const embeddings = await embedBatch(
      contextualChunks.map((c) => c.embeddingText),
      "RETRIEVAL_DOCUMENT"
    );

    // 5. Build and insert rows into pgvector
    const rows = contextualChunks.map((chunk, i) => ({
      user_id: userId,
      analysis_id: analysisId ?? null,
      resume_id: resumeId ?? null,
      chunk_index: chunk.index,
      chunk_type: chunk.type,
      content: chunk.content,
      context_prefix: chunk.contextPrefix,
      embedding: embeddings[i],
      metadata: chunk.metadata,
    }));

    const { error: insertError } = await supabase.from("resume_chunks").insert(rows);

    if (insertError) {
      logger.error("[embedPipeline] pgvector insert failed:", insertError.message);
      return { success: false, chunksCreated: 0, error: insertError.message };
    }

    logger.info(`[embedPipeline] Successfully stored ${rows.length} chunks for user ${userId}`);
    return { success: true, chunksCreated: rows.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("[embedPipeline] Unexpected failure:", errorMsg);
    return { success: false, chunksCreated: 0, error: errorMsg };
  }
}
