-- Agent Marketplace -> Resource Cupboard entitlement bridge.
-- Free-testing and Family-included agent resources may be saved.
-- Paid agent resources require a current family Marketplace entitlement.

create table if not exists public.family_marketplace_entitlements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  marketplace_resource_id uuid not null references public.marketplace_resources(id) on delete restrict,
  status text not null default 'active',
  source text not null,
  provider text not null default 'none',
  provider_reference text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_marketplace_entitlements_status_check
    check (status in ('active', 'expired', 'revoked')),
  constraint family_marketplace_entitlements_source_check
    check (source in ('purchase', 'complimentary', 'family_subscription', 'manual')),
  constraint family_marketplace_entitlements_provider_check
    check (provider in ('stripe', 'manual', 'none')),
  constraint family_marketplace_entitlements_period_check
    check (ends_at is null or ends_at >= starts_at)
);

create unique index if not exists family_marketplace_entitlements_one_active_unique
  on public.family_marketplace_entitlements(family_id, marketplace_resource_id)
  where status = 'active';

create index if not exists family_marketplace_entitlements_family_status_idx
  on public.family_marketplace_entitlements(family_id, status, created_at desc);

create index if not exists family_marketplace_entitlements_resource_status_idx
  on public.family_marketplace_entitlements(marketplace_resource_id, status, created_at desc);

alter table public.family_marketplace_entitlements enable row level security;

revoke all on table public.family_marketplace_entitlements from public, anon, authenticated;
grant select on table public.family_marketplace_entitlements to authenticated;
grant all on table public.family_marketplace_entitlements to service_role;

drop policy if exists "family marketplace entitlements select own family"
  on public.family_marketplace_entitlements;
create policy "family marketplace entitlements select own family"
  on public.family_marketplace_entitlements
  for select
  to authenticated
  using (public.is_family_member(family_id));

create or replace function public.mylearna_family_can_access_marketplace_resource(
  p_family_id uuid,
  p_marketplace_resource_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.marketplace_resources as catalogue
    where catalogue.id = p_marketplace_resource_id
      and catalogue.is_active = true
      and (
        catalogue.source = 'mylearna'
        or (
          catalogue.source = 'mylearna_agent'
          and (
            coalesce(catalogue.metadata ->> 'access_model', '') in (
              'free_testing',
              'family_included'
            )
            or (
              catalogue.metadata ->> 'access_model' = 'paid'
              and exists (
                select 1
                from public.family_marketplace_entitlements as entitlement
                where entitlement.family_id = p_family_id
                  and entitlement.marketplace_resource_id = catalogue.id
                  and entitlement.status = 'active'
                  and entitlement.starts_at <= now()
                  and (
                    entitlement.ends_at is null
                    or entitlement.ends_at >= now()
                  )
              )
            )
          )
        )
      )
  );
$$;

revoke all on function public.mylearna_family_can_access_marketplace_resource(uuid, uuid)
  from public, anon;
grant execute on function public.mylearna_family_can_access_marketplace_resource(uuid, uuid)
  to authenticated, service_role;

create or replace function public.mylearna_validate_family_resource()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  file_row public.family_resource_files;
  catalogue_row public.marketplace_resources;
