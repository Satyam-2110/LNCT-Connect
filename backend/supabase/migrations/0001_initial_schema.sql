-- ==============================================================================
-- Migration: 0001_initial_schema.sql
-- Project: LNCT Connect 2.0 (Backend MVP)
-- Description: Core schema for Profiles, Skills, Verification, and Connections
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMAS & TABLES

-- -----------------------------------------------------------------------------
-- PROFILES: Core student/alumni/mentor identities linked to auth.users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  batch TEXT DEFAULT '',
  graduation_year TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT 'Bhopal, MP',
  company TEXT DEFAULT '',
  is_alumni BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'alumni', 'faculty', 'mentor', 'admin')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  github_url TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- SKILLS: Standardized taxonomy of campus & professional skills
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- PROFILE_SKILLS: Normalized join table between profiles and skills
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_skills (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, skill_id)
);

-- -----------------------------------------------------------------------------
-- VERIFICATION_REQUESTS: Audit log for student identity & enrollment proof
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_number TEXT NOT NULL,
  id_card_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- CONNECTIONS: Bilateral student/alumni peer connections
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_no_self_connection CHECK (requester_id <> receiver_id),
  CONSTRAINT unique_connection_pair UNIQUE (requester_id, receiver_id)
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles(branch);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(name);
CREATE INDEX IF NOT EXISTS idx_profile_skills_skill ON public.profile_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- 4. DATABASE FUNCTIONS & TRIGGERS

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_connections_updated_at ON public.connections;
CREATE TRIGGER set_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function: Verify if caller is administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function: Institutional domain allowlist validator
CREATE OR REPLACE FUNCTION public.is_institutional_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  domain TEXT;
  allowed_domains TEXT[] := ARRAY['lnct.ac.in', 'lnctbhopal.in'];
BEGIN
  domain := LOWER(split_part(email, '@', 2));
  RETURN domain = ANY(allowed_domains);
END;
$$;

-- Function: Automatic profile creation on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
  initial_verification TEXT;
BEGIN
  -- Extract name from metadata or fallback to email username
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Automatic institutional verification strictly via configured domain allowlist
  IF public.is_institutional_email(NEW.email) THEN
    initial_verification := 'verified';
  ELSE
    initial_verification := 'unverified';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    role,
    verification_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_full_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'student',
    initial_verification,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Security guard against unauthorized self-elevation of role or verification
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can change user role or verification_status
  IF NOT public.is_admin() THEN
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'Users are prohibited from modifying their own platform role';
    END IF;
    IF NEW.verification_status <> OLD.verification_status THEN
      RAISE EXCEPTION 'Users are prohibited from modifying their own verification status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all 5 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS POLICIES: PROFILES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: SKILLS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Skills are readable by everyone" ON public.skills;
CREATE POLICY "Skills are readable by everyone"
  ON public.skills FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage skills" ON public.skills;
CREATE POLICY "Only admins can manage skills"
  ON public.skills FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- RLS POLICIES: PROFILE_SKILLS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profile skills are readable by everyone" ON public.profile_skills;
CREATE POLICY "Profile skills are readable by everyone"
  ON public.profile_skills FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own profile skills" ON public.profile_skills;
CREATE POLICY "Users can manage their own profile skills"
  ON public.profile_skills FOR ALL
  USING (auth.uid() = profile_id);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: VERIFICATION_REQUESTS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own verification, admins view all" ON public.verification_requests;
CREATE POLICY "Users view own verification, admins view all"
  ON public.verification_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can submit verification request" ON public.verification_requests;
CREATE POLICY "Users can submit verification request"
  ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Only admins can update verification status" ON public.verification_requests;
CREATE POLICY "Only admins can update verification status"
  ON public.verification_requests FOR UPDATE
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- RLS POLICIES: CONNECTIONS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Participants can view connections" ON public.connections;
CREATE POLICY "Participants can view connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send connection requests" ON public.connections;
DROP POLICY IF EXISTS "Verified users can send connection requests" ON public.connections;
CREATE POLICY "Verified users can send connection requests"
  ON public.connections FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND verification_status = 'verified'
    )
  );

DROP POLICY IF EXISTS "Participants can update connection status" ON public.connections;
CREATE POLICY "Participants can update connection status"
  ON public.connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Participants can delete connection" ON public.connections;
CREATE POLICY "Participants can delete connection"
  ON public.connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- 6. SEED ESSENTIAL BASE SKILLS
INSERT INTO public.skills (name, category) VALUES
  ('React', 'Frontend'),
  ('TypeScript', 'Programming'),
  ('JavaScript', 'Programming'),
  ('Python', 'Programming'),
  ('Java', 'Programming'),
  ('C++', 'Programming'),
  ('Node.js', 'Backend'),
  ('PostgreSQL', 'Database'),
  ('Supabase', 'Backend'),
  ('Tailwind CSS', 'Frontend'),
  ('Machine Learning', 'AI/Data'),
  ('Deep Learning', 'AI/Data'),
  ('Data Structures', 'CS Fundamentals'),
  ('Algorithms', 'CS Fundamentals'),
  ('Cloud Computing', 'DevOps/Cloud'),
  ('Docker', 'DevOps/Cloud'),
  ('Cybersecurity', 'Security'),
  ('UI/UX Design', 'Design'),
  ('Figma', 'Design'),
  ('Web3 / Blockchain', 'Emerging Tech')
ON CONFLICT (name) DO NOTHING;
