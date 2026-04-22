alter table if exists public.learning_plan_items
  add column if not exists curriculum_outcome_ids text[] not null default '{}';

alter table if exists public.evidence_entries
  add column if not exists linked_learning_plan_item_id uuid null;

alter table if exists public.evidence_entries
  add column if not exists curriculum_outcome_ids text[] not null default '{}';

alter table if exists public.evidence_entries
  add column if not exists outcome_status_by_id jsonb not null default '{}'::jsonb;
