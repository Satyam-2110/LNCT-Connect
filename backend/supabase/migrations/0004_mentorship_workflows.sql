-- ==============================================================================
-- Migration: 0004_mentorship_workflows.sql
-- Project: LNCT Connect 2.0 (Backend MVP)
-- Description: Schema, Indexes, Triggers, and RLS for Mentor Profiles, Availability,
--              and Mentorship Booking Requests
-- ==============================================================================

-- 1. SCHEMAS & TABLES

-- -----------------------------------------------------------------------------
-- MENTOR_PROFILES: Profiles of senior students and alumni available for 1-on-1 mentorship
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience TEXT NOT NULL CHECK (char_length(trim(experience)) > 0),
  topics TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL DEFAULT '2 slots this month',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- MENTORSHIP_REQUESTS: 1-on-1 guidance booking requests sent by students to mentors
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL CHECK (char_length(trim(topic)) > 0),
  goals_note TEXT NOT NULL CHECK (char_length(trim(goals_note)) > 0),
  preferred_time TEXT DEFAULT 'Flexible',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  mentor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_no_self_mentorship CHECK (mentor_id <> student_id)
);

-- 2. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_active ON public.mentor_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_topics ON public.mentor_profiles USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON public.mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_student ON public.mentorship_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON public.mentorship_requests(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_created ON public.mentorship_requests(created_at DESC);

-- 3. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_mentorship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mentor_profiles_updated_at ON public.mentor_profiles;
CREATE TRIGGER trg_mentor_profiles_updated_at
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_mentorship_updated_at();

DROP TRIGGER IF EXISTS trg_mentorship_requests_updated_at ON public.mentorship_requests;
CREATE TRIGGER trg_mentorship_requests_updated_at
  BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_mentorship_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS: MENTOR_PROFILES
-- -----------------------------------------------------------------------------

-- Read: Anyone can view active mentor profiles (or view own profile even if inactive)
CREATE POLICY "Public read active mentor profiles"
  ON public.mentor_profiles
  FOR SELECT
  USING (
    is_active = TRUE
    OR (auth.uid() IS NOT NULL AND auth.uid() = id)
  );

-- Insert: Verified users can register their own mentor profile
CREATE POLICY "Verified users can register mentor profile"
  ON public.mentor_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND verification_status = 'verified'
    )
  );

-- Update: Mentors can update their own profile
CREATE POLICY "Mentors can update own mentor profile"
  ON public.mentor_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Delete: Mentors can delete their own mentor profile
CREATE POLICY "Mentors can delete own mentor profile"
  ON public.mentor_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- RLS: MENTORSHIP_REQUESTS
-- -----------------------------------------------------------------------------

-- Read: Only the requesting student or the targeted mentor can view session requests
CREATE POLICY "Participants can view mentorship requests"
  ON public.mentorship_requests
  FOR SELECT
  USING (
    auth.uid() = student_id
    OR auth.uid() = mentor_id
  );

-- Insert: Verified students can request mentorship (prevent self-mentorship)
CREATE POLICY "Verified students can request mentorship"
  ON public.mentorship_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND student_id <> mentor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND verification_status = 'verified'
    )
  );

-- Update: Mentors can accept, reject, or update notes; students can cancel pending requests
CREATE POLICY "Mentors or students can update request lifecycle"
  ON public.mentorship_requests
  FOR UPDATE
  USING (
    auth.uid() = mentor_id
    OR (auth.uid() = student_id AND status = 'pending')
  )
  WITH CHECK (
    auth.uid() = mentor_id
    OR (auth.uid() = student_id AND status = 'pending')
  );

-- Delete: Participants can remove completed/rejected/pending requests
CREATE POLICY "Participants can delete mentorship requests"
  ON public.mentorship_requests
  FOR DELETE
  USING (
    auth.uid() = student_id
    OR auth.uid() = mentor_id
  );
