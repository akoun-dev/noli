-- Migration: Add Foreign Key Constraints to insurance_offers
-- Date: 2024-12-31
-- Purpose: Fix missing foreign key relationships for Supabase joins

-- Add foreign key constraint for insurer_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'insurance_offers_insurer_id_fkey'
    ) THEN
        ALTER TABLE public.insurance_offers
        ADD CONSTRAINT insurance_offers_insurer_id_fkey
        FOREIGN KEY (insurer_id)
        REFERENCES public.insurers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for category_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'insurance_offers_category_id_fkey'
    ) THEN
        ALTER TABLE public.insurance_offers
        ADD CONSTRAINT insurance_offers_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES public.insurance_categories(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;
