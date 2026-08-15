-- Reconcile the checked-in calendar/Marketplace baseline with the schema
-- already relied upon by MyLearna Homeschool.
--
-- This migration is forward-only and intentionally does not add Marketplace
-- uniqueness or RLS policy semantics that are not documented in this repo.

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
  updated_at timestamptz default now()
);

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
