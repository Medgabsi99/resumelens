-- ═══════════════════════════════════════════════════════════════════════════════
-- ResumeLens — Migration 001
-- Core auth schema: profiles table + RLS + triggers + helper functions
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Profiles ─────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with plan and usage info
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT        NOT NULL,
  plan             TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'one_time', 'monthly')),
  analyses_used    INTEGER     NOT NULL DEFAULT 0,
  analyses_limit   INTEGER     NOT NULL DEFAULT 2,
  stripe_customer_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');


-- ─── 2. Auto-create profile on new user sign-up ───────────────────────────────
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


-- ─── 3. Atomic usage counter ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_analyses_used(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET analyses_used = analyses_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
