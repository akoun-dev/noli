-- Create missing tables: quote_offers and policies
-- These tables are referenced by the frontend but don't exist yet

-- First create quote_offers table
CREATE TABLE IF NOT EXISTS public.quote_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  offer_id text NOT NULL REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  insurer_id uuid NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  price numeric NOT NULL CHECK (price > 0),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create indexes for quote_offers
CREATE INDEX IF NOT EXISTS quote_offers_quote_idx ON public.quote_offers (quote_id);
CREATE INDEX IF NOT EXISTS quote_offers_insurer_idx ON public.quote_offers (insurer_id);
CREATE INDEX IF NOT EXISTS quote_offers_status_idx ON public.quote_offers (status);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at_quote_offers ON public.quote_offers;
CREATE TRIGGER trg_set_updated_at_quote_offers
  BEFORE UPDATE ON public.quote_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on quote_offers
ALTER TABLE public.quote_offers ENABLE ROW LEVEL SECURITY;

-- Create policies for quote_offers
CREATE POLICY "Allow users to view their own quote offers" ON public.quote_offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_offers.quote_id
            AND q.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow insurers to manage their own offers" ON public.quote_offers
    FOR ALL USING (insurer_id = auth.uid())
    WITH CHECK (insurer_id = auth.uid());

CREATE POLICY "Allow admins to view all quote offers" ON public.quote_offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

-- Grant permissions for quote_offers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_offers TO authenticated;
GRANT SELECT ON public.quote_offers TO anon;

-- Now create policies table
CREATE TABLE IF NOT EXISTS public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  offer_id text NOT NULL REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insurer_id uuid NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  policy_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  premium_amount numeric NOT NULL CHECK (premium_amount > 0),
  payment_frequency text NOT NULL DEFAULT 'ANNUAL' CHECK (payment_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUAL')),
  coverage_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  terms_conditions text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create indexes for policies
CREATE INDEX IF NOT EXISTS policies_user_idx ON public.policies (user_id);
CREATE INDEX IF NOT EXISTS policies_insurer_idx ON public.policies (insurer_id);
CREATE INDEX IF NOT EXISTS policies_status_idx ON public.policies (status);
CREATE INDEX IF NOT EXISTS policies_policy_number_idx ON public.policies (policy_number);
CREATE INDEX IF NOT EXISTS policies_end_date_idx ON public.policies (end_date);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at_policies ON public.policies;
CREATE TRIGGER trg_set_updated_at_policies
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on policies
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Create policies for policies table
CREATE POLICY "Allow users to view their own policies" ON public.policies
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow users to update their own policies" ON public.policies
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow insurers to manage their own policies" ON public.policies
    FOR ALL USING (insurer_id = auth.uid())
    WITH CHECK (insurer_id = auth.uid());

CREATE POLICY "Allow admins to view all policies" ON public.policies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

CREATE POLICY "Allow admins to manage all policies" ON public.policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'ADMIN'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

-- Grant permissions for policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.policies TO authenticated;
GRANT SELECT ON public.policies TO anon;

-- Also create a policy_stats_view for admin dashboard
CREATE OR REPLACE VIEW public.policy_stats_view AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_policies,
  COUNT(*) FILTER (WHERE status = 'SUSPENDED') as suspended_policies,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_policies,
  COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired_policies,
  SUM(premium_amount) as total_premium,
  AVG(premium_amount) as avg_premium
FROM public.policies
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Grant permissions on the view
GRANT SELECT ON public.policy_stats_view TO authenticated;