begin
  if auth.uid() is null or not public.is_family_member(new.family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if new.created_by_user_id <> auth.uid() then
    raise exception 'Resource creator must be the signed-in user.' using errcode = '42501';
  end if;

  if new.resource_type = 'web_link' and new.url !~* '^https?://[^[:space:]]+$' then
    raise exception 'Use a web link starting with http:// or https://.' using errcode = '22023';
  end if;

  if new.resource_type = 'file' then
    select *
    into file_row
    from public.family_resource_files
    where id = new.resource_file_id
      and family_id = new.family_id
      and status = 'ready';

    if file_row.id is null then
      raise exception 'PDF resource is not ready yet.' using errcode = '23503';
    end if;
  elsif new.resource_file_id is not null then
    raise exception 'Only PDF resources may reference a stored file.' using errcode = '23514';
  end if;

  if new.resource_type = 'catalogue' then
    select *
    into catalogue_row
    from public.marketplace_resources
    where id = new.marketplace_resource_id
      and is_active = true;

    if catalogue_row.id is null then
      raise exception 'This Marketplace resource is not available.' using errcode = '23503';
    end if;

    if not public.mylearna_family_can_access_marketplace_resource(
      new.family_id,
      catalogue_row.id
    ) then
      raise exception 'This Marketplace resource requires access before it can be saved.'
        using errcode = '42501';
    end if;

    new.name := catalogue_row.title;
    new.url := null;
    new.reference_text := null;
    new.resource_file_id := null;
  elsif new.marketplace_resource_id is not null then
    raise exception 'Only catalogue resources may reference a Marketplace resource.' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.mylearna_validate_family_resource()
  from public, anon;
grant execute on function public.mylearna_validate_family_resource()
  to authenticated, service_role;

create or replace function public.mylearna_save_marketplace_resource_to_cupboard(
  p_family_id uuid,
  p_external_product_id text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  catalogue_row public.marketplace_resources;
  saved_id uuid;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  select *
  into catalogue_row
  from public.marketplace_resources
  where source in ('mylearna', 'mylearna_agent')
    and external_product_id = btrim(coalesce(p_external_product_id, ''))
    and is_active = true
  order by case when source = 'mylearna' then 0 else 1 end
  limit 1;

  if catalogue_row.id is null then
    raise exception 'This MyLearna resource is not available.' using errcode = '23503';
  end if;

  if not public.mylearna_family_can_access_marketplace_resource(
    p_family_id,
    catalogue_row.id
  ) then
    raise exception 'This Marketplace resource requires access before it can be saved.'
      using errcode = '42501';
  end if;

  insert into public.family_resources (
    family_id,
    resource_type,
    name,
    marketplace_resource_id,
    created_by_user_id
  )
  values (
    p_family_id,
    'catalogue',
    catalogue_row.title,
    catalogue_row.id,
    auth.uid()
  )
  on conflict (family_id, marketplace_resource_id) do nothing
  returning id into saved_id;

  if saved_id is null then
    select id
    into saved_id
    from public.family_resources
    where family_id = p_family_id
      and marketplace_resource_id = catalogue_row.id;
  end if;

  if saved_id is null then
    raise exception 'This MyLearna resource could not be saved.' using errcode = 'P0001';
  end if;

  return saved_id;
end;
$$;

revoke all on function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  from public, anon;
grant execute on function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  to authenticated, service_role;

create or replace function public.mylearna_grant_marketplace_entitlement(
  p_family_id uuid,
  p_external_product_id text,
  p_source text,
  p_provider text,
  p_provider_reference text default null,
  p_ends_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  catalogue_row public.marketplace_resources;
  entitlement_id uuid;
begin
  if p_source not in ('purchase', 'complimentary', 'family_subscription', 'manual') then
    raise exception 'Marketplace entitlement source is not supported.' using errcode = '23514';
  end if;

  if p_provider not in ('stripe', 'manual', 'none') then
    raise exception 'Marketplace entitlement provider is not supported.' using errcode = '23514';
  end if;

  select *
  into catalogue_row
  from public.marketplace_resources
  where source = 'mylearna_agent'
    and external_product_id = btrim(coalesce(p_external_product_id, ''))
    and is_active = true
    and metadata ->> 'access_model' = 'paid';

  if catalogue_row.id is null then
    raise exception 'Paid Marketplace resource is not available.' using errcode = '23503';
  end if;

  insert into public.family_marketplace_entitlements (
    family_id,
    marketplace_resource_id,
    status,
    source,
    provider,
    provider_reference,
    starts_at,
    ends_at,
    metadata
  )
  values (
    p_family_id,
    catalogue_row.id,
    'active',
    p_source,
    p_provider,
    nullif(btrim(coalesce(p_provider_reference, '')), ''),
    now(),
    p_ends_at,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (family_id, marketplace_resource_id)
    where status = 'active'
  do update
  set
    source = excluded.source,
    provider = excluded.provider,
    provider_reference = excluded.provider_reference,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into entitlement_id;

  return entitlement_id;
end;
$$;

revoke all on function public.mylearna_grant_marketplace_entitlement(
  uuid, text, text, text, text, timestamptz, jsonb
) from public, anon, authenticated;
grant execute on function public.mylearna_grant_marketplace_entitlement(
  uuid, text, text, text, text, timestamptz, jsonb
) to service_role;
