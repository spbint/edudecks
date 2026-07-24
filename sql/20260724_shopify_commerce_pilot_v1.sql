-- MyLearna Shopify Commerce Provider Pilot v1.
-- Proposal only. Do not apply without a staging backup, schema diff, RLS verification,
-- and an approved rollback plan. Isolated from homeschool, campus, reporting, portfolio,
-- and QA tables.

create table if not exists public.intelligence_commerce_resource_mappings (
  id uuid primary key default gen_random_uuid(),
  resource_key text not null,
  provider text not null default 'shopify',
  provider_product_id text not null,
  provider_variant_id text,
  status text not null default 'pending',
  match_confidence numeric(4,3) not null default 0,
  preferred boolean not null default false,
  paused boolean not null default false,
  notes text not null default '',
  created_by_user_id uuid references auth.users(id) on delete set null,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_commerce_mapping_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint intelligence_commerce_mapping_provider_check check (provider = 'shopify'),
  unique (resource_key, provider, provider_product_id, provider_variant_id)
);

create table if not exists public.intelligence_learning_baskets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null,
  revision_id uuid not null references public.intelligence_plan_versions(id) on delete cascade,
  revision_number integer not null,
  status text not null default 'active',
  currency text not null default 'AUD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_basket_status_check check (status in ('active', 'submitted', 'abandoned')),
  unique (user_id, plan_id, revision_id, status)
);

create table if not exists public.intelligence_learning_basket_items (
  id uuid primary key default gen_random_uuid(),
  basket_id uuid not null references public.intelligence_learning_baskets(id) on delete cascade,
  resource_key text not null,
  provider text not null default 'shopify',
  provider_product_id text not null,
  provider_variant_id text not null,
  title text not null,
  quantity integer not null default 1,
  price_amount numeric(12,2) not null,
  currency text not null,
  product_url text not null,
  fulfilment_type text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_basket_item_quantity_check check (quantity > 0),
  constraint intelligence_basket_item_status_check check (status in ('active', 'removed')),
  constraint intelligence_basket_item_provider_check check (provider = 'shopify')
);

create unique index if not exists intelligence_basket_active_item_unique
  on public.intelligence_learning_basket_items (basket_id, resource_key, provider_product_id, provider_variant_id)
  where status = 'active';

create table if not exists public.intelligence_commerce_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null,
  revision_id uuid not null references public.intelligence_plan_versions(id) on delete cascade,
  revision_number integer not null,
  event_type text not null,
  provider text not null default 'shopify',
  product_id text,
  resource_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint intelligence_commerce_event_type_check check (event_type in (
    'product_impression', 'product_opened', 'added_to_basket', 'removed_from_basket',
    'outbound_shopify_click', 'resource_requested', 'product_recommended',
    'product_clicked', 'product_added', 'resource_fulfilled', 'no_suitable_product_found'
  )),
  constraint intelligence_commerce_event_provider_check check (provider = 'shopify')
);

create index if not exists intelligence_commerce_mapping_resource_idx
  on public.intelligence_commerce_resource_mappings (resource_key, provider, paused);
create index if not exists intelligence_baskets_user_revision_idx
  on public.intelligence_learning_baskets (user_id, plan_id, revision_id);
create index if not exists intelligence_commerce_events_user_revision_idx
  on public.intelligence_commerce_events (user_id, plan_id, revision_id, created_at);

alter table public.intelligence_commerce_resource_mappings enable row level security;
alter table public.intelligence_learning_baskets enable row level security;
alter table public.intelligence_learning_basket_items enable row level security;
alter table public.intelligence_commerce_events enable row level security;

create policy "intelligence commerce mappings read authenticated"
on public.intelligence_commerce_resource_mappings for select to authenticated using (true);

create policy "intelligence commerce mappings admin write"
on public.intelligence_commerce_resource_mappings for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "intelligence learning baskets own"
on public.intelligence_learning_baskets for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "intelligence basket items own basket"
on public.intelligence_learning_basket_items for all to authenticated
using (exists (select 1 from public.intelligence_learning_baskets b where b.id = basket_id and b.user_id = auth.uid()))
with check (exists (select 1 from public.intelligence_learning_baskets b where b.id = basket_id and b.user_id = auth.uid()));

create policy "intelligence commerce events own"
on public.intelligence_commerce_events for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
