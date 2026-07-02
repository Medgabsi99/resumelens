-- ═══════════════════════════════════════════════════════════════════════════════
-- ResumeLens — Migration 005
-- AI feature tables: salary negotiations, learning paths, mock interviews
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Salary Negotiations ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.salary_negotiations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title      TEXT        NOT NULL,
  company_name    TEXT        NOT NULL,
  scenario        TEXT        NOT NULL,
  initial_offer   JSONB       NOT NULL,
  final_offer     JSONB       NOT NULL,
  score           INTEGER     NOT NULL,
  verdict         TEXT        NOT NULL,
  feedback        JSONB       NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_negotiations_user_id    ON public.salary_negotiations(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_negotiations_created_at ON public.salary_negotiations(created_at DESC);

ALTER TABLE public.salary_negotiations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own salary_negotiations" ON public.salary_negotiations;
CREATE POLICY "Users can read own salary_negotiations"
  ON public.salary_negotiations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own salary_negotiations" ON public.salary_negotiations;
CREATE POLICY "Users can insert own salary_negotiations"
  ON public.salary_negotiations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own salary_negotiations" ON public.salary_negotiations;
CREATE POLICY "Users can delete own salary_negotiations"
  ON public.salary_negotiations FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on salary_negotiations" ON public.salary_negotiations;
CREATE POLICY "Service role full access on salary_negotiations"
  ON public.salary_negotiations FOR ALL
  USING (auth.role() = 'service_role');


-- ─── 2. Learning Paths ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title       TEXT        NOT NULL,
  company_name     TEXT        NOT NULL,
  missing_skills   TEXT[]      NOT NULL,
  project_details  JSONB       NOT NULL,
  learning_path    JSONB       NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id    ON public.learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_at ON public.learning_paths(created_at DESC);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own learning_paths" ON public.learning_paths;
CREATE POLICY "Users can read own learning_paths"
  ON public.learning_paths FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own learning_paths" ON public.learning_paths;
CREATE POLICY "Users can insert own learning_paths"
  ON public.learning_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own learning_paths" ON public.learning_paths;
CREATE POLICY "Users can delete own learning_paths"
  ON public.learning_paths FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on learning_paths" ON public.learning_paths;
CREATE POLICY "Service role full access on learning_paths"
  ON public.learning_paths FOR ALL
  USING (auth.role() = 'service_role');


-- ─── 3. Mock Interviews ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title       TEXT        NOT NULL,
  company_name     TEXT        NOT NULL,
  interview_type   TEXT        NOT NULL,
  difficulty       TEXT        NOT NULL,
  questions        TEXT[]      NOT NULL,
  transcripts      JSONB       NOT NULL,
  overall_score    INTEGER     NOT NULL,
  star_mastery     INTEGER     NOT NULL,
  filler_words     JSONB       NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id    ON public.mock_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_created_at ON public.mock_interviews(created_at DESC);

ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own mock_interviews" ON public.mock_interviews;
CREATE POLICY "Users can read own mock_interviews"
  ON public.mock_interviews FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mock_interviews" ON public.mock_interviews;
CREATE POLICY "Users can insert own mock_interviews"
  ON public.mock_interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mock_interviews" ON public.mock_interviews;
CREATE POLICY "Users can delete own mock_interviews"
  ON public.mock_interviews FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on mock_interviews" ON public.mock_interviews;
CREATE POLICY "Service role full access on mock_interviews"
  ON public.mock_interviews FOR ALL
  USING (auth.role() = 'service_role');
