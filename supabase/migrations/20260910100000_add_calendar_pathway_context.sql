-- Recover My Week uses only explicit canonical Pathways provenance.
-- Nullable by design: ordinary and historical Calendar items remain factual
-- non-Pathways activities until a real linking flow writes this field.
alter table public.calendar_items
  add column if not exists pathway_step_id text null;

create index if not exists calendar_items_family_pathway_step_idx
  on public.calendar_items (family_id, learner_id, pathway_step_id)
  where pathway_step_id is not null;
