-- =============================================================================
-- Migration: Create Communication Templates Table
-- Date: 2024-05-20
-- Purpose: Store email/SMS templates for insurers
-- =============================================================================

CREATE TABLE public.communication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'whatsapp', 'sms')),
  subject text,
  content text NOT NULL,
  variables text[],
  category text NOT NULL CHECK (category IN ('welcome', 'quote_followup', 'payment_reminder', 'renewal', 'cross_sell', 'support')),
  is_active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT communication_templates_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS communication_templates_insurer_idx ON public.communication_templates (insurer_id);
CREATE INDEX IF NOT EXISTS communication_templates_category_idx ON public.communication_templates (category);

-- Updated_at trigger
CREATE TRIGGER trg_set_updated_at_communication_templates
  BEFORE UPDATE
  ON public.communication_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS communication_templates_owner_select ON public.communication_templates;
CREATE POLICY communication_templates_owner_select
  ON public.communication_templates
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = communication_templates.insurer_id
    )
  );

DROP POLICY IF EXISTS communication_templates_owner_insert ON public.communication_templates;
CREATE POLICY communication_templates_owner_insert
  ON public.communication_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = communication_templates.insurer_id
    )
  );

DROP POLICY IF EXISTS communication_templates_owner_update ON public.communication_templates;
CREATE POLICY communication_templates_owner_update
  ON public.communication_templates
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = communication_templates.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = communication_templates.insurer_id
    )
  );

DROP POLICY IF EXISTS communication_templates_owner_delete ON public.communication_templates;
CREATE POLICY communication_templates_owner_delete
  ON public.communication_templates
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = communication_templates.insurer_id
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_templates TO authenticated;
