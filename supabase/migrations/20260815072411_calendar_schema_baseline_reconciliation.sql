-- Reconcile the checked-in calendar/Marketplace baseline with the schema
-- already relied upon by MyLearna Homeschool.
--
-- This migration is forward-only and records only the authoritative hosted
-- Marketplace and calendar semantics verified for this baseline.

create extension if not exists pgcrypto;

create table if not exists public.marketplace_resources (
  id uuid primary key default gen_random_uuid(),
  source text default 'shopify',
  external_product_id text not null,
  external_variant_id text,
  handle text not null,
  title text not null,
  thumbnail_url text,
  marketplace_area text,
  primary_collection text,
  subcollection text,
  resource_format text,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint marketplace_resources_source_external_product_id_key
    unique (source, external_product_id)
);

do $$
declare
  marketplace_source_attnum smallint;
  marketplace_external_product_attnum smallint;
begin
  select attnum
  into marketplace_source_attnum
  from pg_attribute
  where attrelid = 'public.marketplace_resources'::regclass
    and attname = 'source'
    and not attisdropped;

  select attnum
  into marketplace_external_product_attnum
  from pg_attribute
  where attrelid = 'public.marketplace_resources'::regclass
    and attname = 'external_product_id'
    and not attisdropped;

  if marketplace_source_attnum is null or marketplace_external_product_attnum is null then
    raise exception 'Marketplace uniqueness baseline columns are missing.';
  end if;

  if exists (
    select 1
    from pg_index index_row
    join pg_class index_class
      on index_class.oid = index_row.indexrelid
    join pg_am access_method
      on access_method.oid = index_class.relam
    where index_row.indrelid = 'public.marketplace_resources'::regclass
      and index_row.indisunique
      and index_row.indisvalid
      and index_row.indisready
      and (
        marketplace_source_attnum = any(index_row.indkey)
        or marketplace_external_product_attnum = any(index_row.indkey)
      )
      and not (
        index_row.indnkeyatts = 2
        and index_row.indnatts = 2
        and index_row.indexprs is null
        and index_row.indpred is null
        and access_method.amname = 'btree'
        and marketplace_source_attnum = any(index_row.indkey)
        and marketplace_external_product_attnum = any(index_row.indkey)
      )
  ) then
    raise exception 'A conflicting Marketplace uniqueness definition already exists.';
  end if;

  if not exists (
    select 1
    from pg_index index_row
    join pg_class index_class
      on index_class.oid = index_row.indexrelid
    join pg_am access_method
      on access_method.oid = index_class.relam
    where index_row.indrelid = 'public.marketplace_resources'::regclass
      and index_row.indisunique
      and index_row.indisvalid
      and index_row.indisready
      and index_row.indnkeyatts = 2
      and index_row.indnatts = 2
      and index_row.indexprs is null
      and index_row.indpred is null
      and access_method.amname = 'btree'
      and marketplace_source_attnum = any(index_row.indkey)
      and marketplace_external_product_attnum = any(index_row.indkey)
  ) then
    if to_regclass('public.marketplace_resources_source_external_product_id_key') is not null then
      raise exception 'Index name marketplace_resources_source_external_product_id_key is already used by a different definition.';
    end if;

    alter table public.marketplace_resources
      add constraint marketplace_resources_source_external_product_id_key
      unique (source, external_product_id);
  end if;
end
$$;

alter table public.marketplace_resources enable row level security;

do $$
declare
  authenticated_role_oid oid;
