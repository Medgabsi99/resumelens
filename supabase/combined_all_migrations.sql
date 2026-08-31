-- ==============================================================================
-- ResumeLens — Complete Master Database Migration (All-in-One)
-- Run this entire script in Supabase Dashboard → SQL Editor → New Query → Run
-- ==============================================================================

-- ─── STEP 1: PROFILES & AUTH TRIGGERS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT        NOT NULL,
  plan             TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'one_time', 'monthly')),
  analyses_used    INTEGER     NOT NULL DEFAULT 0,
  analyses_limit   INTEGER     NOT NULL DEFAULT 2,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, analyses_used, analyses_limit)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'free',
    0,
    2
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_analyses_used(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET analyses_used = analyses_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── STEP 2: ANALYSES TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score            INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),
  result_json      TEXT        NOT NULL,
  target_role      TEXT,
  resume_text      TEXT,
  job_description  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.analyses;
CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analyses;
CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);


-- ─── STEP 3: RESUMES TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resumes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL DEFAULT 'Untitled Resume',
  raw_text         TEXT        NOT NULL DEFAULT '',
  structured_data  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_base          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;
CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);


-- ─── STEP 4: APPLICATIONS, JOB MATCHES, RESUME VERSIONS, PORTFOLIOS ───────────
CREATE TABLE IF NOT EXISTS public.applications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company          TEXT        NOT NULL,
  role             TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'applied', 'interviewing', 'offer', 'rejected', 'archived')),
  job_url          TEXT,
  job_description  TEXT,
  salary_range     TEXT,
  location         TEXT,
  notes            TEXT,
  applied_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own applications" ON public.applications;
