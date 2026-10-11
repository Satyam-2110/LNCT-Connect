-- ==============================================================================
-- Migration: 0006_administration_and_moderation.sql
-- Project: LNCT Connect 2.0 (Backend MVP)
-- Description: Schema, Indexes, Triggers, and RLS for Content Moderation Reports
--              and Profile Verification Status Synchronization
-- ==============================================================================

-- 1. SCHEMAS & TABLES

-- -----------------------------------------------------------------------------
-- CONTENT_REPORTS: Community reports flagged for administrative moderation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'project', 'profile', 'message')),
  target_id TEXT NOT NULL CHECK (char_length(trim(target_id)) > 0),
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'impersonation', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_target ON public.content_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON public.content_reports(created_at DESC);

-- 3. TRIGGERS

-- Trigger to update updated_at on content_reports
CREATE OR REPLACE FUNCTION public.handle_content_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_reports_updated_at ON public.content_reports;
CREATE TRIGGER trg_content_reports_updated_at
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_content_reports_updated_at();

-- Trigger: Synchronize profile verification_status when verification_requests status changes
CREATE OR REPLACE FUNCTION public.sync_profile_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles
    SET verification_status = 'verified',
        updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.profiles
    SET verification_status = 'rejected',
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_verification ON public.verification_requests;
CREATE TRIGGER trg_sync_profile_verification
  AFTER UPDATE OF status ON public.verification_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_profile_verification_status();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS: CONTENT_REPORTS
-- -----------------------------------------------------------------------------

-- Read: Reporters can view their filed reports; Admins can view all reports
CREATE POLICY "Reporters or admins can view reports"
  ON public.content_reports
  FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR public.is_admin()
  );

-- Insert: Authenticated users can file a content report
CREATE POLICY "Authenticated users can submit reports"
  ON public.content_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
  );

-- Update: Only administrators can update report status or add notes
CREATE POLICY "Only admins can update reports"
  ON public.content_reports
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Delete: Only administrators can delete reports
CREATE POLICY "Only admins can delete reports"
  ON public.content_reports
  FOR DELETE
  USING (public.is_admin());