begin
  select oid
  into authenticated_role_oid
  from pg_roles
  where rolname = 'authenticated';

  if authenticated_role_oid is null then
    raise exception 'Required database role authenticated is missing.';
  end if;

  if exists (
    select 1
    from pg_policy policy_row
    where policy_row.polrelid = 'public.marketplace_resources'::regclass
      and policy_row.polcmd = 'r'
      and policy_row.polpermissive
      and policy_row.polroles = array[authenticated_role_oid]::oid[]
      and lower(
        regexp_replace(
          pg_get_expr(policy_row.polqual, policy_row.polrelid),
          '[[:space:]()]',
          '',
          'g'
        )
      ) = 'is_active=true'
      and policy_row.polwithcheck is null
  ) then
    if exists (
      select 1
      from pg_policy policy_row
      where policy_row.polrelid = 'public.marketplace_resources'::regclass
        and not (
          policy_row.polcmd = 'r'
          and policy_row.polpermissive
          and policy_row.polroles = array[authenticated_role_oid]::oid[]
          and lower(
            regexp_replace(
              pg_get_expr(policy_row.polqual, policy_row.polrelid),
              '[[:space:]()]',
              '',
              'g'
            )
          ) = 'is_active=true'
          and policy_row.polwithcheck is null
        )
    ) then
      raise exception 'A conflicting Marketplace RLS policy already exists.';
    end if;
  else
    if exists (
      select 1
      from pg_policy policy_row
      where policy_row.polrelid = 'public.marketplace_resources'::regclass
    ) then
      raise exception 'A conflicting Marketplace RLS policy already exists.';
    end if;

    create policy "marketplace resources read active"
      on public.marketplace_resources
      for select
      to authenticated
      using (is_active = true);
  end if;
end
$$;

alter table public.calendar_items
  add column if not exists completed_at timestamptz;

alter table public.calendar_items
  add column if not exists marketplace_resource_id uuid;

alter table public.calendar_items
  alter column completed_at drop not null;

alter table public.calendar_items
  alter column marketplace_resource_id drop not null;

do $$
declare
  calendar_marketplace_attnum smallint;
  marketplace_id_attnum smallint;
begin
  select attnum
  into calendar_marketplace_attnum
  from pg_attribute
  where attrelid = 'public.calendar_items'::regclass
    and attname = 'marketplace_resource_id'
    and not attisdropped;

  select attnum
  into marketplace_id_attnum
  from pg_attribute
  where attrelid = 'public.marketplace_resources'::regclass
    and attname = 'id'
    and not attisdropped;

  if calendar_marketplace_attnum is null or marketplace_id_attnum is null then
    raise exception 'Calendar Marketplace baseline columns are missing.';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.contype = 'f'
      and constraint_row.conrelid = 'public.calendar_items'::regclass
      and constraint_row.confrelid = 'public.marketplace_resources'::regclass
      and constraint_row.conkey = array[calendar_marketplace_attnum]::smallint[]
      and constraint_row.confkey = array[marketplace_id_attnum]::smallint[]
      and constraint_row.confdeltype = 'n'
      and constraint_row.convalidated
  ) then
    if exists (
      select 1
      from pg_constraint constraint_row
      where constraint_row.contype = 'f'
        and constraint_row.conrelid = 'public.calendar_items'::regclass
        and calendar_marketplace_attnum = any(constraint_row.conkey)
    ) then
      raise exception 'A conflicting Marketplace foreign key already exists on calendar_items.marketplace_resource_id.';
    end if;

    alter table public.calendar_items
      add constraint calendar_items_marketplace_resource_id_fkey
      foreign key (marketplace_resource_id)
      references public.marketplace_resources(id)
      on delete set null;
  end if;
end
$$;

do $$
declare
  calendar_marketplace_attnum smallint;
begin
  select attnum
  into calendar_marketplace_attnum
  from pg_attribute
  where attrelid = 'public.calendar_items'::regclass
    and attname = 'marketplace_resource_id'
    and not attisdropped;

  if not exists (
    select 1
    from pg_index index_row
    join pg_class index_class
      on index_class.oid = index_row.indexrelid
    join pg_am access_method
      on access_method.oid = index_class.relam
    where index_row.indrelid = 'public.calendar_items'::regclass
      and index_row.indisvalid
      and index_row.indisready
      and index_row.indnkeyatts = 1
      and index_row.indnatts = 1
      and index_row.indexprs is null
      and index_row.indpred is null
      and access_method.amname = 'btree'
      and calendar_marketplace_attnum = any(index_row.indkey)
  ) then
    if to_regclass('public.idx_calendar_items_marketplace_resource_id') is not null then
      raise exception 'Index name idx_calendar_items_marketplace_resource_id is already used by a different index definition.';
    end if;

    create index idx_calendar_items_marketplace_resource_id
      on public.calendar_items using btree (marketplace_resource_id);
  end if;
end
$$;
