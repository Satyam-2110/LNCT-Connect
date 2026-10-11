-- =============================================================================
-- LNCT Connect 2.0 — Migration 0010: Admin Opportunities RLS
-- =============================================================================
-- Authorizes campus administrators to update and delete records in the
-- public.opportunities catalog, completing administrative opportunity lifecycle.
-- =============================================================================

-- 1. DROP EXISTING POLICIES IF PRESENT
DROP POLICY IF EXISTS "Admins can update opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Admins can delete opportunities" ON public.opportunities;

-- 2. UPDATE POLICY FOR ADMINISTRATORS
CREATE POLICY "Admins can update opportunities"
  ON public.opportunities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. DELETE POLICY FOR ADMINISTRATORS
CREATE POLICY "Admins can delete opportunities"
  ON public.opportunities
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can update opportunities" ON public.opportunities IS
  'Permits verified platform administrators to modify existing opportunity listings.';

COMMENT ON POLICY "Admins can delete opportunities" ON public.opportunities IS
  'Permits verified platform administrators to delete existing opportunity listings.';
