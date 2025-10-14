-- Migration: 012_quote_offers.sql
-- Create quote_offers table to store offer proposals per user quote

CREATE TABLE IF NOT EXISTS public.quote_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL REFERENCES public.insurance_offers(id) ON DELETE RESTRICT,
  insurer_id TEXT NOT NULL REFERENCES public.insurers(id) ON DELETE RESTRICT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_offers_quote_id ON public.quote_offers(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_offers_insurer_id ON public.quote_offers(insurer_id);
CREATE INDEX IF NOT EXISTS idx_quote_offers_status ON public.quote_offers(status);

ALTER TABLE public.quote_offers ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own quote offers via owning the parent quote
CREATE POLICY "Users can view own quote_offers" ON public.quote_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_offers.quote_id
        AND q.user_id = auth.uid()
    )
  );

-- RLS: Insurers can view quote_offers that belong to their insurer
CREATE POLICY "Insurers can view own insurer quote_offers" ON public.quote_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'INSURER' AND p.is_active = true
    ) AND (
      -- Match via explicit mapping
      EXISTS (
        SELECT 1 FROM public.insurer_accounts ia
        WHERE ia.profile_id = auth.uid()
          AND ia.insurer_id = quote_offers.insurer_id
      )
    )
  );

-- RLS: Admins can manage all
CREATE POLICY "Admins can manage all quote_offers" ON public.quote_offers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

