#!/usr/bin/env node
/**
 * tools/backfill-embeddings.mjs
 *
 * Re-embeds every row in `resume_chunks` using the current embedding model
 * (gemini-2.5-embedding-001, truncated + normalized to 768 dims — matches
 * src/lib/ai/embeddings.ts exactly).
 *
 * WHY THIS EXISTS:
 * Any row created before the text-embedding-004 shutdown (Jan 14, 2026) is
 * still 768-dimensional, so it will NOT error against the current schema —
 * but it's from a completely different, incompatible embedding space than
 * rows created after the switch to gemini-2.5-embedding-001. Mixing the two in
 * the same similarity search silently returns wrong rankings, with no
 * error anywhere to flag it. This script re-embeds everything so the whole
 * table is consistent again.
 *
 * It reconstructs the exact text that was originally embedded
 * (context_prefix + "\n\n" + content, matching contextual.ts's
 * buildContextualizedChunk), so no LLM contextualization calls are needed —
 * only embedding calls. Cheap and fast.
 *
 * SAFE BY DEFAULT: without --yes this only reports what it would do.
 *
 * Usage:
 *   node --env-file=.env.local tools/backfill-embeddings.mjs           # dry run (counts only)
 *   node --env-file=.env.local tools/backfill-embeddings.mjs --yes     # actually re-embed + update
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — intentional, this is
 * an admin maintenance script, never expose this key anywhere client-side).
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

const EMBEDDING_MODEL = "gemini-2.5-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const DB_BATCH_SIZE = 25; // rows per gemini-2.5 batchEmbedContents call — well under the 100 limit
const DRY_RUN = !process.argv.includes("--yes");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GOOGLE_AI_API_KEY) {
  console.error(
    "Missing required env vars. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_AI_API_KEY.\n" +
    "Run with: node --env-file=.env.local tools/backfill-embeddings.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

function l2Normalize(vec) {
  let sumSquares = 0;
  for (let i = 0; i < vec.length; i++) sumSquares += vec[i] * vec[i];
  const norm = Math.sqrt(sumSquares);
  return norm === 0 ? vec : vec.map((v) => v / norm);
}

function buildEmbeddingText(contextPrefix, content) {
  return contextPrefix ? `${contextPrefix}\n\n${content}` : content;
}

async function embedBatchWithRetry(texts, attempt = 1) {
  try {
    const result = await embeddingModel.batchEmbedContents({
      requests: texts.map((text) => ({
        content: { parts: [{ text }], role: "user" },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBEDDING_DIMENSIONS,
      })),
    });
    return result.embeddings.map((e) =>
      e.values.length > 0 ? l2Normalize(e.values) : new Array(EMBEDDING_DIMENSIONS).fill(0)
    );
  } catch (err) {
    const transient = /429|503|overloaded|unavailable/i.test(String(err));
    if (transient && attempt < 4) {
      const delay = attempt * 2000;
      console.warn(`  Transient error, retrying in ${delay}ms (attempt ${attempt}/3)...`);
      await new Promise((r) => setTimeout(r, delay));
      return embedBatchWithRetry(texts, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  console.log(`Fetching resume_chunks rows...`);

  const { count, error: countError } = await supabase
    .from("resume_chunks")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Failed to count rows:", countError.message);
    process.exit(1);
  }

  if (!count || count === 0) {
    console.log("resume_chunks is empty — nothing to backfill.");
    return;
  }

  const { data: sample } = await supabase
    .from("resume_chunks")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1);
  const { data: sampleNewest } = await supabase
    .from("resume_chunks")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  console.log(`Found ${count} row(s).`);
  console.log(`  Oldest: ${sample?.[0]?.created_at ?? "n/a"}`);
  console.log(`  Newest: ${sampleNewest?.[0]?.created_at ?? "n/a"}`);

  if (DRY_RUN) {
    console.log(
      "\nDry run only — no changes made. Re-run with --yes to actually re-embed all rows above."
    );
    return;
  }

  console.log(`\nRe-embedding ${count} rows in batches of ${DB_BATCH_SIZE}...\n`);

  let processed = 0;
  let failedIds = [];
  let from = 0;

  while (from < count) {
    const { data: rows, error } = await supabase
      .from("resume_chunks")
      .select("id, content, context_prefix")
      .order("created_at", { ascending: true })
      .range(from, from + DB_BATCH_SIZE - 1);

    if (error) {
      console.error(`Failed to fetch batch at offset ${from}:`, error.message);
      break;
    }
    if (!rows || rows.length === 0) break;

    const texts = rows.map((r) => buildEmbeddingText(r.context_prefix, r.content));

    try {
      const newEmbeddings = await embedBatchWithRetry(texts);

      for (let i = 0; i < rows.length; i++) {
        const { error: updateError } = await supabase
          .from("resume_chunks")
          .update({ embedding: newEmbeddings[i] })
          .eq("id", rows[i].id);

        if (updateError) {
          console.error(`  Failed to update row ${rows[i].id}: ${updateError.message}`);
          failedIds.push(rows[i].id);
        } else {
          processed++;
        }
      }

      console.log(`  Batch [${from}-${from + rows.length - 1}] done. (${processed}/${count} total)`);
    } catch (err) {
      console.error(`  Batch [${from}-${from + rows.length - 1}] failed entirely:`, err.message || err);
      failedIds.push(...rows.map((r) => r.id));
    }

    from += DB_BATCH_SIZE;
  }

  console.log(`\nDone. ${processed}/${count} rows re-embedded successfully.`);
  if (failedIds.length > 0) {
    console.log(`${failedIds.length} row(s) failed — ids:`);
    console.log(failedIds.join("\n"));
    console.log("Re-run the script to retry; already-succeeded rows will just be re-embedded again (harmless).");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
