-- Migration script to move existing data to new coverage-based system

-- Clean up any existing AUTO offer coverage data to avoid conflicts
DELETE FROM public.offer_coverage_templates WHERE offer_id IN (
  SELECT id FROM public.insurance_offers WHERE category_id = 'AUTO'
);

-- Create coverage templates for existing insurance offers
INSERT INTO public.offer_coverage_templates (offer_id, coverage_id, is_included, is_optional, formula_parameters, display_order)
SELECT
  io.id,
  CASE
    WHEN io.category_id = 'AUTO' THEN 'RC'
    ELSE NULL
  END as coverage_id,
  true as is_included,
  false as is_optional,
  '{}'::jsonb as formula_parameters,
  1 as display_order
FROM public.insurance_offers io
WHERE io.category_id = 'AUTO';

-- Add mandatory RC coverage to all auto quotes
INSERT INTO public.quote_coverage_premiums (quote_id, coverage_id, premium_amount, is_included, calculation_parameters)
SELECT
  q.id,
  'RC',
  COALESCE(q.estimated_price * 0.3, 25000) as premium_amount, -- Estimate 30% of total for RC
  true as is_included,
  jsonb_build_object(
    'fiscal_power', COALESCE((q.vehicle_data->>'fiscal_power')::integer, 6),
    'fuel_type', COALESCE(q.vehicle_data->>'fuel_type', 'essence'),
    'category', COALESCE(q.vehicle_data->>'category', '401')
  ) as calculation_parameters
FROM public.quotes q
WHERE q.category_id = 'AUTO'
  AND NOT EXISTS (
    SELECT 1 FROM public.quote_coverage_premiums qcp
    WHERE qcp.quote_id = q.id AND qcp.coverage_id = 'RC'
  );

-- Add coverage templates based on offer features
-- Handle PostgreSQL text[] array format correctly
-- Remove ALL duplicates before INSERT to avoid ON CONFLICT issues
WITH feature_coverage_mapping AS (
  SELECT
    io.id,
    feature,
    CASE
      WHEN feature ILIKE '%incendie%' THEN 'INCENDIE'
      WHEN feature ILIKE '%vol%' THEN 'VOL'
      WHEN feature ILIKE '%dépannage%' OR feature ILIKE '%assistance%' THEN 'ASSISTANCE_AUTO'
      WHEN feature ILIKE '%bris glace%' THEN 'BRIS_GLACES'
      WHEN feature ILIKE '%tous risque%' OR feature ILIKE '%tierce%' THEN 'TIERCE_COMPLETE'
      ELSE NULL
    END as coverage_id,
    CASE
      WHEN feature ILIKE '%dépannage%' THEN jsonb_build_object('formula_name', 'confort')
      WHEN feature ILIKE '%assistance%' THEN jsonb_build_object('formula_name', 'essentiel')
      ELSE '{}'::jsonb
    END as formula_parameters,
    CASE
      WHEN feature ILIKE '%incendie%' THEN 1
      WHEN feature ILIKE '%vol%' THEN 2
      WHEN feature ILIKE '%bris glace%' THEN 3
      WHEN feature ILIKE '%dépannage%' THEN 4
      WHEN feature ILIKE '%assistance%' THEN 5
      ELSE 6
    END as priority
  FROM public.insurance_offers io,
       unnest(io.features) as feature
  WHERE io.category_id = 'AUTO'
    AND io.features IS NOT NULL
    AND array_length(io.features, 1) > 0
    AND feature ILIKE ANY(ARRAY['%incendie%', '%vol%', '%dépannage%', '%assistance%', '%bris glace%', '%tous risque%', '%tierce%'])
),
deduplicated_features AS (
  SELECT
    id,
    coverage_id,
    formula_parameters,
    MIN(priority) as display_order
  FROM (
    SELECT DISTINCT ON (id, coverage_id)
      id,
      coverage_id,
      formula_parameters,
      priority
    FROM feature_coverage_mapping
    WHERE coverage_id IS NOT NULL
    ORDER BY id, coverage_id, priority
  ) unique_features
  GROUP BY id, coverage_id, formula_parameters
),
filtered_existing AS (
  SELECT df.id, df.coverage_id, df.formula_parameters, df.display_order
  FROM deduplicated_features df
  WHERE NOT EXISTS (
    SELECT 1 FROM public.offer_coverage_templates oct
    WHERE oct.offer_id = df.id AND oct.coverage_id = df.coverage_id
  )
)
INSERT INTO public.offer_coverage_templates (offer_id, coverage_id, is_included, is_optional, formula_parameters, display_order)
SELECT
  fe.id,
  fe.coverage_id,
  true as is_included,
  true as is_optional,
  fe.formula_parameters,
  fe.display_order
