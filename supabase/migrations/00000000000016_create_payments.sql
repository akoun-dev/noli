-- =============================================================================
-- Migration: Create Payments Table
-- Date: 2024-05-09
-- Purpose: Payment records for policies
-- =============================================================================

CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['CREDIT_CARD'::text, 'BANK_TRANSFER'::text, 'DIRECT_DEBIT'::text, 'CHECK'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'FAILED'::text, 'REFUNDED'::text])),
  transaction_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE CASCADE,
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS payments_policy_idx ON public.payments (policy_id);
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status, payment_method);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_payments ON public.payments;
CREATE TRIGGER trg_set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_user_select ON public.payments;
CREATE POLICY payments_user_select
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payments_user_insert ON public.payments;
CREATE POLICY payments_user_insert
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payments_user_update ON public.payments;
CREATE POLICY payments_user_update
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payments_admin_all ON public.payments;
CREATE POLICY payments_admin_all
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
