-- Priority 5B.1: Master Week remains the scheduling engine. A Program block
-- carries an assignment; materialisation allocates one immutable lesson snapshot.

alter table public.learner_program_assignments
  add constraint learner_program_assignments_family_id_id_key unique (family_id, id);

alter table public.program_lessons
  add constraint program_lessons_family_id_id_key unique (family_id, id);

alter table public.calendar_items
  add constraint calendar_items_family_id_id_key unique (family_id, id);

alter table public.template_blocks
  add column learner_program_assignment_id uuid null;

alter table public.template_blocks
  add constraint template_blocks_assignment_family_fk
  foreign key (family_id, learner_program_assignment_id)
  references public.learner_program_assignments (family_id, id)
  on delete restrict;

create index template_blocks_family_assignment_idx
  on public.template_blocks (family_id, learner_program_assignment_id)
  where learner_program_assignment_id is not null;

create table public.program_occurrences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_program_assignment_id uuid not null,
  program_id uuid not null,
  program_lesson_id uuid not null,
  calendar_item_id uuid not null,
  lesson_position_snapshot integer not null check (lesson_position_snapshot > 0),
  planned_date date not null,
  program_title_snapshot text not null,
  lesson_title_snapshot text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_occurrences_assignment_family_fk
    foreign key (family_id, learner_program_assignment_id)
    references public.learner_program_assignments (family_id, id) on delete restrict,
  constraint program_occurrences_program_family_fk
    foreign key (family_id, program_id)
    references public.programs (family_id, id) on delete restrict,
  constraint program_occurrences_lesson_family_fk
    foreign key (family_id, program_lesson_id)
    references public.program_lessons (family_id, id) on delete restrict,
  constraint program_occurrences_calendar_family_fk
    foreign key (family_id, calendar_item_id)
    references public.calendar_items (family_id, id) on delete cascade,
  constraint program_occurrences_calendar_item_key unique (calendar_item_id),
  constraint program_occurrences_assignment_lesson_key unique (learner_program_assignment_id, program_lesson_id),
  constraint program_occurrences_assignment_date_key unique (learner_program_assignment_id, planned_date)
);

create index program_occurrences_family_calendar_idx
  on public.program_occurrences (family_id, calendar_item_id);

create index program_occurrences_family_assignment_date_idx
  on public.program_occurrences (family_id, learner_program_assignment_id, planned_date);

alter table public.program_occurrences enable row level security;
grant select on public.program_occurrences to authenticated;
revoke all on public.program_occurrences from anon;

create policy "clean program occurrences select own family"
on public.program_occurrences for select to authenticated
using (public.is_family_member(family_id));

create or replace function public.clean_allocate_program_occurrence(
  p_family_id uuid,
  p_learner_program_assignment_id uuid,
  p_calendar_item_id uuid
)
returns public.program_occurrences
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_row public.learner_program_assignments;
  calendar_row public.calendar_items;
  block_row public.template_blocks;
  program_row public.programs;
  lesson_row public.program_lessons;
  occurrence_row public.program_occurrences;
begin
  if not public.is_family_member(p_family_id) then
    raise exception 'Family access is required.' using errcode = '42501';
  end if;

  select * into occurrence_row
  from public.program_occurrences
  where family_id = p_family_id and calendar_item_id = p_calendar_item_id;
  if found then return occurrence_row; end if;

  select * into assignment_row
  from public.learner_program_assignments
  where family_id = p_family_id and id = p_learner_program_assignment_id
  for update;
  if not found then raise exception 'Program assignment not found.' using errcode = 'P0002'; end if;

  select * into calendar_row
  from public.calendar_items
  where family_id = p_family_id and id = p_calendar_item_id
  for update;
  if not found or calendar_row.source_type <> 'generated' then
    raise exception 'Generated calendar item not found.' using errcode = 'P0002';
  end if;

  select * into block_row
  from public.template_blocks
  where family_id = p_family_id
    and id = calendar_row.source_template_block_id
    and learner_program_assignment_id = assignment_row.id;
  if not found then raise exception 'Calendar item does not match this Program assignment.' using errcode = '22023'; end if;

  if block_row.learner_id is distinct from assignment_row.learner_id
    or block_row.program_id is distinct from assignment_row.program_id then
    raise exception 'Program block is inconsistent with its assignment.' using errcode = '22023';
  end if;

  select * into program_row
  from public.programs
  where family_id = p_family_id and id = assignment_row.program_id and status <> 'archived';
  if not found then raise exception 'Active Program not found.' using errcode = 'P0002'; end if;

  select lesson.* into lesson_row
  from public.program_lessons lesson
  where lesson.family_id = p_family_id and lesson.program_id = assignment_row.program_id
    and not exists (
      select 1 from public.program_occurrences occurrence
      where occurrence.learner_program_assignment_id = assignment_row.id
        and occurrence.program_lesson_id = lesson.id
    )
  order by lesson.position, lesson.id
  limit 1;

  if not found then return null; end if;

  insert into public.program_occurrences (
    family_id, learner_program_assignment_id, program_id, program_lesson_id,
    calendar_item_id, lesson_position_snapshot, planned_date,
    program_title_snapshot, lesson_title_snapshot
  ) values (
    p_family_id, assignment_row.id, assignment_row.program_id, lesson_row.id,
    calendar_row.id, lesson_row.position, calendar_row.planned_date,
    program_row.title, lesson_row.title
  ) returning * into occurrence_row;

  update public.calendar_items
  set learner_id = assignment_row.learner_id,
      program_id = assignment_row.program_id,
      title = program_row.title || ' · ' || lesson_row.title
  where family_id = p_family_id and id = calendar_row.id;

  return occurrence_row;
end;
$$;

revoke all on function public.clean_allocate_program_occurrence(uuid, uuid, uuid) from public;
revoke all on function public.clean_allocate_program_occurrence(uuid, uuid, uuid) from anon;
grant execute on function public.clean_allocate_program_occurrence(uuid, uuid, uuid) to authenticated;
grant execute on function public.clean_allocate_program_occurrence(uuid, uuid, uuid) to service_role;

create trigger clean_program_occurrences_updated_at
before update on public.program_occurrences
for each row execute function public.clean_set_updated_at();
