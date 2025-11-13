-- Migration: Create RC tariff table used by the admin tarification UI
-- This table stores the MTPL (Responsabilité Civile) pricing grid that was previously mocked

-- Create table if it does not exist yet
CREATE TABLE IF NOT EXISTS public.tarif_rc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    energy TEXT NOT NULL CHECK (energy IN ('Essence', 'Diesel', 'Electrique', 'Hybride', 'Autre')),
    power_min INTEGER NOT NULL CHECK (power_min >= 0),
    power_max INTEGER NOT NULL CHECK (power_max >= power_min),
    prime NUMERIC NOT NULL CHECK (prime >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Make sure ranges stay unique per category/energy
CREATE UNIQUE INDEX IF NOT EXISTS tarif_rc_unique_range_idx
    ON public.tarif_rc (category, energy, power_min, power_max);

-- Auto-manage updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at_tarif_rc ON public.tarif_rc;
CREATE TRIGGER trg_set_updated_at_tarif_rc
    BEFORE UPDATE ON public.tarif_rc
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Enable row level security
ALTER TABLE public.tarif_rc ENABLE ROW LEVEL SECURITY;

-- Allow reads for everyone (pricing needs to be public)
DROP POLICY IF EXISTS "Allow read access to tarif_rc" ON public.tarif_rc;
CREATE POLICY "Allow read access to tarif_rc" ON public.tarif_rc
    FOR SELECT USING (true);

-- Allow admins to manage the grid
DROP POLICY IF EXISTS "Allow admins to manage tarif_rc" ON public.tarif_rc;
CREATE POLICY "Allow admins to manage tarif_rc" ON public.tarif_rc
    FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN')
    WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

GRANT SELECT ON public.tarif_rc TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tarif_rc TO authenticated;

-- Seed the table with the initial MTPL grid used by the frontend fallback
INSERT INTO public.tarif_rc (category, energy, power_min, power_max, prime)
VALUES
    ('401', 'Essence', 1, 2, 68675),
    ('401', 'Essence', 3, 6, 87885),
    ('401', 'Essence', 7, 9, 102345),
    ('401', 'Essence', 10, 11, 124693),
    ('401', 'Essence', 12, 999, 137058),
    ('401', 'Diesel', 1, 1, 68675),
    ('401', 'Diesel', 2, 4, 87885),
    ('401', 'Diesel', 5, 6, 102345),
    ('401', 'Diesel', 7, 8, 124693),
    ('401', 'Diesel', 9, 999, 137058)
ON CONFLICT (category, energy, power_min, power_max) DO UPDATE
SET
    prime = EXCLUDED.prime,
    is_active = true,
    updated_at = NOW();

COMMENT ON TABLE public.tarif_rc IS 'Responsabilité Civile tariff grid consumed by the admin tarification module';
