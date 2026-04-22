ALTER TABLE public.family_profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS curriculum_framework_id text,
  ADD COLUMN IF NOT EXISTS curriculum_jurisdiction_id text,
  ADD COLUMN IF NOT EXISTS reporting_mode text,
  ADD COLUMN IF NOT EXISTS academic_structure_type text,
  ADD COLUMN IF NOT EXISTS cycle_count integer,
  ADD COLUMN IF NOT EXISTS weeks_per_cycle integer;

UPDATE public.family_profiles
SET
  country = COALESCE(country, preferred_market, 'au'),
  curriculum_framework_id = COALESCE(
    curriculum_framework_id,
    CASE
      WHEN preferred_market = 'us' THEN 'us-common-core'
      WHEN preferred_market = 'uk' THEN 'uk-national'
      ELSE 'au-v9'
    END
  ),
  curriculum_jurisdiction_id = COALESCE(
    curriculum_jurisdiction_id,
    CASE
      WHEN preferred_market = 'us' THEN 'ca'
      WHEN preferred_market = 'uk' THEN 'england'
      ELSE 'tas'
    END
  ),
  reporting_mode = COALESCE(reporting_mode, report_tone_default, 'family-summary'),
  academic_structure_type = COALESCE(academic_structure_type, 'terms'),
  cycle_count = COALESCE(cycle_count, 4),
  weeks_per_cycle = COALESCE(weeks_per_cycle, 10);

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS year_band text,
  ADD COLUMN IF NOT EXISTS curriculum_framework_id text,
  ADD COLUMN IF NOT EXISTS curriculum_jurisdiction_id text,
  ADD COLUMN IF NOT EXISTS reporting_mode text;
