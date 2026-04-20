-- =============================================================================
-- Migration: Create Insurer Alerts Table
-- Date: 2024-05-20
-- Purpose: Store alerts and notifications for insurers
-- =============================================================================

CREATE TABLE public.insurer_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_id uuid NOT NULL,
  type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  client_id uuid,
  client_name text,
  quote_id uuid,
  policy_id uuid,
  is_read boolean NOT NULL DEFAULT FALSE,
  action_required boolean NOT NULL DEFAULT FALSE,
  action_url text,
  action_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT insurer_alerts_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE,
  CONSTRAINT insurer_alerts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS insurer_alerts_insurer_idx ON public.insurer_alerts (insurer_id);
CREATE INDEX IF NOT EXISTS insurer_alerts_severity_idx ON public.insurer_alerts (severity);
CREATE INDEX IF NOT EXISTS insurer_alerts_is_read_idx ON public.insurer_alerts (is_read);
CREATE INDEX IF NOT EXISTS insurer_alerts_resolved_at_idx ON public.insurer_alerts (resolved_at);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_insurer_alerts ON public.insurer_alerts;
CREATE TRIGGER trg_set_updated_at_insurer_alerts
  BEFORE UPDATE ON public.insurer_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.insurer_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurer_alerts_owner_select ON public.insurer_alerts;
CREATE POLICY insurer_alerts_owner_select
  ON public.insurer_alerts
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = insurer_alerts.insurer_id
    )
  );

DROP POLICY IF EXISTS insurer_alerts_owner_insert ON public.insurer_alerts;
CREATE POLICY insurer_alerts_owner_insert
  ON public.insurer_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = insurer_alerts.insurer_id
    )
  );

DROP POLICY IF EXISTS insurer_alerts_owner_update ON public.insurer_alerts;
CREATE POLICY insurer_alerts_owner_update
  ON public.insurer_alerts
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = insurer_alerts.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = insurer_alerts.insurer_id
    )
  );

DROP POLICY IF EXISTS insurer_alerts_owner_delete ON public.insurer_alerts;
CREATE POLICY insurer_alerts_owner_delete
  ON public.insurer_alerts
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = insurer_alerts.insurer_id
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.insurer_alerts TO authenticated;
