-- ═══════════════════════════════════════════════════════════════════════════════
-- ResumeLens — Migration 004
-- Job matches, applications tracker, resume versions, and portfolios
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Job Matches ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_matches (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title        TEXT,
  company_name     TEXT,
  job_description  TEXT        NOT NULL,
  overall_score    INTEGER     NOT NULL,
  fit_verdict      TEXT        NOT NULL CHECK (fit_verdict IN ('strong', 'good', 'fair', 'weak')),
  result_json      TEXT        NOT NULL,   -- full JobMatchResult JSON
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_matches_user_id    ON public.job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_created_at ON public.job_matches(created_at DESC);

ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own job_matches" ON public.job_matches;
CREATE POLICY "Users can read own job_matches"
  ON public.job_matches FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own job_matches" ON public.job_matches;
CREATE POLICY "Users can insert own job_matches"
  ON public.job_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own job_matches" ON public.job_matches;
CREATE POLICY "Users can delete own job_matches"
  ON public.job_matches FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on job_matches" ON public.job_matches;
CREATE POLICY "Service role full access on job_matches"
  ON public.job_matches FOR ALL
  USING (auth.role() = 'service_role');


-- ─── 2. Applications Tracker ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name     TEXT        NOT NULL,
  job_title        TEXT        NOT NULL,
  job_url          TEXT,
  job_description  TEXT,
  status           TEXT        NOT NULL DEFAULT 'saved'
                   CHECK (status IN ('saved','applied','screening','interviewing','offer','rejected','withdrawn','accepted')),
  priority         TEXT        NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high')),
  location         TEXT,
  salary_min       INTEGER,
  salary_max       INTEGER,
  salary_currency  TEXT        DEFAULT 'USD',
  contact_name     TEXT,
  contact_email    TEXT,
  applied_at       TIMESTAMPTZ,
  deadline_at      TIMESTAMPTZ,
  follow_up_at     TIMESTAMPTZ,
  notes            TEXT,
  resume_id        UUID        REFERENCES public.resumes(id) ON DELETE SET NULL,
  match_score      INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id    ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status     ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_follow_up  ON public.applications(follow_up_at)
  WHERE follow_up_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_updated_at_trigger ON public.applications;
CREATE TRIGGER applications_updated_at_trigger
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_applications_updated_at();

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own applications" ON public.applications;
CREATE POLICY "Users can read own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
CREATE POLICY "Users can insert own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
CREATE POLICY "Users can update own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications;
CREATE POLICY "Users can delete own applications"
  ON public.applications FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on applications" ON public.applications;
CREATE POLICY "Service role full access on applications"
  ON public.applications FOR ALL
  USING (auth.role() = 'service_role');


-- ─── 3. Resume Versions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id   UUID        REFERENCES public.analyses(id) ON DELETE CASCADE,
  version_name  TEXT        NOT NULL,
  resume_text   TEXT        NOT NULL,
  score         INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_analysis_id ON public.resume_versions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id     ON public.resume_versions(user_id);

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own resume_versions" ON public.resume_versions;
CREATE POLICY "Users can read own resume_versions"
  ON public.resume_versions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resume_versions" ON public.resume_versions;
CREATE POLICY "Users can insert own resume_versions"
  ON public.resume_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resume_versions" ON public.resume_versions;
CREATE POLICY "Users can delete own resume_versions"
  ON public.resume_versions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on resume_versions" ON public.resume_versions;
CREATE POLICY "Service role full access on resume_versions"
  ON public.resume_versions FOR ALL
  USING (auth.role() = 'service_role');


-- ─── 4. User Portfolios ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_portfolios (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id   UUID        REFERENCES public.analyses(id) ON DELETE CASCADE,
  theme         TEXT        NOT NULL,
  content       JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id     ON public.user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_analysis_id ON public.user_portfolios(analysis_id);

ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own portfolios" ON public.user_portfolios;
CREATE POLICY "Users can select own portfolios"
  ON public.user_portfolios FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own portfolios" ON public.user_portfolios;
CREATE POLICY "Users can insert own portfolios"
  ON public.user_portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own portfolios" ON public.user_portfolios;
CREATE POLICY "Users can update own portfolios"
  ON public.user_portfolios FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own portfolios" ON public.user_portfolios;
CREATE POLICY "Users can delete own portfolios"
  ON public.user_portfolios FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on user_portfolios" ON public.user_portfolios;
CREATE POLICY "Service role full access on user_portfolios"
  ON public.user_portfolios FOR ALL
  USING (auth.role() = 'service_role');
