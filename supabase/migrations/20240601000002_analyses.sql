-- ═══════════════════════════════════════════════════════════════════════════════
-- ResumeLens — Migration 002
-- Analyses table: resume analysis results, RLS, indexes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.analyses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score            INTEGER     NOT NULL,
  result_json      TEXT        NOT NULL,   -- full AnalysisResult JSON
  target_role      TEXT,
  resume_text      TEXT,                   -- raw extracted resume text (for history)
  job_description  TEXT,                   -- job description used (if any)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id    ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own analyses" ON public.analyses;
CREATE POLICY "Users can read own analyses"
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

DROP POLICY IF EXISTS "Service role full access on analyses" ON public.analyses;
CREATE POLICY "Service role full access on analyses"
  ON public.analyses FOR ALL
  USING (auth.role() = 'service_role');
