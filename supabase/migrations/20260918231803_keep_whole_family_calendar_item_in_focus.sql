begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- A whole-family Calendar activity remains immutable. This function only creates
-- or reuses the normal learner-scoped custom-learning/On Deck records.
create or replace function public.mylearna_keep_whole_family_calendar_item_in_focus(
  p_family_id uuid,
  p_calendar_item_id uuid,
  p_priority text default 'flexible'
)
returns uuid[]
language plpgsql
security invoker
set search_path = public
as $$
declare
  calendar_row public.calendar_items;
  learner_row record;
  queue_item_ids uuid[] := array[]::uuid[];
  queue_item_id uuid;
begin
  if p_family_id is null or auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if p_priority is null or p_priority not in ('must_do', 'flexible', 'extra') then
    raise exception 'Choose a valid focus priority.' using errcode = '22023';
  end if;

  select *
  into calendar_row
  from public.calendar_items item
  where item.id = p_calendar_item_id
    and item.family_id = p_family_id;

  if calendar_row.id is null then
    raise exception 'Calendar learning could not be found.' using errcode = '42501';
  end if;

  if calendar_row.learner_id is not null then
    raise exception 'Whole-family recovery is only available for whole-family Calendar learning.' using errcode = '22023';
  end if;

  if calendar_row.completed_at is not null then
    raise exception 'Completed learning cannot be recovered.' using errcode = '22023';
  end if;

  if calendar_row.pathway_step_id is not null then
    raise exception 'Use the canonical Pathways recovery for this Calendar learning.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.learners learner
    where learner.family_id = p_family_id
  ) then
    raise exception 'Add a learner before keeping whole-family learning in focus.' using errcode = '23503';
  end if;

  -- An exception from any delegated call aborts this RPC transaction, so the
  -- operation is all-or-nothing rather than a client-side sequence of writes.
  for learner_row in
    select learner.id
    from public.learners learner
    where learner.family_id = p_family_id
    order by learner.id
  loop
    queue_item_id := public.mylearna_keep_calendar_item_in_focus(
      p_family_id,
      p_calendar_item_id,
      learner_row.id,
      p_priority
    );
    queue_item_ids := array_append(queue_item_ids, queue_item_id);
  end loop;

  return queue_item_ids;
end;
$$;

revoke all on function public.mylearna_keep_whole_family_calendar_item_in_focus(uuid, uuid, text)
  from public, anon;
grant execute on function public.mylearna_keep_whole_family_calendar_item_in_focus(uuid, uuid, text)
  to authenticated;

commit;
