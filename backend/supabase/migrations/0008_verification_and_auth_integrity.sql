-- ==============================================================================
-- Migration: 0008_verification_and_auth_integrity.sql
-- Project: LNCT Connect 2.0 (Milestone 4 — Phase 17)
-- Description: Verification Submission Trigger and Profile State Integrity
--   1. Automatically transition profiles.verification_status to 'pending'
--      when a new verification request is inserted.
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. VERIFICATION REQUEST INSERT SYNCHRONIZATION
-- -----------------------------------------------------------------------------
-- Automatically transition profiles.verification_status to 'pending' upon submission
CREATE OR REPLACE FUNCTION public.handle_new_verification_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET verification_status = 'pending',
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_verification_request ON public.verification_requests;
CREATE TRIGGER trg_new_verification_request
  AFTER INSERT ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_verification_request();
