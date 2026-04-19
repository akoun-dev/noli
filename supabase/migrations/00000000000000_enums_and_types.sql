-- =============================================================================
-- Migration: Enums and Types
-- Date: 2024-05-09
-- Purpose: Define all custom enums used in the database
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profile role enum
CREATE TYPE public.profile_role AS ENUM ('USER', 'INSURER', 'ADMIN');

-- Quote status enum
CREATE TYPE public.quote_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Coverage type enum
CREATE TYPE public.coverage_type AS ENUM (
  'RC',
  'RESPONSABILITE_CIVILE',
  'RECOURS_TIERS_INCENDIE',
  'DEFENSE_RECOURS',
  'INDIVIDUELLE_CONDUCTEUR',
  'INDIVIDUELLE_PASSAGERS',
  'IPT',
  'AVANCE_RECOURS',
  'INCENDIE',
  'VOL',
  'VOL_MAINS_ARMEES',
  'VOL_ACCESSOIRES',
  'BRIS_GLACES',
  'BRIS_GLACES_TOITS',
  'TIERCE_COMPLETE',
  'TIERCE_COMPLETE_PLAFONNEE',
  'TIERCE_COLLISION',
  'TIERCE_COLLISION_PLAFONNEE',
  'ASSISTANCE',
  'ASSISTANCE_AUTO',
  'ACCESSOIRES',
  'PACK_ASSISTANCE'
);

-- Coverage calculation type enum
CREATE TYPE public.coverage_calculation_type AS ENUM (
  'FIXED_AMOUNT',
  'FREE',
  'VARIABLE_BASED',
  'MATRIX_BASED'
);

-- Quote submission channel enum
CREATE TYPE public.quote_submission_channel AS ENUM (
  'PUBLIC_FORM',
  'AUTHENTICATED_FLOW',
  'AGENT',
  'IMPORT'
);

-- Quote requested by role enum
CREATE TYPE public.quote_requested_by_role AS ENUM (
  'VISITOR',
  'USER',
  'INSURER',
  'ADMIN'
);
