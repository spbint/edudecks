-- Priority 5B.2: Calendar completion is the operational action. Keep the
-- Program occurrence's durable completion fact atomically aligned with it.

alter table public.program_occurrences
  add column completed_at timestamptz null;

create index program_occurrences_family_completed_idx
  on public.program_occurrences (family_id, completed_at)
  where completed_at is not null;

update public.program_occurrences occurrence
set completed_at = item.completed_at
from public.calendar_items item
where item.id = occurrence.calendar_item_id
  and item.family_id = occurrence.family_id
  and item.completed_at is not null
  and occurrence.completed_at is null;

create or replace function public.clean_set_calendar_item_completion(
  p_family_id uuid,
  p_calendar_item_id uuid,
  p_completed_at timestamptz
)
returns public.calendar_items
language plpgsql
security definer
set search_path = public
as $$
declare
  calendar_row public.calendar_items;
  effective_completed_at timestamptz;
begin
  if not public.is_family_member(p_family_id) then
    raise exception 'Family access is required.' using errcode = '42501';
  end if;

  select * into calendar_row
  from public.calendar_items
  where family_id = p_family_id and id = p_calendar_item_id
  for update;
  if not found then
    raise exception 'Calendar item not found.' using errcode = 'P0002';
  end if;

  effective_completed_at := case
    when p_completed_at is null then null
    else coalesce(calendar_row.completed_at, p_completed_at)
  end;

  update public.calendar_items
  set completed_at = effective_completed_at
  where family_id = p_family_id and id = p_calendar_item_id
  returning * into calendar_row;

  update public.program_occurrences
  set completed_at = effective_completed_at
  where family_id = p_family_id and calendar_item_id = p_calendar_item_id;

  return calendar_row;
end;
$$;

revoke all on function public.clean_set_calendar_item_completion(uuid, uuid, timestamptz) from public;
revoke all on function public.clean_set_calendar_item_completion(uuid, uuid, timestamptz) from anon;
grant execute on function public.clean_set_calendar_item_completion(uuid, uuid, timestamptz) to authenticated;
grant execute on function public.clean_set_calendar_item_completion(uuid, uuid, timestamptz) to service_role;
