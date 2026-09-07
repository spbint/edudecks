-- MyLearna Homeschool Learning Chronicle shared evidence support.
--
-- A Chronicle remains one evidence_entries row so attachments are stored and
-- reconciled once. This table links that shared evidence row to every learner
-- who participated without creating duplicate media objects or learner-scoped
-- evidence copies.

alter table public.evidence_entries
  add column if not exists capture_source text;

alter table public.evidence_entries
  drop constraint if exists evidence_entries_capture_source_check;

alter table public.evidence_entries
  add constraint evidence_entries_capture_source_check
  check (
    capture_source is null
    or capture_source in (
      'my_capture',
      'my_pathways',
      'my_assessments',
      'worksheet',
      'calendar',
      'portfolio',
      'reports',
      'manual',
      'quick_capture',
      'learning_chronicle'
    )
  );

create table if not exists public.evidence_entry_learner_links (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  evidence_entry_id uuid not null references public.evidence_entries(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_entry_learner_links_unique unique (evidence_entry_id, learner_id)
);

create index if not exists evidence_entry_learner_links_family_learner_idx
  on public.evidence_entry_learner_links (family_id, learner_id, evidence_entry_id);

create index if not exists evidence_entry_learner_links_evidence_idx
  on public.evidence_entry_learner_links (evidence_entry_id);

alter table public.evidence_entry_learner_links enable row level security;

drop policy if exists "clean evidence learner links select own family" on public.evidence_entry_learner_links;
create policy "clean evidence learner links select own family"
on public.evidence_entry_learner_links
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean evidence learner links insert own family" on public.evidence_entry_learner_links;
create policy "clean evidence learner links insert own family"
on public.evidence_entry_learner_links
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean evidence learner links update own family" on public.evidence_entry_learner_links;
create policy "clean evidence learner links update own family"
on public.evidence_entry_learner_links
for update
to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean evidence learner links delete own family" on public.evidence_entry_learner_links;
create policy "clean evidence learner links delete own family"
on public.evidence_entry_learner_links
for delete
to authenticated
using (public.is_family_member(family_id));

create or replace function public.mylearna_validate_evidence_learner_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_family_member(new.family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.evidence_entries evidence
    where evidence.id = new.evidence_entry_id
      and evidence.family_id = new.family_id
  ) then
    raise exception 'Learning record unavailable.' using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.learners learner
    where learner.id = new.learner_id
      and learner.family_id = new.family_id
  ) then
    raise exception 'Choose learners from this family.' using errcode = '23503';
  end if;

  return new;
end;
$$;

drop trigger if exists mylearna_validate_evidence_learner_link_before_write
  on public.evidence_entry_learner_links;
create trigger mylearna_validate_evidence_learner_link_before_write
before insert or update on public.evidence_entry_learner_links
for each row
execute function public.mylearna_validate_evidence_learner_link();

create or replace function public.mylearna_sync_primary_evidence_learner_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.family_id is null or new.learner_id is null then
    return new;
  end if;

  insert into public.evidence_entry_learner_links (
    family_id,
    evidence_entry_id,
    learner_id,
    created_by_user_id
  )
  values (
    new.family_id,
    new.id,
    new.learner_id,
    coalesce(new.created_by_user_id, auth.uid())
  )
  on conflict (evidence_entry_id, learner_id) do nothing;

  if tg_op = 'UPDATE' and old.learner_id is distinct from new.learner_id then
    delete from public.evidence_entry_learner_links
    where family_id = new.family_id
      and evidence_entry_id = new.id
      and learner_id = old.learner_id;
  end if;

  return new;
end;
$$;

drop trigger if exists mylearna_sync_primary_evidence_learner_link_after_write
  on public.evidence_entries;
create trigger mylearna_sync_primary_evidence_learner_link_after_write
after insert or update of family_id, learner_id on public.evidence_entries
for each row
execute function public.mylearna_sync_primary_evidence_learner_link();

insert into public.evidence_entry_learner_links (
  family_id,
  evidence_entry_id,
  learner_id,
  created_by_user_id,
  created_at,
  updated_at
)
select
  evidence.family_id,
  evidence.id,
  evidence.learner_id,
  evidence.created_by_user_id,
  coalesce(evidence.created_at, now()),
  coalesce(evidence.updated_at, evidence.created_at, now())
from public.evidence_entries evidence
where evidence.family_id is not null
  and evidence.learner_id is not null
on conflict (evidence_entry_id, learner_id) do nothing;

grant select, insert, update, delete
  on public.evidence_entry_learner_links
  to authenticated;
