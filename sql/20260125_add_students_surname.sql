BEGIN;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS surname text;

UPDATE public.students
SET surname = NULL
WHERE surname IS NOT NULL
  AND btrim(surname) = '';

COMMIT;
