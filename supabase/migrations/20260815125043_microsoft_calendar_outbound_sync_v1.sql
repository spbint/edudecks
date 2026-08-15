-- Microsoft Calendar outbound sync V1 and provider-neutral outbox upgrade.
--
-- MyLearna remains the sole source of truth. Google and Microsoft receive
-- independent mirror jobs. Provider infrastructure is service-role only and
-- cannot become browser-visible educational data.

alter table public.calendar_provider_connections
  drop constraint calendar_provider_connections_provider_check;

alter table public.calendar_provider_connections
  add constraint calendar_provider_connections_provider_check
  check (provider in ('google', 'microsoft'));

alter table public.calendar_oauth_states
  drop constraint calendar_oauth_states_provider_check;

alter table public.calendar_oauth_states
  add constraint calendar_oauth_states_provider_check
  check (provider in ('google', 'microsoft'));

alter table public.calendar_item_external_links
  drop constraint calendar_item_external_links_provider_check;

alter table public.calendar_item_external_links
  add constraint calendar_item_external_links_provider_check
  check (provider in ('google', 'microsoft'));

alter table public.calendar_sync_outbox
  add column provider text;

update public.calendar_sync_outbox
set provider = 'google'
where provider is null;

alter table public.calendar_sync_outbox
  alter column provider set not null;

alter table public.calendar_sync_outbox
  add constraint calendar_sync_outbox_provider_check
  check (provider in ('google', 'microsoft'));

alter table public.calendar_sync_outbox
  drop constraint calendar_sync_outbox_family_item_unique;

alter table public.calendar_sync_outbox
  add constraint calendar_sync_outbox_family_item_provider_unique
  unique (family_id, calendar_item_id, provider);

drop index public.calendar_sync_outbox_ready_idx;

create index calendar_sync_outbox_ready_idx
  on public.calendar_sync_outbox (provider, available_at, created_at)
  where status = 'pending';

grant select, insert, update, delete
  on table public.calendar_provider_connections,
    public.calendar_oauth_states,
    public.calendar_item_external_links,
    public.calendar_sync_outbox
  to service_role;

revoke all on table public.calendar_provider_connections from anon, authenticated;
revoke all on table public.calendar_oauth_states from anon, authenticated;
revoke all on table public.calendar_item_external_links from anon, authenticated;
revoke all on table public.calendar_sync_outbox from anon, authenticated;

create or replace function private.enqueue_calendar_item_provider_sync()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_family_id uuid;
  target_calendar_item_id uuid;
  target_operation text;
begin
  if tg_op = 'UPDATE'
    and new.title is not distinct from old.title
    and new.planned_date is not distinct from old.planned_date
    and new.starts_at is not distinct from old.starts_at
    and new.ends_at is not distinct from old.ends_at
    and new.learning_area is not distinct from old.learning_area
  then
    return new;
  end if;

  target_family_id := case when tg_op = 'DELETE' then old.family_id else new.family_id end;
  target_calendar_item_id := case when tg_op = 'DELETE' then old.id else new.id end;
  target_operation := case when tg_op = 'DELETE' then 'delete' else 'upsert' end;

  insert into public.calendar_sync_outbox (
    family_id,
    calendar_item_id,
    provider,
    operation,
    status,
    attempts,
    available_at,
    locked_at,
    lock_token,
    last_error_code,
    created_at,
    updated_at
  )
  select
    target_family_id,
    target_calendar_item_id,
    connection.provider,
    target_operation,
    'pending',
    0,
    now(),
    null,
    null,
    null,
    now(),
    now()
  from public.calendar_provider_connections connection
  where connection.family_id = target_family_id
    and connection.provider in ('google', 'microsoft')
    and connection.status in ('active', 'needs_attention')
  on conflict (family_id, calendar_item_id, provider)
  do update set
    operation = excluded.operation,
    status = 'pending',
    attempts = 0,
    available_at = now(),
    locked_at = null,
    lock_token = null,
    last_error_code = null,
    updated_at = now();

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.enqueue_calendar_item_provider_sync() from public;
revoke all on function private.enqueue_calendar_item_provider_sync() from anon;
revoke all on function private.enqueue_calendar_item_provider_sync() from authenticated;
