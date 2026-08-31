-- Priority 5A.2: durable family-private Program-to-learner assignments.
-- Structural only: no lesson position, completion, scheduling, calendar, evidence,
-- or learning-progress state is introduced here.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'learners_family_id_id_key'
      and conrelid = 'public.learners'::regclass
  ) then
    alter table public.learners
      add constraint learners_family_id_id_key unique (family_id, id);
  end if;
end;
$$;

create table if not exists public.learner_program_assignments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  program_id uuid not null,
  learner_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_program_assignments_program_family_fk
    foreign key (family_id, program_id)
    references public.programs (family_id, id)
    on delete cascade,
  constraint learner_program_assignments_learner_family_fk
    foreign key (family_id, learner_id)
    references public.learners (family_id, id)
    on delete cascade,
  constraint learner_program_assignments_program_learner_key
    unique (program_id, learner_id)
);

create index if not exists learner_program_assignments_family_program_idx
  on public.learner_program_assignments (family_id, program_id, created_at);

create index if not exists learner_program_assignments_family_learner_idx
  on public.learner_program_assignments (family_id, learner_id, created_at);

alter table public.learner_program_assignments enable row level security;

grant select, insert, delete on public.learner_program_assignments to authenticated;
revoke all on public.learner_program_assignments from anon;

drop policy if exists "clean learner program assignments select own family" on public.learner_program_assignments;
create policy "clean learner program assignments select own family"
on public.learner_program_assignments
for select
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.programs p
    where p.id = program_id and p.family_id = family_id
  )
  and exists (
    select 1 from public.learners l
    where l.id = learner_id and l.family_id = family_id
  )
);

drop policy if exists "clean learner program assignments insert own family" on public.learner_program_assignments;
create policy "clean learner program assignments insert own family"
on public.learner_program_assignments
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.programs p
    where p.id = program_id
      and p.family_id = family_id
      and p.status <> 'archived'
  )
  and exists (
    select 1 from public.learners l
    where l.id = learner_id and l.family_id = family_id
  )
);

drop policy if exists "clean learner program assignments delete own family" on public.learner_program_assignments;
create policy "clean learner program assignments delete own family"
on public.learner_program_assignments
for delete
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.programs p
    where p.id = program_id and p.family_id = family_id
  )
  and exists (
    select 1 from public.learners l
    where l.id = learner_id and l.family_id = family_id
  )
);

create or replace function public.clean_assign_program_learners(
  p_family_id uuid,
  p_program_id uuid,
  p_learner_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  distinct_learner_ids uuid[];
  matching_learner_count integer;
begin
  select array_agg(distinct learner_id order by learner_id)
  into distinct_learner_ids
  from unnest(coalesce(p_learner_ids, array[]::uuid[])) as selected(learner_id);

  if coalesce(array_length(distinct_learner_ids, 1), 0) = 0 then
    raise exception 'Select at least one learner.' using errcode = '22023';
  end if;

  perform 1
  from public.programs
  where id = p_program_id
    and family_id = p_family_id
    and status <> 'archived'
  for update;

  if not found then
    raise exception 'Active program not found.' using errcode = 'P0002';
  end if;

  select count(*) into matching_learner_count
  from public.learners
  where family_id = p_family_id
    and id = any(distinct_learner_ids);

  if matching_learner_count <> cardinality(distinct_learner_ids) then
    raise exception 'One or more learners do not belong to this family.' using errcode = '22023';
  end if;

  insert into public.learner_program_assignments (family_id, program_id, learner_id)
  select p_family_id, p_program_id, learner_id
  from unnest(distinct_learner_ids) as selected(learner_id)
  on conflict (program_id, learner_id) do nothing;
end;
$$;

revoke all on function public.clean_assign_program_learners(uuid, uuid, uuid[]) from public;
grant execute on function public.clean_assign_program_learners(uuid, uuid, uuid[]) to authenticated;

drop trigger if exists clean_learner_program_assignments_updated_at on public.learner_program_assignments;
create trigger clean_learner_program_assignments_updated_at
before update on public.learner_program_assignments
for each row execute function public.clean_set_updated_at();
