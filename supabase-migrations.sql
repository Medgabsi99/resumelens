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
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Service role can do anything (needed for webhook and API routes)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

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
