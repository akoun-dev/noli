-- =============================================================================
-- Migration: Admin Import Jobs Table
-- Date: 2026-04-19
-- Purpose: Track data import operations
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Import Jobs - Track data import operations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_size bigint,
  type text NOT NULL CHECK (type IN ('users', 'insurers', 'offers', 'quotes')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_records integer DEFAULT 0,
  processed_records integer DEFAULT 0,
  successful_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  warnings integer DEFAULT 0,
  error_details jsonb DEFAULT '[]'::jsonb,
  started_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);

DROP TRIGGER IF EXISTS trg_set_updated_at_admin_import_jobs ON public.admin_import_jobs;
CREATE TRIGGER trg_set_updated_at_admin_import_jobs
  BEFORE UPDATE ON public.admin_import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS admin_import_jobs_type_idx
  ON public.admin_import_jobs (type);
CREATE INDEX IF NOT EXISTS admin_import_jobs_status_idx
  ON public.admin_import_jobs (status);
CREATE INDEX IF NOT EXISTS admin_import_jobs_created_at_idx
  ON public.admin_import_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_import_jobs_started_by_idx
  ON public.admin_import_jobs (started_by);

ALTER TABLE public.admin_import_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all import jobs
DROP POLICY IF EXISTS admin_import_jobs_admin_select ON public.admin_import_jobs;
CREATE POLICY admin_import_jobs_admin_select
  ON public.admin_import_jobs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy: Admins can insert import jobs
DROP POLICY IF EXISTS admin_import_jobs_admin_insert ON public.admin_import_jobs;
CREATE POLICY admin_import_jobs_admin_insert
  ON public.admin_import_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy: Admins can update import jobs
DROP POLICY IF EXISTS admin_import_jobs_admin_update ON public.admin_import_jobs;
CREATE POLICY admin_import_jobs_admin_update
  ON public.admin_import_jobs
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy: Admins can delete import jobs
DROP POLICY IF EXISTS admin_import_jobs_admin_delete ON public.admin_import_jobs;
CREATE POLICY admin_import_jobs_admin_delete
  ON public.admin_import_jobs
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_import_jobs TO authenticated;
