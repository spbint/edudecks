ALTER TABLE public.learning_plan_items
  ADD COLUMN IF NOT EXISTS generated_from_program_id text,
  ADD COLUMN IF NOT EXISTS generated_from_segment_id text,
  ADD COLUMN IF NOT EXISTS generated_from_template_slot_id text;

CREATE TABLE IF NOT EXISTS public.family_calendar_templates (
  id text PRIMARY KEY,
  family_profile_id text NOT NULL,
  title text NOT NULL,
  cycle_type text NOT NULL DEFAULT 'weekly',
  cycle_length integer,
  academic_structure_type text,
  slots_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_programs (
  id text PRIMARY KEY,
  family_profile_id text NOT NULL,
  learner_id text,
  title text NOT NULL,
  subject_id text NOT NULL,
  framework_id text NOT NULL,
  jurisdiction_id text,
  period_type text NOT NULL DEFAULT 'term',
  period_label text NOT NULL,
  duration_count integer NOT NULL DEFAULT 1,
  segment_type text NOT NULL DEFAULT 'week',
  start_date date,
  end_date date,
  calendar_template_slot_id text,
  curriculum_outcome_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  segments_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedule_mapping_json jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
