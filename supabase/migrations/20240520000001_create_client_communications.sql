-- =============================================================================
-- Migration: Create Client Communications Table
-- Date: 2024-05-20
-- Purpose: Store communication history between insurers and clients
-- =============================================================================

CREATE TABLE public.client_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  insurer_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'phone', 'whatsapp', 'sms', 'in_app')),
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  subject text,
  content text NOT NULL,
  attachments text[],
  status text NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  timestamp timestamptz NOT NULL DEFAULT NOW(),
  scheduled_for timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT client_communications_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT client_communications_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS client_communications_insurer_idx ON public.client_communications (insurer_id);
CREATE INDEX IF NOT EXISTS client_communications_client_idx ON public.client_communications (client_id);
CREATE INDEX IF NOT EXISTS client_communications_timestamp_idx ON public.client_communications (timestamp);
CREATE INDEX IF NOT EXISTS client_communications_type_idx ON public.client_communications (type);

-- Updated_at trigger
CREATE TRIGGER trg_set_updated_at_client_communications
  BEFORE UPDATE
  ON public.client_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.client_communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_communications_owner_select ON public.client_communications;
CREATE POLICY client_communications_owner_select
  ON public.client_communications
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = client_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = client_communications.insurer_id
    )
  );

DROP POLICY IF EXISTS client_communications_owner_insert ON public.client_communications;
CREATE POLICY client_communications_owner_insert
  ON public.client_communications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = client_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = client_communications.insurer_id
    )
  );

DROP POLICY IF EXISTS client_communications_owner_update ON public.client_communications;
CREATE POLICY client_communications_owner_update
  ON public.client_communications
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = client_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = client_communications.insurer_id
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = client_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = client_communications.insurer_id
    )
  );

DROP POLICY IF EXISTS client_communications_owner_delete ON public.client_communications;
CREATE POLICY client_communications_owner_delete
  ON public.client_communications
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = client_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = client_communications.insurer_id
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.client_communications TO authenticated;
