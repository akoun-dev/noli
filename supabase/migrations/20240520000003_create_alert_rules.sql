-- =============================================================================
-- Migration: Create Alert Rules Table
-- Date: 2024-05-20
-- Purpose: Store automated alert rules for insurers
-- =============================================================================

CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('quote_request', 'quote_expiring', 'payment_due', 'policy_expiring', 'client_inactive', 'conversion_rate_low', 'system_error', 'performance_alert')),
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  action_type text NOT NULL CHECK (action_type IN ('send_email', 'send_whatsapp', 'create_task', 'notify_manager', 'flag_client')),
  action_template text,
  action_delay numeric,
  is_active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT alert_rules_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS alert_rules_insurer_idx ON public.alert_rules (insurer_id);
CREATE INDEX IF NOT EXISTS alert_rules_trigger_type_idx ON public.alert_rules (trigger_type);

-- Updated_at trigger
CREATE TRIGGER trg_set_updated_at_alert_rules
  BEFORE UPDATE
  ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alert_rules_owner_select ON public.alert_rules;
CREATE POLICY alert_rules_owner_select
  ON public.alert_rules
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = alert_rules.insurer_id
    )
  );

DROP POLICY IF EXISTS alert_rules_owner_insert ON public.alert_rules;
CREATE POLICY alert_rules_owner_insert
  ON public.alert_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = alert_rules.insurer_id
    )
  );

DROP POLICY IF EXISTS alert_rules_owner_update ON public.alert_rules;
CREATE POLICY alert_rules_owner_update
  ON public.alert_rules
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = alert_rules.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = alert_rules.insurer_id
    )
  );

DROP POLICY IF EXISTS alert_rules_owner_delete ON public.alert_rules;
CREATE POLICY alert_rules_owner_delete
  ON public.alert_rules
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = alert_rules.insurer_id
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
