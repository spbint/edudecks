create table if not exists public.custom_learning_resources (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  custom_learning_item_id uuid not null references public.custom_learning_items(id) on delete cascade,
  resource_type text not null,
  label text,
  url text,
  reference_text text,
  position integer not null default 0,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_learning_resources_type_check
    check (resource_type in ('web_link', 'reference')),
  constraint custom_learning_resources_source_check
    check (
      (resource_type = 'web_link' and length(btrim(coalesce(url, ''))) > 0 and reference_text is null)
      or
      (resource_type = 'reference' and length(btrim(coalesce(reference_text, ''))) > 0 and url is null)
    ),
  constraint custom_learning_resources_position_check check (position >= 0)
);

create index if not exists custom_learning_resources_item_position_idx
  on public.custom_learning_resources (custom_learning_item_id, position, created_at);
create index if not exists custom_learning_resources_family_idx
  on public.custom_learning_resources (family_id, created_at desc);

drop trigger if exists clean_custom_learning_resources_updated_at on public.custom_learning_resources;
create trigger clean_custom_learning_resources_updated_at
before update on public.custom_learning_resources
for each row execute function public.clean_set_updated_at();

alter table public.custom_learning_resources enable row level security;
revoke all on public.custom_learning_resources from public;
revoke all on public.custom_learning_resources from anon;
grant select, insert, update, delete on public.custom_learning_resources to authenticated;

drop policy if exists "clean custom resources select own family" on public.custom_learning_resources;
create policy "clean custom resources select own family"
  on public.custom_learning_resources for select to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "clean custom resources insert own family" on public.custom_learning_resources;
create policy "clean custom resources insert own family"
  on public.custom_learning_resources for insert to authenticated
  with check (
    public.is_family_member(family_id)
    and created_by_user_id = (select auth.uid())
    and exists (
      select 1 from public.custom_learning_items item
      where item.id = custom_learning_item_id
        and item.family_id = custom_learning_resources.family_id
    )
  );

drop policy if exists "clean custom resources update own family" on public.custom_learning_resources;
create policy "clean custom resources update own family"
  on public.custom_learning_resources for update to authenticated
  using (public.is_family_member(family_id))
  with check (
    public.is_family_member(family_id)
    and exists (
      select 1 from public.custom_learning_items item
      where item.id = custom_learning_item_id
        and item.family_id = custom_learning_resources.family_id
    )
  );

drop policy if exists "clean custom resources delete own family" on public.custom_learning_resources;
create policy "clean custom resources delete own family"
  on public.custom_learning_resources for delete to authenticated
  using (public.is_family_member(family_id));

create or replace function public.mylearna_validate_custom_learning_resource()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item_family_id uuid;
begin
  if (select auth.uid()) is null or not public.is_family_member(new.family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;
  select item.family_id into item_family_id
  from public.custom_learning_items item
  where item.id = new.custom_learning_item_id;
  if item_family_id is null or item_family_id <> new.family_id then
    raise exception 'Resource must belong to this family custom learning item.' using errcode = '23503';
  end if;
  if tg_op = 'INSERT' and new.created_by_user_id <> (select auth.uid()) then
    raise exception 'Resource creator must be the signed-in user.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (
    new.family_id is distinct from old.family_id
    or new.custom_learning_item_id is distinct from old.custom_learning_item_id
    or new.created_by_user_id is distinct from old.created_by_user_id
  ) then
    raise exception 'Resource ownership cannot be changed.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.mylearna_validate_custom_learning_resource() from public;
drop trigger if exists mylearna_validate_custom_learning_resource_before_write
  on public.custom_learning_resources;
create trigger mylearna_validate_custom_learning_resource_before_write
before insert or update on public.custom_learning_resources
for each row execute function public.mylearna_validate_custom_learning_resource();

create or replace function public.mylearna_create_custom_learning_queue_item_with_resource(
  p_family_id uuid,
  p_learner_id uuid,
  p_title text,
  p_learning_area text default null,
  p_note text default null,
  p_resource_type text default null,
  p_resource_label text default null,
  p_resource_value text default null
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
  resource_value text := nullif(btrim(p_resource_value), '');
begin
  if (select auth.uid()) is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.learners learner where learner.id = p_learner_id and learner.family_id = p_family_id) then
    raise exception 'Choose a learner from this family.' using errcode = '23503';
  end if;
  if length(btrim(coalesce(p_title, ''))) = 0 then
    raise exception 'Add a title before putting learning On Deck.' using errcode = '22023';
  end if;
  if p_resource_type is not null and p_resource_type not in ('web_link', 'reference') then
    raise exception 'Choose a valid resource type.' using errcode = '22023';
  end if;
  if p_resource_type is not null and resource_value is null then
    raise exception 'Add the resource link or reference.' using errcode = '22023';
  end if;
  if p_resource_type = 'web_link' and resource_value !~* '^https?://' then
    raise exception 'Use a web link starting with http:// or https://.' using errcode = '22023';
  end if;

  insert into public.custom_learning_items (family_id, learner_id, title, learning_area, note, created_by_user_id)
  values (p_family_id, p_learner_id, btrim(p_title), nullif(btrim(p_learning_area), ''), nullif(btrim(p_note), ''), (select auth.uid()))
  returning id into custom_item_id;

  select coalesce(max(position), -1) + 1 into next_position
  from public.learning_queue_items where family_id = p_family_id and learner_id = p_learner_id;
  insert into public.learning_queue_items (family_id, learner_id, source_type, custom_learning_item_id, display_title, position, created_by_user_id)
  values (p_family_id, p_learner_id, 'custom_learning', custom_item_id, btrim(p_title), next_position, (select auth.uid()))
  returning id into queue_item_id;

  if p_resource_type is not null then
    insert into public.custom_learning_resources (family_id, custom_learning_item_id, resource_type, label, url, reference_text, created_by_user_id)
    values (
      p_family_id, custom_item_id, p_resource_type, nullif(btrim(p_resource_label), ''),
      case when p_resource_type = 'web_link' then resource_value else null end,
      case when p_resource_type = 'reference' then resource_value else null end,
      (select auth.uid())
    );
  end if;
  return queue_item_id;
end;
$$;

revoke all on function public.mylearna_create_custom_learning_queue_item_with_resource(uuid, uuid, text, text, text, text, text, text) from public;
revoke all on function public.mylearna_create_custom_learning_queue_item_with_resource(uuid, uuid, text, text, text, text, text, text) from anon;
grant execute on function public.mylearna_create_custom_learning_queue_item_with_resource(uuid, uuid, text, text, text, text, text, text) to authenticated;
