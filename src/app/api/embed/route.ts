import { createServerComponentClient } from "@/lib/supabase-server";
/**
 * POST /api/embed
 *
 * Full RAG embedding pipeline (2025-2026 standard):
 *  1. Chunk resume text into labelled sections (chunker.ts)
 *  2. Contextual Retrieval: enrich each chunk with a 1-sentence LLM context
 *     prefix that situates it in the full resume (Anthropic, 2024)
 *  3. Embed the CONTEXTUALIZED text via gemini-2.5 text-embedding-004
 *  4. Upsert into resume_chunks with context_prefix stored separately
 *
 * Called automatically (fire-and-forget) from /api/analyze after each analysis.
 *
 * Request body:
 *   { resumeText: string, analysisId?: string, resumeId?: string }
 *
 * Response:
 *   { success: true,  chunksCreated: number }
 *   { success: false, error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { chunkResume } from "@/lib/ai/chunker";
import { contextualizeChunks } from "@/lib/ai/contextual";
import { embedBatch } from "@/lib/ai/embeddings";
import logger from "@/lib/logger";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createServerComponentClient();
  // ── 1. Auth ───────────────────────────────────────────────
  const user = await requireUser();
  const userId = user.id;

  // ── 2. Parse body ─────────────────────────────────────────
  let body: { resumeText?: string; analysisId?: string; resumeId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { resumeText, analysisId, resumeId } = body;

  if (!resumeText || resumeText.trim().length < 100) {
    return NextResponse.json(
      { success: false, error: "resumeText is required and must be ≥100 characters" },
      { status: 400 }
    );
  }

  // ── 3. Delete old chunks for this scope ───────────────────
  if (analysisId) {
    await supabase.from("resume_chunks").delete()
      .eq("user_id", userId)
      .eq("analysis_id", analysisId);
  } else if (resumeId) {
    await supabase.from("resume_chunks").delete()
      .eq("user_id", userId)
      .eq("resume_id", resumeId);
  }

  // ── 4. Chunk ──────────────────────────────────────────────
  const chunks = chunkResume(resumeText);
  if (chunks.length === 0) {
    logger.info(`[embed] No chunks extracted for user ${userId}`);
    return NextResponse.json({ success: true, chunksCreated: 0 });
  }
  logger.info(`[embed] Chunked into ${chunks.length} sections for user ${userId}`);

  // ── 5. Contextual Retrieval enrichment ────────────────────
  // Each chunk gets a 1-sentence LLM context prefix before embedding.
  // e.g. "From the Experience section at Stripe (2021–2023), Senior Engineer role."
  // This is Anthropic's Contextual Retrieval technique (49% fewer retrieval failures).
  let contextualChunks;
  try {
    contextualChunks = await contextualizeChunks(resumeText, chunks);
    logger.info(`[embed] Contextualized ${contextualChunks.length} chunks`);
  } catch (err) {
    // Non-fatal: fall back to raw content if context generation fails
    logger.warn("[embed] Contextualization failed, embedding raw content:", err);
    contextualChunks = chunks.map((c) => ({
      ...c,
      contextPrefix: "",
      embeddingText: c.content,
    }));
  }

  // ── 6. Embed the CONTEXTUALIZED text ─────────────────────
  // We embed `embeddingText` (context + content) for better retrieval quality.
  // The original `content` is stored separately for display.
  let embeddings: number[][];
  try {
    embeddings = await embedBatch(
      contextualChunks.map((c) => c.embeddingText),
      "RETRIEVAL_DOCUMENT"
    );
  } catch (err) {
    logger.error("[embed] Batch embedding failed:", err);
    return NextResponse.json(
      { success: false, error: "Embedding generation failed" },
      { status: 500 }
    );
  }

  // ── 7. Upsert into resume_chunks ──────────────────────────
  const rows = contextualChunks.map((chunk, i) => ({
    user_id: userId,
    analysis_id: analysisId ?? null,
    resume_id: resumeId ?? null,
    chunk_index: chunk.index,
    chunk_type: chunk.type,
    content: chunk.content,          // original, readable
    context_prefix: chunk.contextPrefix,    // for debugging / display
    embedding: embeddings[i],          // of contextualized text
    metadata: chunk.metadata,
  }));

  const { error: insertError } = await supabase.from("resume_chunks").insert(rows);

  if (insertError) {
    logger.error("[embed] DB insert failed:", insertError.message);
    return NextResponse.json(
      { success: false, error: "Failed to store embeddings: " + insertError.message },
      { status: 500 }
    );
  }

  logger.info(`[embed] Stored ${rows.length} contextualized chunks for user ${userId}`);
  return NextResponse.json({ success: true, chunksCreated: rows.length });
}
