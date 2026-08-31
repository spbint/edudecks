-- Priority 5A.1: durable, family-private ordered lesson definitions.
-- This is deliberately structural only: no learner assignment, calendar item,
-- completion, evidence, or learning-progress state is created here.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'programs_family_id_id_key'
      and conrelid = 'public.programs'::regclass
  ) then
    alter table public.programs
      add constraint programs_family_id_id_key unique (family_id, id);
  end if;
end;
$$;

create table if not exists public.program_lessons (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  program_id uuid not null,
  position integer not null,
  title text not null,
  instructions text,
  estimated_duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_lessons_program_family_fk
    foreign key (family_id, program_id)
    references public.programs (family_id, id)
    on delete cascade,
  constraint program_lessons_position_positive check (position > 0),
  constraint program_lessons_title_not_blank check (length(btrim(title)) > 0),
  constraint program_lessons_duration_positive check (
    estimated_duration_minutes is null or estimated_duration_minutes > 0
  ),
  constraint program_lessons_program_position_key
    unique (program_id, position) deferrable initially immediate
);

create index if not exists program_lessons_family_program_position_idx
  on public.program_lessons (family_id, program_id, position);

alter table public.program_lessons enable row level security;

grant select, insert, update, delete on public.program_lessons to authenticated;
revoke all on public.program_lessons from anon;

drop policy if exists "clean program lessons select own family" on public.program_lessons;
create policy "clean program lessons select own family"
on public.program_lessons
for select
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.programs p
    where p.id = program_id and p.family_id = family_id
  )
);

drop policy if exists "clean program lessons insert own family" on public.program_lessons;
create policy "clean program lessons insert own family"
on public.program_lessons
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.programs p
    where p.id = program_id and p.family_id = family_id
  )
);

drop policy if exists "clean program lessons update own family" on public.program_lessons;
create policy "clean program lessons update own family"
on public.program_lessons
for update
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.programs p
    where p.id = program_id and p.family_id = family_id
  )
)
with check (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.programs p
    where p.id = program_id and p.family_id = family_id
  )
);

drop policy if exists "clean program lessons delete own family" on public.program_lessons;
create policy "clean program lessons delete own family"
on public.program_lessons
for delete
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.programs p
    where p.id = program_id and p.family_id = family_id
  )
);

create or replace function public.clean_append_program_lessons(
  p_family_id uuid,
  p_program_id uuid,
  p_lessons jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_position integer;
begin
  if jsonb_typeof(p_lessons) <> 'array' or jsonb_array_length(p_lessons) = 0 then
    raise exception 'At least one lesson is required.' using errcode = '22023';
  end if;

  perform 1
  from public.programs
  where id = p_program_id and family_id = p_family_id
  for update;

  if not found then
    raise exception 'Program not found.' using errcode = 'P0002';
  end if;

  select coalesce(max(position), 0)
  into next_position
  from public.program_lessons
  where family_id = p_family_id and program_id = p_program_id;

  insert into public.program_lessons (
    family_id, program_id, position, title, instructions, estimated_duration_minutes
  )
  select
    p_family_id,
    p_program_id,
    next_position + ordinality::integer,
    btrim(item ->> 'title'),
    nullif(btrim(coalesce(item ->> 'instructions', '')), ''),
    nullif(item ->> 'estimated_duration_minutes', '')::integer
  from jsonb_array_elements(p_lessons) with ordinality as entries(item, ordinality)
  where length(btrim(item ->> 'title')) > 0;
end;
$$;

create or replace function public.clean_reorder_program_lessons(
  p_family_id uuid,
  p_program_id uuid,
  p_lesson_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_count integer;
begin
  perform 1
  from public.programs
  where id = p_program_id and family_id = p_family_id
  for update;

  if not found then
    raise exception 'Program not found.' using errcode = 'P0002';
  end if;

  if array_length(p_lesson_ids, 1) is distinct from cardinality(array(select distinct unnest(p_lesson_ids))) then
    raise exception 'Lesson order contains duplicates.' using errcode = '22023';
  end if;

  select count(*) into current_count
  from public.program_lessons
  where family_id = p_family_id and program_id = p_program_id;

  if current_count <> coalesce(array_length(p_lesson_ids, 1), 0)
    or exists (
      select 1
      from unnest(p_lesson_ids) as selected(id)
      left join public.program_lessons lesson
        on lesson.id = selected.id
       and lesson.family_id = p_family_id
       and lesson.program_id = p_program_id
      where lesson.id is null
    ) then
    raise exception 'Lesson order does not match this program.' using errcode = '22023';
  end if;

  set constraints program_lessons_program_position_key deferred;

  update public.program_lessons lesson
  set position = ordered.position
  from unnest(p_lesson_ids) with ordinality as ordered(id, position)
  where lesson.id = ordered.id
    and lesson.family_id = p_family_id
    and lesson.program_id = p_program_id;
end;
$$;

create or replace function public.clean_remove_program_lesson(
  p_family_id uuid,
  p_program_id uuid,
  p_lesson_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  removed_position integer;
begin
  perform 1
  from public.programs
  where id = p_program_id and family_id = p_family_id
  for update;

  if not found then
    raise exception 'Program not found.' using errcode = 'P0002';
  end if;

  delete from public.program_lessons
  where id = p_lesson_id
    and family_id = p_family_id
    and program_id = p_program_id
  returning position into removed_position;

  if not found then
    raise exception 'Lesson not found.' using errcode = 'P0002';
  end if;

  update public.program_lessons
  set position = position - 1
  where family_id = p_family_id
    and program_id = p_program_id
    and position > removed_position;
end;
$$;

revoke all on function public.clean_append_program_lessons(uuid, uuid, jsonb) from public;
revoke all on function public.clean_reorder_program_lessons(uuid, uuid, uuid[]) from public;
revoke all on function public.clean_remove_program_lesson(uuid, uuid, uuid) from public;
grant execute on function public.clean_append_program_lessons(uuid, uuid, jsonb) to authenticated;
grant execute on function public.clean_reorder_program_lessons(uuid, uuid, uuid[]) to authenticated;
grant execute on function public.clean_remove_program_lesson(uuid, uuid, uuid) to authenticated;

drop trigger if exists clean_program_lessons_updated_at on public.program_lessons;
create trigger clean_program_lessons_updated_at
before update on public.program_lessons
for each row execute function public.clean_set_updated_at();
