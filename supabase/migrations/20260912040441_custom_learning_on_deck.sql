-- Custom learning is the content/identity layer for parent-created learning.
-- learning_queue_items remains the shared focus/order layer.

create table if not exists public.custom_learning_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  title text not null,
  learning_area text null,
  note text null,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_learning_items_title_check
    check (length(btrim(title)) > 0)
);

create index if not exists custom_learning_items_family_learner_idx
  on public.custom_learning_items (family_id, learner_id, created_at desc);

alter table public.custom_learning_items enable row level security;
revoke all on public.custom_learning_items from public;
revoke all on public.custom_learning_items from anon;
grant select, insert, update on public.custom_learning_items to authenticated;

drop policy if exists "clean custom learning select own family" on public.custom_learning_items;
create policy "clean custom learning select own family"
on public.custom_learning_items
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean custom learning insert own family" on public.custom_learning_items;
create policy "clean custom learning insert own family"
on public.custom_learning_items
for insert to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = (select auth.uid())
  and exists (
    select 1 from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.custom_learning_items.family_id
  )
);

drop policy if exists "clean custom learning update own family" on public.custom_learning_items;
create policy "clean custom learning update own family"
on public.custom_learning_items
for update to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.custom_learning_items.family_id
  )
);

drop trigger if exists clean_custom_learning_items_updated_at on public.custom_learning_items;
create trigger clean_custom_learning_items_updated_at
before update on public.custom_learning_items
for each row execute function public.clean_set_updated_at();

create or replace function public.mylearna_validate_custom_learning_item()
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
    select 1 from public.learners learner
    where learner.id = new.learner_id and learner.family_id = new.family_id
  ) then
    raise exception 'Choose a learner from this family.' using errcode = '23503';
  end if;
  if tg_op = 'INSERT' and new.created_by_user_id is distinct from (select auth.uid()) then
    raise exception 'The signed-in parent must create custom learning.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (
    new.family_id is distinct from old.family_id
    or new.learner_id is distinct from old.learner_id
    or new.created_by_user_id is distinct from old.created_by_user_id
  ) then
    raise exception 'Custom learning identity cannot be changed.' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.mylearna_validate_custom_learning_item() from public;
drop trigger if exists mylearna_validate_custom_learning_item_before_write
  on public.custom_learning_items;
create trigger mylearna_validate_custom_learning_item_before_write
before insert or update on public.custom_learning_items
for each row execute function public.mylearna_validate_custom_learning_item();

alter table public.learning_queue_items
  alter column subject_key drop not null,
  alter column strand_key drop not null,
  alter column stage_key drop not null,
  alter column step_key drop not null,
  alter column pathway_step_id drop not null;

alter table public.learning_queue_items
  add column if not exists custom_learning_item_id uuid null
    references public.custom_learning_items(id) on delete restrict;

alter table public.learning_queue_items
  drop constraint if exists learning_queue_items_source_type_check,
  drop constraint if exists learning_queue_items_canonical_identity_check,
  drop constraint if exists learning_queue_items_unique_source;

alter table public.learning_queue_items
  add constraint learning_queue_items_source_type_check
    check (source_type in ('pathway_step', 'custom_learning')),
  add constraint learning_queue_items_source_identity_check
    check (
      (source_type = 'pathway_step'
        and custom_learning_item_id is null
        and subject_key is not null and length(btrim(subject_key)) > 0
        and strand_key is not null and length(btrim(strand_key)) > 0
        and stage_key is not null and length(btrim(stage_key)) > 0
        and step_key is not null and length(btrim(step_key)) > 0
        and pathway_step_id is not null and length(btrim(pathway_step_id)) > 0)
      or
      (source_type = 'custom_learning'
        and custom_learning_item_id is not null
        and subject_key is null
        and strand_key is null
        and stage_key is null
        and step_key is null
        and pathway_step_id is null)
    );

create unique index if not exists learning_queue_items_pathway_source_idx
  on public.learning_queue_items (family_id, learner_id, pathway_step_id)
  where source_type = 'pathway_step' and pathway_step_id is not null;

create unique index if not exists learning_queue_items_custom_source_idx
  on public.learning_queue_items (family_id, learner_id, custom_learning_item_id)
  where source_type = 'custom_learning' and custom_learning_item_id is not null;

create index if not exists learning_queue_items_family_custom_source_idx
  on public.learning_queue_items (family_id, custom_learning_item_id)
  where custom_learning_item_id is not null;

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
    or new.custom_learning_item_id is distinct from old.custom_learning_item_id
    or new.created_by_user_id is distinct from old.created_by_user_id
  ) then
    raise exception 'On Deck item identity cannot be changed.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.learners learner
    where learner.id = new.learner_id
      and learner.family_id = new.family_id
  ) then
    raise exception 'Choose a learner from this family.' using errcode = '23503';
  end if;

  if new.source_type = 'pathway_step' then
    if new.custom_learning_item_id is not null
      or new.pathway_step_id is null
      or new.subject_key is null
      or new.strand_key is null
      or new.stage_key is null
      or new.step_key is null then
      raise exception 'Pathways On Deck items need canonical step identity.' using errcode = '22023';
    end if;
  elsif new.source_type = 'custom_learning' then
    if new.custom_learning_item_id is null
      or new.pathway_step_id is not null
      or new.subject_key is not null
      or new.strand_key is not null
      or new.stage_key is not null
      or new.step_key is not null
      or not exists (
        select 1 from public.custom_learning_items custom_item
        where custom_item.id = new.custom_learning_item_id
          and custom_item.family_id = new.family_id
          and custom_item.learner_id = new.learner_id
      ) then
      raise exception 'Custom learning On Deck items need a matching custom learning item.' using errcode = '22023';
    end if;
  else
    raise exception 'Choose a valid On Deck source.' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.mylearna_validate_learning_queue_item() from public;

create or replace function public.mylearna_create_custom_learning_queue_item(
  p_family_id uuid,
  p_learner_id uuid,
  p_title text,
  p_learning_area text default null,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  custom_item_id uuid;
  queue_item_id uuid;
  next_position integer;
begin
  if (select auth.uid()) is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.learners learner
    where learner.id = p_learner_id and learner.family_id = p_family_id
  ) then
    raise exception 'Choose a learner from this family.' using errcode = '23503';
  end if;
  if length(btrim(coalesce(p_title, ''))) = 0 then
    raise exception 'Add a title before putting learning On Deck.' using errcode = '22023';
  end if;

  insert into public.custom_learning_items (
    family_id, learner_id, title, learning_area, note, created_by_user_id
  ) values (
    p_family_id, p_learner_id, btrim(p_title), nullif(btrim(p_learning_area), ''),
    nullif(btrim(p_note), ''), (select auth.uid())
  ) returning id into custom_item_id;

  select coalesce(max(position), -1) + 1 into next_position
  from public.learning_queue_items
  where family_id = p_family_id and learner_id = p_learner_id;

  insert into public.learning_queue_items (
    family_id, learner_id, source_type, custom_learning_item_id,
    display_title, position, created_by_user_id
  ) values (
    p_family_id, p_learner_id, 'custom_learning', custom_item_id,
    btrim(p_title), next_position, (select auth.uid())
  ) returning id into queue_item_id;

  return queue_item_id;
end;
$$;

revoke all on function public.mylearna_create_custom_learning_queue_item(uuid, uuid, text, text, text) from public;
grant execute on function public.mylearna_create_custom_learning_queue_item(uuid, uuid, text, text, text) to authenticated;