FROM filtered_existing fe;

-- Update existing policies to include RC coverage
INSERT INTO public.quote_coverage_premiums (quote_id, coverage_id, premium_amount, is_included, calculation_parameters)
SELECT
  p.quote_id,
  'RC',
  p.premium_amount * 0.4, -- Estimate 40% of policy premium for RC
  true as is_included,
  jsonb_build_object(
    'fiscal_power', 6,
    'fuel_type', 'essence',
    'category', '401'
  ) as calculation_parameters
FROM public.policies p
JOIN public.quotes q ON p.quote_id = q.id
WHERE q.category_id = 'AUTO'
  AND NOT EXISTS (
    SELECT 1 FROM public.quote_coverage_premiums qcp
    WHERE qcp.quote_id = p.quote_id AND qcp.coverage_id = 'RC'
  );

-- Add IPT (Individuelle Conducteur) to auto quotes as commonly selected coverage
INSERT INTO public.quote_coverage_premiums (quote_id, coverage_id, premium_amount, is_included, calculation_parameters)
SELECT
  q.id,
  'IPT',
  8400, -- Formule 2 price
  false as is_included,
  jsonb_build_object('formula_name', 'formule_2') as calculation_parameters
FROM public.quotes q
WHERE q.category_id = 'AUTO'
  AND NOT EXISTS (
    SELECT 1 FROM public.quote_coverage_premiums qcp
    WHERE qcp.quote_id = q.id AND qcp.coverage_id = 'IPT'
  )
LIMIT 50; -- Add to some quotes as example

-- Add Defense et Recours to auto quotes
INSERT INTO public.quote_coverage_premiums (quote_id, coverage_id, premium_amount, is_included, calculation_parameters)
SELECT
  q.id,
  'DEFENSE_RECOURS',
  7950,
  false as is_included,
  jsonb_build_object('default', true) as calculation_parameters
FROM public.quotes q
WHERE q.category_id = 'AUTO'
  AND NOT EXISTS (
    SELECT 1 FROM public.quote_coverage_premiums qcp
    WHERE qcp.quote_id = q.id AND qcp.coverage_id = 'DEFENSE_RECOURS'
  )
LIMIT 30; -- Add to some quotes as example

-- Create mapping table for offer to coverage relationships (for future use)
CREATE TABLE IF NOT EXISTS public.offer_coverage_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  offer_id text NOT NULL REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  coverage_id text NOT NULL REFERENCES public.coverages(id) ON DELETE CASCADE,
  mapping_type text NOT NULL DEFAULT 'auto', -- auto, manual, inferred
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT offer_coverage_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT offer_coverage_mappings_unique UNIQUE (offer_id, coverage_id)
);

-- Note: offer_coverage_templates already cleaned at the beginning of this migration

