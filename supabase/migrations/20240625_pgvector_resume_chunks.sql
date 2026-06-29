-- ═══════════════════════════════════════════════════════════════════════════════
-- ResumeLens — pgvector migration v3
-- Features: HNSW index, contextual storage, hybrid BM25+dense search with RRF,
--           analysis-scoped retrieval, chunk_type pre-filtering
--
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Table
CREATE TABLE IF NOT EXISTS resume_chunks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id     UUID        REFERENCES analyses(id)  ON DELETE CASCADE,
  resume_id       UUID        REFERENCES resumes(id)   ON DELETE CASCADE,
  chunk_index     INTEGER     NOT NULL,
  chunk_type      TEXT        NOT NULL,   -- 'contact'|'summary'|'experience'|'education'|'skills'|'projects'|'certifications'|'awards'|'other'
  content         TEXT        NOT NULL,   -- original readable content (stored, displayed)
  context_prefix  TEXT,                   -- LLM-generated context sentence (Contextual Retrieval)
  embedding       vector(768),            -- embedding of (context_prefix + content)
  metadata        JSONB       DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add tsvector generated column for BM25 (hybrid search)
--    Uses ENGLISH stemming; stored so the GIN index is maintained automatically.
ALTER TABLE resume_chunks
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

-- 4a. HNSW index — correct for dynamic user datasets (no minimum rows like IVFFlat)
--     m=16: connectivity per node  |  ef_construction=64: build-time recall quality
CREATE INDEX IF NOT EXISTS resume_chunks_embedding_hnsw_idx
  ON resume_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4b. GIN index for BM25 full-text search
CREATE INDEX IF NOT EXISTS resume_chunks_fts_idx
  ON resume_chunks USING GIN (content_tsv);

-- 4c. Composite indexes for fast user/analysis scoped queries
CREATE INDEX IF NOT EXISTS resume_chunks_user_analysis_idx
  ON resume_chunks (user_id, analysis_id);

CREATE INDEX IF NOT EXISTS resume_chunks_user_type_idx
  ON resume_chunks (user_id, chunk_type);

-- 5. Row-Level Security
ALTER TABLE resume_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own resume chunks" ON resume_chunks;
CREATE POLICY "Users can manage own resume chunks"
  ON resume_chunks FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Pure semantic search (dense vector only)
--    Used as fallback when query_text is empty or BM25 returns nothing.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION match_resume_chunks(
  query_embedding    vector(768),
  match_user_id      UUID,
  match_count        INT   DEFAULT 5,
  match_threshold    FLOAT DEFAULT 0.3,
  filter_analysis_id UUID  DEFAULT NULL,
  filter_chunk_type  TEXT  DEFAULT NULL   -- pre-filter by section type (query routing)
)
RETURNS TABLE (
  id           UUID,
  content      TEXT,
  chunk_type   TEXT,
  analysis_id  UUID,
  similarity   FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.content,
    rc.chunk_type,
    rc.analysis_id,
    (1 - (rc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM resume_chunks rc
  WHERE rc.user_id = match_user_id
    AND rc.embedding IS NOT NULL
    AND (filter_analysis_id IS NULL OR rc.analysis_id = filter_analysis_id)
    AND (filter_chunk_type  IS NULL OR rc.chunk_type  = filter_chunk_type)
    AND (1 - (rc.embedding <=> query_embedding)) > match_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. Hybrid search: BM25 + Dense vector, merged with Reciprocal Rank Fusion (RRF)
--
--    RRF formula: score = Σ  1 / (k + rank_i)   for each retrieval channel i
--    k = 60  (standard from the original RRF paper, Cormack et al. 2009)
--
--    Why hybrid?
--    • Dense retrieval: catches semantic similarity, paraphrases, concept matches
--    • BM25 keyword: catches exact tech names ("Next.js 14"), company names, acronyms
--    • RRF fusion: promotes documents that rank well in BOTH channels
--      → better recall than either method alone
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION match_resume_chunks_hybrid(
  query_embedding    vector(768),
  query_text         TEXT,                  -- raw query for BM25 (plainto_tsquery)
  match_user_id      UUID,
  match_count        INT   DEFAULT 5,
  filter_analysis_id UUID  DEFAULT NULL,
  filter_chunk_type  TEXT  DEFAULT NULL
)
RETURNS TABLE (
  id           UUID,
  content      TEXT,
  chunk_type   TEXT,
  analysis_id  UUID,
  similarity   FLOAT                        -- RRF score (NOT cosine; higher = better)
)
LANGUAGE sql STABLE AS $$
  WITH
  -- ── Channel 1: dense semantic retrieval ─────────────────────────────────────
  semantic AS (
    SELECT rc.id,
           row_number() OVER (ORDER BY rc.embedding <=> query_embedding) AS rn,
           (1 - (rc.embedding <=> query_embedding))                      AS cos_sim
    FROM   resume_chunks rc
    WHERE  rc.user_id   = match_user_id
      AND  rc.embedding IS NOT NULL
      AND  (filter_analysis_id IS NULL OR rc.analysis_id = filter_analysis_id)
      AND  (filter_chunk_type  IS NULL OR rc.chunk_type  = filter_chunk_type)
    ORDER  BY rc.embedding <=> query_embedding
    LIMIT  20   -- candidate pool before RRF merging
  ),

  -- ── Channel 2: BM25 keyword retrieval ───────────────────────────────────────
  keyword AS (
    SELECT rc.id,
           row_number() OVER (
             ORDER BY ts_rank(rc.content_tsv, plainto_tsquery('english', query_text)) DESC
           ) AS rn
    FROM   resume_chunks rc
    WHERE  rc.user_id      = match_user_id
      AND  rc.content_tsv IS NOT NULL
      AND  rc.content_tsv @@ plainto_tsquery('english', query_text)
      AND  (filter_analysis_id IS NULL OR rc.analysis_id = filter_analysis_id)
      AND  (filter_chunk_type  IS NULL OR rc.chunk_type  = filter_chunk_type)
    LIMIT  20
  ),

  -- ── RRF merge ───────────────────────────────────────────────────────────────
  -- FULL OUTER JOIN preserves results from either channel
  -- RRF score sums contribution from both; 0 when absent from a channel
  rrf AS (
    SELECT
      COALESCE(s.id, k.id) AS id,
      -- k=60 from original RRF paper (Cormack et al., SIGIR 2009)
      COALESCE(1.0 / (60.0 + s.rn), 0.0) +
      COALESCE(1.0 / (60.0 + k.rn), 0.0) AS rrf_score,
      COALESCE(s.cos_sim, 0.0)            AS cos_sim
    FROM semantic s
    FULL OUTER JOIN keyword k ON s.id = k.id
  )

  SELECT rc.id, rc.content, rc.chunk_type, rc.analysis_id,
         rrf.rrf_score::FLOAT AS similarity
  FROM   rrf
  JOIN   resume_chunks rc ON rc.id = rrf.id
  ORDER  BY rrf.rrf_score DESC
  LIMIT  match_count;
$$;

-- ── Verification ───────────────────────────────────────────────────────────────
-- SELECT extname FROM pg_extension WHERE extname = 'vector';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'resume_chunks';
-- SELECT proname FROM pg_proc WHERE proname IN ('match_resume_chunks', 'match_resume_chunks_hybrid');
-- Quick smoke-test (replace with a real user UUID):
-- SELECT * FROM match_resume_chunks_hybrid(
--   (SELECT embedding FROM resume_chunks LIMIT 1),
--   'software engineer python aws',
--   '<your-user-uuid>',
--   5
-- );
