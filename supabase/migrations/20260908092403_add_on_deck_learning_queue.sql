-- MyLearna Homeschool On Deck learning queue foundation.
--
-- On Deck is independent from Calendar. It stores parent-selected canonical
-- Pathways focus items only; it does not create scheduled learning, evidence,
-- assessment, mastery, or pathway progress state.

create table if not exists public.learning_queue_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  source_type text not null default 'pathway_step',
  subject_key text not null,
  strand_key text not null,
  stage_key text not null,
  step_key text not null,
  pathway_step_id text not null,
  display_title text null,
  position integer not null default 0,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_queue_items_source_type_check
    check (source_type = 'pathway_step'),
  constraint learning_queue_items_position_check
    check (position >= 0),
  constraint learning_queue_items_canonical_identity_check
    check (
      length(btrim(subject_key)) > 0
      and length(btrim(strand_key)) > 0
      and length(btrim(stage_key)) > 0
      and length(btrim(step_key)) > 0
      and length(btrim(pathway_step_id)) > 0
    ),
  constraint learning_queue_items_unique_source
    unique (family_id, learner_id, source_type, pathway_step_id)
);

create index if not exists learning_queue_items_family_learner_position_idx
  on public.learning_queue_items (family_id, learner_id, position, created_at);

create index if not exists learning_queue_items_family_source_idx
  on public.learning_queue_items (family_id, source_type, pathway_step_id);

alter table public.learning_queue_items enable row level security;

revoke all on public.learning_queue_items from public;
revoke all on public.learning_queue_items from anon;
grant select, insert, update, delete on public.learning_queue_items to authenticated;

drop policy if exists "clean learning queue select own family" on public.learning_queue_items;
create policy "clean learning queue select own family"
on public.learning_queue_items
for select
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.learning_queue_items.family_id
  )
);

drop policy if exists "clean learning queue insert own family" on public.learning_queue_items;
create policy "clean learning queue insert own family"
on public.learning_queue_items
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.learning_queue_items.family_id
  )
);

drop policy if exists "clean learning queue update own family" on public.learning_queue_items;
create policy "clean learning queue update own family"
on public.learning_queue_items
for update
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.learning_queue_items.family_id
  )
);

drop policy if exists "clean learning queue delete own family" on public.learning_queue_items;
create policy "clean learning queue delete own family"
on public.learning_queue_items
for delete
to authenticated
using (public.is_family_member(family_id));

create or replace function public.mylearna_validate_learning_queue_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_family_member(new.family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (
    new.family_id is distinct from old.family_id
    or new.learner_id is distinct from old.learner_id
    or new.source_type is distinct from old.source_type
    or new.subject_key is distinct from old.subject_key
    or new.strand_key is distinct from old.strand_key
    or new.stage_key is distinct from old.stage_key
    or new.step_key is distinct from old.step_key
    or new.pathway_step_id is distinct from old.pathway_step_id
    or new.created_by_user_id is distinct from old.created_by_user_id
  ) then
    raise exception 'On Deck item identity cannot be changed.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.learners learner
    where learner.id = new.learner_id
      and learner.family_id = new.family_id
  ) then
    raise exception 'Choose a learner from this family.' using errcode = '23503';
  end if;

  if new.source_type <> 'pathway_step' then
    raise exception 'On Deck can only use Pathways steps right now.' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.mylearna_validate_learning_queue_item() from public;

drop trigger if exists mylearna_validate_learning_queue_item_before_write
  on public.learning_queue_items;
create trigger mylearna_validate_learning_queue_item_before_write
before insert or update on public.learning_queue_items
for each row
execute function public.mylearna_validate_learning_queue_item();

drop trigger if exists clean_learning_queue_items_updated_at on public.learning_queue_items;
create trigger clean_learning_queue_items_updated_at
before update on public.learning_queue_items
for each row execute function public.clean_set_updated_at();
