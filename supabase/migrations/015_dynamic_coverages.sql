-- Relax coverages schema to support dynamic CRUD from Admin UI
-- 1) Allow NULL for column "type" (was NOT NULL)
-- 2) Remove UNIQUE constraint on "type" to allow multiple dynamic coverages
-- 3) Keep primary key on "id" (text) as the stable identifier (UI will generate a code)

DO $$
BEGIN
  -- Drop unique constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  table_schema = 'public'
    AND    table_name   = 'coverages'
    AND    constraint_name = 'coverages_type_unique'
  ) THEN
    ALTER TABLE public.coverages DROP CONSTRAINT coverages_type_unique;
  END IF;

  -- Make column nullable if it was NOT NULL
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coverages'
      AND column_name = 'type'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.coverages ALTER COLUMN type DROP NOT NULL;
  END IF;

  RAISE NOTICE '015_dynamic_coverages: coverages.type is now nullable and not unique';
END $$;

