begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.custom_learning_items
  add column if not exists source_calendar_item_id uuid null;

do $preflight$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.custom_learning_items'::regclass
      and conname = 'custom_learning_items_source_calendar_item_id_fkey'
  ) then
    alter table public.custom_learning_items
      add constraint custom_learning_items_source_calendar_item_id_fkey
      foreign key (source_calendar_item_id)
      references public.calendar_items(id)
      on delete set null;
  end if;
end
$preflight$;

create unique index if not exists custom_learning_items_family_learner_calendar_source_idx
  on public.custom_learning_items (family_id, learner_id, source_calendar_item_id)
  where source_calendar_item_id is not null;

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
    or new.source_calendar_item_id is distinct from old.source_calendar_item_id
  ) then
    raise exception 'Custom learning identity cannot be changed.' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.mylearna_validate_custom_learning_item() from public;

create or replace function public.mylearna_keep_calendar_item_in_focus(
  p_family_id uuid,
  p_calendar_item_id uuid,
  p_learner_id uuid,
  p_priority text default 'flexible'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  calendar_row public.calendar_items;
  custom_item_id uuid;
  queue_item_id uuid;
  next_position integer;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if p_priority not in ('must_do', 'flexible', 'extra') then
    raise exception 'Choose a valid focus priority.' using errcode = '22023';
  end if;

  if p_learner_id is null then
    raise exception 'Choose a learner before keeping learning in focus.' using errcode = '23503';
  end if;

  if not exists (
    select 1 from public.learners learner
    where learner.id = p_learner_id and learner.family_id = p_family_id
  ) then
    raise exception 'Choose a learner from this family.' using errcode = '23503';
  end if;

  select *
  into calendar_row
  from public.calendar_items item
  where item.id = p_calendar_item_id
    and item.family_id = p_family_id;

  if calendar_row.id is null then
    raise exception 'Calendar learning could not be found.' using errcode = '42501';
  end if;

  if calendar_row.completed_at is not null then
    raise exception 'Completed learning cannot be recovered.' using errcode = '22023';
  end if;

  if calendar_row.learner_id is not null and calendar_row.learner_id is distinct from p_learner_id then
    raise exception 'Choose the learner assigned to this Calendar learning.' using errcode = '42501';
  end if;

  if length(btrim(coalesce(calendar_row.title, ''))) = 0 then
    raise exception 'Calendar learning needs a title before it can be kept in focus.' using errcode = '22023';
  end if;

  if calendar_row.pathway_step_id is not null then
    raise exception 'Use the canonical Pathways recovery for this Calendar learning.' using errcode = '22023';
  end if;

  select item.id
  into custom_item_id
  from public.custom_learning_items item
  where item.family_id = p_family_id
    and item.learner_id = p_learner_id
    and item.source_calendar_item_id = p_calendar_item_id;

  if custom_item_id is null then
    insert into public.custom_learning_items (
      family_id,
      learner_id,
      title,
      learning_area,
      note,
      created_by_user_id,
      source_calendar_item_id
    )
    values (
      p_family_id,
      p_learner_id,
      btrim(calendar_row.title),
      nullif(btrim(calendar_row.learning_area), ''),
      nullif(btrim(calendar_row.description), ''),
      auth.uid(),
      p_calendar_item_id
    )
    on conflict (family_id, learner_id, source_calendar_item_id)
      where source_calendar_item_id is not null
    do nothing
    returning id into custom_item_id;

    if custom_item_id is null then
      select item.id
      into custom_item_id
      from public.custom_learning_items item
      where item.family_id = p_family_id
        and item.learner_id = p_learner_id
        and item.source_calendar_item_id = p_calendar_item_id;
    end if;
  end if;

  select queue.id
  into queue_item_id
  from public.learning_queue_items queue
  where queue.family_id = p_family_id
    and queue.learner_id = p_learner_id
    and queue.source_type = 'custom_learning'
    and queue.custom_learning_item_id = custom_item_id;

  if queue_item_id is not null then
    return queue_item_id;
  end if;

  select coalesce(max(queue.position), -1) + 1
  into next_position
  from public.learning_queue_items queue
  where queue.family_id = p_family_id
    and queue.learner_id = p_learner_id;

  insert into public.learning_queue_items (
    family_id,
    learner_id,
    source_type,
    custom_learning_item_id,
    display_title,
    position,
    priority,
    created_by_user_id
  )
  values (
    p_family_id,
    p_learner_id,
    'custom_learning',
    custom_item_id,
    btrim(calendar_row.title),
    next_position,
    p_priority,
    auth.uid()
  )
  on conflict (family_id, learner_id, custom_learning_item_id)
    where source_type = 'custom_learning' and custom_learning_item_id is not null
  do nothing
  returning id into queue_item_id;

  if queue_item_id is null then
    select queue.id
    into queue_item_id
    from public.learning_queue_items queue
    where queue.family_id = p_family_id
      and queue.learner_id = p_learner_id
      and queue.source_type = 'custom_learning'
      and queue.custom_learning_item_id = custom_item_id;
  end if;

  return queue_item_id;
end;
$$;

revoke all on function public.mylearna_keep_calendar_item_in_focus(uuid, uuid, uuid, text)
  from public, anon;
grant execute on function public.mylearna_keep_calendar_item_in_focus(uuid, uuid, uuid, text)
  to authenticated;

commit;
