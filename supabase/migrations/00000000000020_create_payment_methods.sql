-- =============================================================================
-- Migration: Create Payment Methods Table
-- Date: 2024-05-09
-- Purpose: Store user payment methods (mobile money, credit cards, bank transfers)
-- =============================================================================

CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['MOBILE_MONEY'::text, 'CREDIT_CARD'::text, 'BANK_TRANSFER'::text])),
  provider text NOT NULL CHECK (provider = ANY (ARRAY['MTN'::text, 'ORANGE'::text, 'MOOV'::text, 'VISA'::text, 'MASTERCARD'::text, 'ECOBANK'::text, 'NSIA'::text])),
  last4 text,
  expiry_month int,
  expiry_year int,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS payment_methods_user_idx ON public.payment_methods (user_id);
CREATE INDEX IF NOT EXISTS payment_methods_type_idx ON public.payment_methods (type);
CREATE INDEX IF NOT EXISTS payment_methods_provider_idx ON public.payment_methods (provider);
CREATE INDEX IF NOT EXISTS payment_methods_default_idx ON public.payment_methods (user_id, is_default) WHERE is_default = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_payment_methods ON public.payment_methods;
CREATE TRIGGER trg_set_updated_at_payment_methods
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_methods_user_select ON public.payment_methods;
CREATE POLICY payment_methods_user_select
  ON public.payment_methods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payment_methods_user_insert ON public.payment_methods;
CREATE POLICY payment_methods_user_insert
  ON public.payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payment_methods_user_update ON public.payment_methods;
CREATE POLICY payment_methods_user_update
  ON public.payment_methods
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payment_methods_user_delete ON public.payment_methods;
CREATE POLICY payment_methods_user_delete
  ON public.payment_methods
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payment_methods_admin_all ON public.payment_methods;
CREATE POLICY payment_methods_admin_all
  ON public.payment_methods
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_single_default_payment_method ON public.payment_methods;
CREATE TRIGGER trg_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE OF is_default ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_payment_method();
