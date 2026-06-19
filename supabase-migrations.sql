-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Profiles table
-- Extends Supabase's auth.users with plan and usage info
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'one_time', 'monthly')),
  analyses_used INTEGER NOT NULL DEFAULT 0,
  analyses_limit INTEGER NOT NULL DEFAULT 2,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Service role can do anything (needed for webhook and API routes)
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');


-- 2. Analyses table
-- Stores each analysis result (score + full JSON)
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  result_json TEXT NOT NULL,     -- full AnalysisResult JSON
  target_role TEXT,
  resume_text TEXT,              -- raw extracted resume text (for re-viewing in history)
  job_description TEXT,          -- job description used (if any)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast user-scoped queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

-- Enable RLS
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


-- 3. Increment function (atomic counter)
CREATE OR REPLACE FUNCTION public.increment_analyses_used(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET analyses_used = analyses_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Auto-create profile on new user sign-up
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

-- Trigger fires whenever a new user row is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. Migration helper: Add resume_text and job_description columns
--    to existing analyses tables (safe to run multiple times)
ALTER TABLE IF EXISTS public.analyses
  ADD COLUMN IF NOT EXISTS resume_text TEXT,
  ADD COLUMN IF NOT EXISTS job_description TEXT;


-- 6. Resumes table — organized library of saved resumes
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_role TEXT,
  target_company TEXT,
  resume_text TEXT NOT NULL,
  job_description TEXT,
  last_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast user-scoped queries
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON public.resumes(updated_at DESC);

-- Auto-update updated_at timestamp on resumes (mirrors applications trigger)
CREATE OR REPLACE FUNCTION public.update_resumes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resumes_updated_at_trigger ON public.resumes;
CREATE TRIGGER resumes_updated_at_trigger
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_resumes_updated_at();

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own resumes" ON public.resumes;
CREATE POLICY "Users can read own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;
CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on resumes" ON public.resumes;
CREATE POLICY "Service role full access on resumes"
  ON public.resumes FOR ALL
  USING (auth.role() = 'service_role');


-- 7. Job Matches table
-- Stores each resume ↔ job description match result
CREATE TABLE IF NOT EXISTS public.job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT,
  company_name TEXT,
  job_description TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  fit_verdict TEXT NOT NULL CHECK (fit_verdict IN ('strong', 'good', 'fair', 'weak')),
  result_json TEXT NOT NULL,      -- full JobMatchResult JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON public.job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_created_at ON public.job_matches(created_at DESC);

-- Enable RLS
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


-- 8. Applications table — job application tracker
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  job_description TEXT,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn', 'accepted')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  contact_name TEXT,
  contact_email TEXT,
  applied_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  follow_up_at TIMESTAMPTZ,
  notes TEXT,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  match_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_follow_up ON public.applications(follow_up_at) WHERE follow_up_at IS NOT NULL;

-- Auto-update updated_at timestamp
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

-- Enable RLS
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


-- 9. Resume Versions table
-- Stores Git-style snapshots of resumes
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookup by analysis
CREATE INDEX IF NOT EXISTS idx_resume_versions_analysis_id ON public.resume_versions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON public.resume_versions(user_id);

-- Enable RLS
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


-- ─── Personal Portfolios Table ───────────────────────────
CREATE TABLE IF NOT EXISTS public.user_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON public.user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_analysis_id ON public.user_portfolios(analysis_id);

-- Enable RLS
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own portfolios" ON public.user_portfolios;
CREATE POLICY "Users can delete own portfolios"
  ON public.user_portfolios FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on user_portfolios" ON public.user_portfolios;
CREATE POLICY "Service role full access on user_portfolios"
  ON public.user_portfolios FOR ALL
  USING (auth.role() = 'service_role');


-- ─── Salary Negotiations Table ───────────────────────────
CREATE TABLE IF NOT EXISTS public.salary_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  scenario TEXT NOT NULL,
  initial_offer JSONB NOT NULL,
  final_offer JSONB NOT NULL,
  score INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  feedback JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_salary_negotiations_user_id ON public.salary_negotiations(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_negotiations_created_at ON public.salary_negotiations(created_at DESC);

-- Enable RLS
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


-- ─── Learning Paths Table ───────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  missing_skills TEXT[] NOT NULL,
  project_details JSONB NOT NULL,
  learning_path JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON public.learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_at ON public.learning_paths(created_at DESC);

-- Enable RLS
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


-- ─── Mock Interviews Table ───────────────────────────
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  questions TEXT[] NOT NULL,
  transcripts JSONB NOT NULL,
  overall_score INTEGER NOT NULL,
  star_mastery INTEGER NOT NULL,
  filler_words JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON public.mock_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_created_at ON public.mock_interviews(created_at DESC);

-- Enable RLS
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




