-- Google Calendar outbound sync V1.
--
-- MyLearna remains authoritative. Provider credentials are encrypted by the
-- application before storage and are never granted to browser roles. Calendar
-- mutations enqueue only provider-neutral work; Google API calls happen in
-- authenticated/server-only workers.

create table public.calendar_provider_connections (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  connected_by_user_id uuid not null,
  provider text not null,
  external_calendar_id text,
  external_calendar_name text not null default 'MyLearna Homeschool',
  refresh_token_ciphertext text,
  token_key_version smallint not null default 1,
  granted_scopes text[] not null default '{}'::text[],
  status text not null default 'pending',
  last_sync_at timestamptz,
  last_sync_status text,
  last_error_code text,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_provider_connections_provider_check
    check (provider in ('google')),
  constraint calendar_provider_connections_status_check
    check (status in ('pending', 'active', 'needs_attention', 'disconnected')),
  constraint calendar_provider_connections_sync_status_check
    check (last_sync_status is null or last_sync_status in ('pending', 'succeeded', 'failed')),
  constraint calendar_provider_connections_family_provider_unique
    unique (family_id, provider),
  constraint calendar_provider_connections_active_fields_check
    check (
      status not in ('active', 'needs_attention')
      or (
        external_calendar_id is not null
        and refresh_token_ciphertext is not null
        and cardinality(granted_scopes) > 0
      )
    )
);

create table public.calendar_oauth_states (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  user_id uuid not null,
  provider text not null,
  state_hash text not null unique,
  code_verifier_ciphertext text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint calendar_oauth_states_provider_check
    check (provider in ('google'))
);

create unique index calendar_oauth_states_one_open_per_family_provider
  on public.calendar_oauth_states (family_id, provider)
  where consumed_at is null;

create index calendar_oauth_states_expiry_idx
  on public.calendar_oauth_states (expires_at)
  where consumed_at is null;

create table public.calendar_item_external_links (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  calendar_item_id uuid not null references public.calendar_items(id) on delete cascade,
  connection_id uuid not null references public.calendar_provider_connections(id) on delete cascade,
  provider text not null,
  external_event_id text not null,
  external_event_etag text,
  last_synced_version text,
  last_sync_status text not null default 'pending',
  last_error_code text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_item_external_links_provider_check
    check (provider in ('google')),
  constraint calendar_item_external_links_sync_status_check
    check (last_sync_status in ('pending', 'succeeded', 'failed')),
  constraint calendar_item_external_links_connection_item_unique
    unique (connection_id, calendar_item_id)
);

create index calendar_item_external_links_family_item_idx
  on public.calendar_item_external_links (family_id, calendar_item_id);

create index calendar_item_external_links_calendar_item_idx
  on public.calendar_item_external_links (calendar_item_id);

create table public.calendar_sync_outbox (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  calendar_item_id uuid not null,
  operation text not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  lock_token uuid,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_sync_outbox_operation_check
    check (operation in ('upsert', 'delete')),
  constraint calendar_sync_outbox_status_check
    check (status in ('pending', 'processing')),
  constraint calendar_sync_outbox_attempts_check
    check (attempts >= 0),
  constraint calendar_sync_outbox_family_item_unique
    unique (family_id, calendar_item_id)
);

create index calendar_sync_outbox_ready_idx
  on public.calendar_sync_outbox (available_at, created_at)
  where status = 'pending';

alter table public.calendar_provider_connections enable row level security;
alter table public.calendar_oauth_states enable row level security;
alter table public.calendar_item_external_links enable row level security;
alter table public.calendar_sync_outbox enable row level security;

revoke all on table public.calendar_provider_connections from anon;
revoke all on table public.calendar_provider_connections from authenticated;
revoke all on table public.calendar_oauth_states from anon;
revoke all on table public.calendar_oauth_states from authenticated;
revoke all on table public.calendar_item_external_links from anon;
revoke all on table public.calendar_item_external_links from authenticated;
revoke all on table public.calendar_sync_outbox from anon;
revoke all on table public.calendar_sync_outbox from authenticated;

create schema if not exists private;

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

  if exists (
    select 1
    from public.calendar_provider_connections connection
    where connection.family_id = target_family_id
      and connection.provider = 'google'
      and connection.status in ('active', 'needs_attention')
  ) then
    insert into public.calendar_sync_outbox (
      family_id,
      calendar_item_id,
      operation,
      status,
      attempts,
      available_at,
      locked_at,
      lock_token,
      last_error_code,
      created_at,
      updated_at
    ) values (
      target_family_id,
      target_calendar_item_id,
      target_operation,
      'pending',
      0,
      now(),
      null,
      null,
      null,
      now(),
      now()
    )
    on conflict (family_id, calendar_item_id)
    do update set
      operation = excluded.operation,
      status = 'pending',
      attempts = 0,
      available_at = now(),
      locked_at = null,
      lock_token = null,
      last_error_code = null,
      updated_at = now();
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.enqueue_calendar_item_provider_sync() from public;
revoke all on function private.enqueue_calendar_item_provider_sync() from anon;
revoke all on function private.enqueue_calendar_item_provider_sync() from authenticated;

create trigger calendar_items_provider_sync_outbox
after insert or update of title, planned_date, starts_at, ends_at, learning_area or delete
on public.calendar_items
for each row
execute function private.enqueue_calendar_item_provider_sync();
