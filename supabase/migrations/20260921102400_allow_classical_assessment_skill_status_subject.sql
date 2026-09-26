-- Allow persisted Pathways progress judgements for MyLearna Classical.
-- The Classical subject is customer-live in My Pathways and uses the same
-- assessment_skill_statuses table for parent-confirmed progress state.

alter table if exists public.assessment_skill_statuses
  drop constraint if exists assessment_skill_statuses_subject_key_check;

alter table if exists public.assessment_skill_statuses
  add constraint assessment_skill_statuses_subject_key_check
  check (
    subject_key in (
      'mathematics',
      'english',
      'classical',
      'science',
      'humanities',
      'technologies',
      'arts',
      'health-pe'
    )
  ) not valid;

alter table if exists public.assessment_skill_statuses
  validate constraint assessment_skill_statuses_subject_key_check;
