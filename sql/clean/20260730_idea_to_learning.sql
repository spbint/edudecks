-- Idea-to-Learning: immutable plan links for scheduling and evidence.
-- Additive and idempotent. Apply through the approved database workflow only.

alter table public.calendar_items
  add column if not exists source_plan_type text,
  add column if not exists source_plan_id uuid,
  add column if not exists source_plan_version integer,
  add column if not exists source_plan_sequence_index integer,
  add column if not exists source_plan_snapshot jsonb,
  add column if not exists source_idea_id uuid,
  add column if not exists source_url text,
  add column if not exists source_plan_schedule_key text,
  add column if not exists delivery_status text not null default 'planned';

alter table public.evidence_entries
  add column if not exists source_plan_type text,
  add column if not exists source_plan_id uuid,
  add column if not exists source_plan_version integer,
  add column if not exists source_plan_sequence_index integer,
  add column if not exists source_idea_id uuid,
  add column if not exists source_url text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'calendar_items_source_plan_type_check') then
    alter table public.calendar_items add constraint calendar_items_source_plan_type_check
      check (source_plan_type is null or source_plan_type in ('lesson', 'unit'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'calendar_items_source_plan_version_check') then
    alter table public.calendar_items add constraint calendar_items_source_plan_version_check
      check (source_plan_version is null or source_plan_version > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'calendar_items_source_plan_sequence_check') then
    alter table public.calendar_items add constraint calendar_items_source_plan_sequence_check
      check (source_plan_sequence_index is null or source_plan_sequence_index >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'calendar_items_delivery_status_check') then
    alter table public.calendar_items add constraint calendar_items_delivery_status_check
      check (delivery_status in ('planned', 'skipped'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'evidence_entries_source_plan_type_check') then
    alter table public.evidence_entries add constraint evidence_entries_source_plan_type_check
      check (source_plan_type is null or source_plan_type in ('lesson', 'unit'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'evidence_entries_source_plan_version_check') then
    alter table public.evidence_entries add constraint evidence_entries_source_plan_version_check
      check (source_plan_version is null or source_plan_version > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'evidence_entries_source_plan_sequence_check') then
    alter table public.evidence_entries add constraint evidence_entries_source_plan_sequence_check
      check (source_plan_sequence_index is null or source_plan_sequence_index >= 0);
  end if;
end $$;

create unique index if not exists calendar_items_source_plan_schedule_key_unique
  on public.calendar_items (source_plan_schedule_key)
  where source_plan_schedule_key is not null;
create index if not exists calendar_items_plan_lookup_idx
  on public.calendar_items (family_id, learner_id, planned_date, source_plan_id);
create index if not exists calendar_items_source_plan_id_idx
  on public.calendar_items (source_plan_id)
  where source_plan_id is not null;
create index if not exists evidence_entries_source_plan_lookup_idx
  on public.evidence_entries (family_id, learner_id, source_plan_id, observed_on desc)
  where source_plan_id is not null;

