
-- Fix strength column precision (100.00 needs 5,2 not 4,2)
ALTER TABLE public.opportunities DROP COLUMN strength;
ALTER TABLE public.opportunities ADD COLUMN strength NUMERIC(5,2) GENERATED ALWAYS AS (
  CASE WHEN sample > 0 THEN (hits::NUMERIC / sample) * 100 ELSE 0 END
) STORED;