-- Populate mappings based on offer features and names
-- Handle PostgreSQL text[] array format directly
-- Filter out existing records to avoid conflicts
WITH coverage_inference AS (
  SELECT
    io.id,
    io.name,
    io.features,
    -- High confidence mappings (name-based)
    CASE
      WHEN io.name ILIKE '%responsabilite%' OR io.name ILIKE '%rc%' THEN 'RC'
      WHEN io.name ILIKE '%incendie%' THEN 'INCENDIE'
      WHEN io.name ILIKE '%vol%' THEN 'VOL'
      WHEN io.name ILIKE '%bris glace%' THEN 'BRIS_GLACES'
      WHEN io.name ILIKE '%tierce%' OR io.name ILIKE '%collision%' THEN 'TIERCE_COMPLETE'
      WHEN io.name ILIKE '%tous risque%' THEN 'TIERCE_COMPLETE'
      WHEN io.name ILIKE '%assistance%' THEN 'ASSISTANCE_AUTO'
      WHEN io.name ILIKE '%defense%' OR io.name ILIKE '%recours%' THEN 'DEFENSE_RECOURS'
      ELSE NULL
    END as name_coverage_id,
    -- Feature-based mappings (medium confidence)
    CASE
      WHEN io.features && ARRAY['Incendie'] THEN 'INCENDIE'
      WHEN io.features && ARRAY['Vol'] THEN 'VOL'
      WHEN io.features && ARRAY['Dépannage 24/7', 'Assistance'] THEN 'ASSISTANCE_AUTO'
      WHEN io.features && ARRAY['Bris de glaces'] THEN 'BRIS_GLACES'
      WHEN io.features && ARRAY['Tous risques'] THEN 'TIERCE_COMPLETE'
      ELSE NULL
    END as feature_coverage_id
  FROM public.insurance_offers io
  WHERE io.category_id = 'AUTO'
    AND io.features IS NOT NULL
    AND array_length(io.features, 1) > 0
),
final_mappings AS (
  SELECT DISTINCT
    ci.id,
    COALESCE(ci.name_coverage_id, ci.feature_coverage_id) as coverage_id,
    CASE
      WHEN ci.name_coverage_id IS NOT NULL THEN 'name_inferred'
      ELSE 'feature_inferred'
    END as mapping_type,
    CASE
      WHEN ci.name_coverage_id IS NOT NULL THEN
        CASE
          WHEN ci.name ILIKE '%responsabilite%' OR ci.name ILIKE '%rc%' THEN 1.0
          WHEN ci.name ILIKE '%incendie%' THEN 0.9
          WHEN ci.name ILIKE '%vol%' THEN 0.9
          WHEN ci.name ILIKE '%bris glace%' THEN 0.8
          WHEN ci.name ILIKE '%tous risque%' THEN 0.9
          WHEN ci.name ILIKE '%tierce%' THEN 0.7
          WHEN ci.name ILIKE '%assistance%' THEN 0.8
          WHEN ci.name ILIKE '%defense%' OR ci.name ILIKE '%recours%' THEN 0.7
          ELSE 0.6
        END
      ELSE
        CASE
          WHEN ci.feature_coverage_id = 'INCENDIE' THEN 0.9
          WHEN ci.feature_coverage_id = 'VOL' THEN 0.9
          WHEN ci.feature_coverage_id = 'ASSISTANCE_AUTO' THEN 0.8
          WHEN ci.feature_coverage_id = 'BRIS_GLACES' THEN 0.8
          WHEN ci.feature_coverage_id = 'TIERCE_COMPLETE' THEN 0.9
          ELSE 0.5
        END
    END as confidence_score
  FROM coverage_inference ci
  WHERE COALESCE(ci.name_coverage_id, ci.feature_coverage_id) IS NOT NULL
),
filtered_mappings AS (
  SELECT fm.id, fm.coverage_id, fm.mapping_type, fm.confidence_score
  FROM final_mappings fm
  WHERE NOT EXISTS (
    SELECT 1 FROM public.offer_coverage_mappings ocm
    WHERE ocm.offer_id = fm.id AND ocm.coverage_id = fm.coverage_id
  )
)
INSERT INTO public.offer_coverage_mappings (offer_id, coverage_id, mapping_type, confidence_score)
SELECT
  fm.id,
  fm.coverage_id,
  fm.mapping_type,
  fm.confidence_score
FROM filtered_mappings fm;

-- Add comments for documentation
COMMENT ON TABLE public.offer_coverage_templates IS 'Templates defining which coverages are available/included in each insurance offer';
COMMENT ON TABLE public.quote_coverage_premiums IS 'Calculated premiums for each coverage in a quote';
COMMENT ON TABLE public.offer_coverage_mappings IS 'Mapping between offers and coverages with confidence scores for automatic inference';