CREATE POLICY "Users can manage own applications"
  ON public.applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.job_matches (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id        UUID        REFERENCES public.resumes(id) ON DELETE SET NULL,
  role_title       TEXT        NOT NULL,
  company_name     TEXT,
  job_description  TEXT        NOT NULL,
  match_score      INTEGER     NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  result_json      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own job matches" ON public.job_matches;
CREATE POLICY "Users can manage own job matches"
  ON public.job_matches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.resume_versions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id        UUID        NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_number   INTEGER     NOT NULL DEFAULT 1,
  raw_text         TEXT        NOT NULL DEFAULT '',
  structured_data  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  change_summary   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own resume versions" ON public.resume_versions;
CREATE POLICY "Users can manage own resume versions"
  ON public.resume_versions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.portfolios (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug             TEXT        NOT NULL UNIQUE,
  title            TEXT        NOT NULL DEFAULT 'My Portfolio',
  bio              TEXT,
  theme            TEXT        NOT NULL DEFAULT 'modern',
  data             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_published     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own portfolios" ON public.portfolios;
CREATE POLICY "Users can manage own portfolios"
  ON public.portfolios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view published portfolios" ON public.portfolios;
CREATE POLICY "Public can view published portfolios"
  ON public.portfolios FOR SELECT
  USING (is_published = TRUE);


-- ─── STEP 5: AI FEATURES (COVER LETTERS, INTERVIEWS, OUTREACH) ───────────────
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id   UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  company_name     TEXT        NOT NULL,
  role_title       TEXT        NOT NULL,
  content          TEXT        NOT NULL,
  tone             TEXT        NOT NULL DEFAULT 'professional',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cover letters" ON public.cover_letters;
CREATE POLICY "Users can manage own cover letters"
  ON public.cover_letters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.interview_prep (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id   UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  role_title       TEXT        NOT NULL,
  company_name     TEXT,
  questions        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.interview_prep ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own interview preps" ON public.interview_prep;
CREATE POLICY "Users can manage own interview preps"
  ON public.interview_prep FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.outreach_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id   UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  recipient_role   TEXT        NOT NULL DEFAULT 'Recruiter',
  company_name     TEXT        NOT NULL,
  message_text     TEXT        NOT NULL,
  channel          TEXT        NOT NULL DEFAULT 'linkedin',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own outreach messages" ON public.outreach_messages;
CREATE POLICY "Users can manage own outreach messages"
  ON public.outreach_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── STEP 6: PGVECTOR & RESUME CHUNKS (RAG PIPELINE) ─────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.resume_chunks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id     UUID        REFERENCES public.analyses(id)  ON DELETE CASCADE,
  resume_id       UUID        REFERENCES public.resumes(id)   ON DELETE CASCADE,
  chunk_index     INTEGER     NOT NULL,
  chunk_type      TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  context_prefix  TEXT,
  embedding       vector(768),
  metadata        JSONB       DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resume_chunks
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS resume_chunks_embedding_hnsw_idx
  ON public.resume_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS resume_chunks_fts_idx
  ON public.resume_chunks USING GIN (content_tsv);

CREATE INDEX IF NOT EXISTS resume_chunks_user_analysis_idx
  ON public.resume_chunks (user_id, analysis_id);

CREATE INDEX IF NOT EXISTS resume_chunks_user_type_idx
  ON public.resume_chunks (user_id, chunk_type);

ALTER TABLE public.resume_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own resume chunks" ON public.resume_chunks;
CREATE POLICY "Users can manage own resume chunks"
  ON public.resume_chunks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Hybrid Search RPC function for RAG
CREATE OR REPLACE FUNCTION match_resume_chunks_hybrid(
  query_text       TEXT,
  query_embedding  vector(768),
  match_user_id    UUID,
  match_count      INTEGER DEFAULT 6,
  match_analysis_id UUID   DEFAULT NULL,
  dense_weight     FLOAT   DEFAULT 0.7,
  rrf_k            INTEGER DEFAULT 60
)
RETURNS TABLE (
  id             UUID,
  chunk_index    INTEGER,
  chunk_type     TEXT,
  content        TEXT,
  context_prefix TEXT,
  similarity     FLOAT,
  metadata       JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dense AS (
    SELECT
      rc.id,
      ROW_NUMBER() OVER (
        ORDER BY rc.embedding <=> query_embedding
      ) AS rank_dense,
      1 - (rc.embedding <=> query_embedding) AS dense_sim
    FROM resume_chunks rc
    WHERE rc.user_id = match_user_id
      AND rc.embedding IS NOT NULL
      AND (match_analysis_id IS NULL OR rc.analysis_id = match_analysis_id)
    ORDER BY rc.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  sparse AS (
    SELECT
      rc.id,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank(rc.content_tsv, websearch_to_tsquery('english', query_text)) DESC
      ) AS rank_sparse
    FROM resume_chunks rc
    WHERE rc.user_id = match_user_id
      AND rc.content_tsv @@ websearch_to_tsquery('english', query_text)
      AND (match_analysis_id IS NULL OR rc.analysis_id = match_analysis_id)
    ORDER BY ts_rank(rc.content_tsv, websearch_to_tsquery('english', query_text)) DESC
    LIMIT match_count * 2
  ),
  fused AS (
    SELECT
      COALESCE(d.id, s.id) AS id,
      (
        COALESCE(dense_weight       / (rrf_k + d.rank_dense),  0.0) +
        COALESCE((1 - dense_weight) / (rrf_k + s.rank_sparse), 0.0)
      ) AS rrf_score,
      COALESCE(d.dense_sim, 0.0) AS dense_sim
    FROM dense d
    FULL OUTER JOIN sparse s ON d.id = s.id
  )
  SELECT
    rc.id,
    rc.chunk_index,
    rc.chunk_type,
    rc.content,
    rc.context_prefix,
    f.rrf_score::FLOAT AS similarity,
    rc.metadata
  FROM fused f
  JOIN resume_chunks rc ON rc.id = f.id
  ORDER BY f.rrf_score DESC
  LIMIT match_count;
END;
$$;


-- ─── STEP 7: PERFORMANCE INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS analyses_user_id_created_at_idx ON public.analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS resumes_user_id_updated_at_idx ON public.resumes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS applications_user_id_status_idx ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS job_matches_user_id_created_at_idx ON public.job_matches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cover_letters_user_id_created_at_idx ON public.cover_letters(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS interview_prep_user_id_created_at_idx ON public.interview_prep(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_messages_user_id_created_at_idx ON public.outreach_messages(user_id, created_at DESC);
