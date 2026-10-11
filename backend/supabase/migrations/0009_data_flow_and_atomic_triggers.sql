-- ==============================================================================
-- Migration: 0009_data_flow_and_atomic_triggers.sql
-- Project: LNCT Connect 2.0 (Milestone 4 — Phase 18)
-- Description: Atomic Data Flow Triggers for Projects & Applications
--   1. Automatically register project creator as 'owner' in project_members
--   2. Automatically enroll applicant as 'member' in project_members when
--      application status transitions to 'accepted'
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. ATOMIC PROJECT CREATOR MEMBERSHIP
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_project_creator_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_creator_membership ON public.projects;
CREATE TRIGGER trg_project_creator_membership
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_project_creator_membership();


-- -----------------------------------------------------------------------------
-- 2. ATOMIC ACCEPTED APPLICATION ENROLLMENT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_accepted_project_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.project_id, NEW.applicant_id, 'member')
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_accepted_project_application ON public.project_applications;
CREATE TRIGGER trg_accepted_project_application
  AFTER UPDATE OF status ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_accepted_project_application();
