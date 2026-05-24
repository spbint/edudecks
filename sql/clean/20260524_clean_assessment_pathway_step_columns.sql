alter table if exists public.assessment_skill_statuses
  add column if not exists pathway_step_id text,
  add column if not exists strand_key text,
  add column if not exists step_key text;

update public.assessment_skill_statuses
set
  pathway_step_id = coalesce(nullif(pathway_step_id, ''), skill_key),
  strand_key = coalesce(nullif(strand_key, ''), split_part(skill_key, '::', 2)),
  step_key = coalesce(nullif(step_key, ''), split_part(skill_key, '::', 4))
where
  skill_key ~ '^[a-z0-9-]+::[a-z0-9-]+::[a-z0-9-]+::[a-z0-9-]+$';

alter table if exists public.assessment_skill_statuses
  drop constraint if exists assessment_skill_statuses_subject_key_check;

alter table if exists public.assessment_skill_statuses
  add constraint assessment_skill_statuses_subject_key_check
  check (
    subject_key in (
      'mathematics',
      'english',
      'science',
      'humanities',
      'technologies',
      'arts',
      'health-pe'
    )
  ) not valid;

alter table if exists public.assessment_skill_statuses
  validate constraint assessment_skill_statuses_subject_key_check;

alter table if exists public.assessment_skill_statuses
  drop constraint if exists assessment_skill_statuses_stage_key_check;

alter table if exists public.assessment_skill_statuses
  add constraint assessment_skill_statuses_stage_key_check
  check (
    stage_key in (
      'Foundation',
      'Lower Primary',
      'Middle Primary',
      'Upper Primary',
      'Lower Secondary',
      'foundation-kindergarten',
      'lower-primary',
      'middle-primary',
      'upper-primary',
      'lower-secondary',
      'years-9-10-consolidation'
    )
  ) not valid;

alter table if exists public.assessment_skill_statuses
  validate constraint assessment_skill_statuses_stage_key_check;

create index if not exists assessment_skill_statuses_pathway_step_idx
  on public.assessment_skill_statuses (pathway_step_id)
  where pathway_step_id is not null;

create index if not exists assessment_skill_statuses_strand_key_idx
  on public.assessment_skill_statuses (strand_key)
  where strand_key is not null;

create index if not exists assessment_skill_statuses_step_key_idx
  on public.assessment_skill_statuses (step_key)
  where step_key is not null;

create index if not exists assessment_skill_statuses_learner_pathway_step_idx
  on public.assessment_skill_statuses (learner_id, pathway_step_id)
  where pathway_step_id is not null;

create index if not exists assessment_skill_statuses_family_learner_pathway_step_idx
  on public.assessment_skill_statuses (family_id, learner_id, pathway_step_id)
  where pathway_step_id is not null;
