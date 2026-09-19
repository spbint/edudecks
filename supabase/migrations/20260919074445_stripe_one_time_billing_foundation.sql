begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Stripe is a payment provider only. MyLearna keeps the family/year product
-- decision and the resulting entitlement as the access authority.
create table public.family_billing_accounts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_billing_accounts_provider_check check (provider = 'stripe'),
  constraint family_billing_accounts_customer_check check (btrim(provider_customer_id) <> ''),
  constraint family_billing_accounts_family_provider_unique unique (family_id, provider),
  constraint family_billing_accounts_provider_customer_unique unique (provider, provider_customer_id)
);

create table public.billing_checkout_intents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  requested_by_user_id uuid not null,
  product_key text not null,
  currency text not null default 'AUD',
  amount_minor integer not null,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  period_starts_on date not null,
  period_ends_on date not null,
  period_label text not null,
  quota_bytes bigint not null,
  status text not null default 'pending',
  provider text not null default 'stripe',
  provider_customer_id text not null,
  provider_checkout_session_id text,
  provider_payment_intent_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '45 minutes'),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint billing_checkout_intents_product_check
    check (product_key in ('MEDIA_100', 'MEDIA_250', 'MEDIA_500', 'MEDIA_1000')),
  constraint billing_checkout_intents_currency_check check (currency = 'AUD'),
  constraint billing_checkout_intents_amount_check check (amount_minor > 0),
  constraint billing_checkout_intents_quota_check check (quota_bytes > 0),
  constraint billing_checkout_intents_period_check check (period_ends_on >= period_starts_on),
  constraint billing_checkout_intents_status_check
    check (status in ('pending', 'checkout_created', 'paid', 'cancelled', 'expired', 'failed', 'review_required')),
  constraint billing_checkout_intents_provider_check check (provider = 'stripe'),
  constraint billing_checkout_intents_customer_check check (btrim(provider_customer_id) <> ''),
  constraint billing_checkout_intents_expiry_check check (expires_at > created_at)
);

create unique index billing_checkout_intents_provider_session_unique
  on public.billing_checkout_intents (provider, provider_checkout_session_id)
  where provider_checkout_session_id is not null and btrim(provider_checkout_session_id) <> '';

create unique index billing_checkout_intents_provider_payment_unique
  on public.billing_checkout_intents (provider, provider_payment_intent_id)
  where provider_payment_intent_id is not null and btrim(provider_payment_intent_id) <> '';

-- A family may have one live self-service media Checkout for a learning year.
-- Expired/failed/cancelled rows deliberately leave the retry path available.
create unique index billing_checkout_intents_one_open_family_year_unique
  on public.billing_checkout_intents (family_id, academic_year_id)
  where status in ('pending', 'checkout_created');

create index billing_checkout_intents_family_year_status_idx
  on public.billing_checkout_intents (family_id, academic_year_id, status, created_at desc);

create table public.billing_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  event_id text not null,
  event_type text not null,
  processing_status text not null default 'received',
  payload_hash text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_code text,
  safe_error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_provider_events_provider_check check (provider = 'stripe'),
  constraint billing_provider_events_id_check check (btrim(event_id) <> ''),
  constraint billing_provider_events_type_check check (btrim(event_type) <> ''),
  constraint billing_provider_events_hash_check check (payload_hash ~ '^[a-f0-9]{64}$'),
  constraint billing_provider_events_status_check
    check (processing_status in ('received', 'processed', 'ignored', 'failed', 'review_required')),
  constraint billing_provider_events_provider_event_unique unique (provider, event_id)
);

create index billing_provider_events_status_received_idx
  on public.billing_provider_events (processing_status, received_at);

create or replace function public.mylearna_validate_billing_checkout_intent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  academic_year_row public.academic_years;
  expected_amount_minor integer;
  expected_quota_bytes bigint;
begin
  if tg_op = 'UPDATE' and (
    new.family_id is distinct from old.family_id
    or new.requested_by_user_id is distinct from old.requested_by_user_id
    or new.product_key is distinct from old.product_key
    or new.currency is distinct from old.currency
    or new.amount_minor is distinct from old.amount_minor
    or new.academic_year_id is distinct from old.academic_year_id
    or new.period_starts_on is distinct from old.period_starts_on
    or new.period_ends_on is distinct from old.period_ends_on
    or new.period_label is distinct from old.period_label
    or new.quota_bytes is distinct from old.quota_bytes
    or new.provider is distinct from old.provider
    or new.provider_customer_id is distinct from old.provider_customer_id
  ) then
    raise exception 'Billing checkout commercial snapshots are immutable.' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.family_members as membership
    where membership.family_id = new.family_id
      and membership.user_id = new.requested_by_user_id
      and membership.role in ('owner', 'parent')
  ) then
    raise exception 'Billing checkout requester is not an authorised adult for this family.'
      using errcode = '23514';
  end if;

  select * into academic_year_row
  from public.academic_years as academic_year
  where academic_year.id = new.academic_year_id
    and academic_year.family_id = new.family_id;

  if academic_year_row.id is null then
    raise exception 'Billing checkout learning year is not available for this family.'
      using errcode = '23514';
  end if;

  if new.period_starts_on <> academic_year_row.starts_on
    or new.period_ends_on <> academic_year_row.ends_on
    or new.period_label <> academic_year_row.title
  then
    raise exception 'Billing checkout must snapshot the selected learning year.'
      using errcode = '23514';
  end if;

  case new.product_key
    when 'MEDIA_100' then expected_amount_minor := 1495; expected_quota_bytes := 104857600;
    when 'MEDIA_250' then expected_amount_minor := 2195; expected_quota_bytes := 262144000;
    when 'MEDIA_500' then expected_amount_minor := 3495; expected_quota_bytes := 524288000;
    when 'MEDIA_1000' then expected_amount_minor := 5495; expected_quota_bytes := 1073741824;
    else raise exception 'Billing checkout media product is not supported.' using errcode = '23514';
  end case;

  if new.amount_minor <> expected_amount_minor or new.quota_bytes <> expected_quota_bytes then
    raise exception 'Billing checkout product amount or allowance is not authoritative.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.mylearna_validate_billing_checkout_intent() from public, anon, authenticated;
grant execute on function public.mylearna_validate_billing_checkout_intent() to service_role;

create trigger mylearna_validate_billing_checkout_intent_before_write
before insert or update on public.billing_checkout_intents
for each row execute function public.mylearna_validate_billing_checkout_intent();

-- The partial unique index is the final concurrency boundary. This service-only
-- helper expires stale rows, checks the current entitlement, and creates the
-- immutable commercial snapshot without a query-then-insert race.
create or replace function public.mylearna_prepare_stripe_checkout_intent(
  p_family_id uuid,
  p_requested_by_user_id uuid,
  p_product_key text,
  p_currency text,
  p_amount_minor integer,
  p_academic_year_id uuid,
  p_period_starts_on date,
  p_period_ends_on date,
  p_period_label text,
  p_quota_bytes bigint,
  p_provider_customer_id text
)
returns table (
  checkout_intent_id uuid,
  checkout_intent_expires_at timestamptz,
  outcome text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_checkout_intent_id uuid;
begin
  if p_family_id is null
    or p_requested_by_user_id is null
    or p_academic_year_id is null
    or btrim(coalesce(p_provider_customer_id, '')) = ''
  then
    raise exception 'Stripe checkout intent is incomplete.' using errcode = '23514';
  end if;

  update public.billing_checkout_intents as stale_intent
  set status = 'expired', updated_at = now()
  where stale_intent.family_id = p_family_id
    and stale_intent.academic_year_id = p_academic_year_id
    and stale_intent.status in ('pending', 'checkout_created')
    and stale_intent.expires_at <= now();

  if exists (
    select 1
    from public.family_entitlements as current_entitlement
    where current_entitlement.family_id = p_family_id
      and current_entitlement.academic_year_id = p_academic_year_id
      and current_entitlement.entitlement_key = 'evidence_media'
      and current_entitlement.status in ('active', 'grace')
  ) then
    return query select null::uuid, null::timestamptz, 'current_entitlement_exists'::text;
    return;
  end if;

  begin
    insert into public.billing_checkout_intents (
      family_id, requested_by_user_id, product_key, currency, amount_minor,
      academic_year_id, period_starts_on, period_ends_on, period_label,
      quota_bytes, provider, provider_customer_id
    ) values (
      p_family_id, p_requested_by_user_id, p_product_key, p_currency, p_amount_minor,
      p_academic_year_id, p_period_starts_on, p_period_ends_on, p_period_label,
      p_quota_bytes, 'stripe', p_provider_customer_id
    ) returning id, expires_at into created_checkout_intent_id, checkout_intent_expires_at;
  exception
    when unique_violation then
      return query select null::uuid, null::timestamptz, 'open_checkout_exists'::text;
      return;
  end;

  return query select created_checkout_intent_id, checkout_intent_expires_at, 'created'::text;
end;
$$;

revoke all on function public.mylearna_prepare_stripe_checkout_intent(
  uuid, uuid, text, text, integer, uuid, date, date, text, bigint, text
) from public, anon, authenticated;
grant execute on function public.mylearna_prepare_stripe_checkout_intent(
  uuid, uuid, text, text, integer, uuid, date, date, text, bigint, text
) to service_role;

-- A single transaction consumes a verified Stripe event and grants at most one
-- entitlement. It is service-only; browser code cannot invoke it.
create or replace function public.mylearna_finalize_stripe_paid_checkout(
  p_checkout_intent_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_provider_event_id text,
  p_event_type text,
  p_payload_hash text
)
returns table (
  checkout_intent_id uuid,
  entitlement_id uuid,
  outcome text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  checkout_intent_row public.billing_checkout_intents;
  existing_entitlement public.family_entitlements;
  created_entitlement_id uuid;
  inserted_event_id uuid;
begin
  if p_checkout_intent_id is null
    or btrim(coalesce(p_checkout_session_id, '')) = ''
    or btrim(coalesce(p_payment_intent_id, '')) = ''
    or btrim(coalesce(p_provider_event_id, '')) = ''
    or p_event_type not in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
    or coalesce(p_payload_hash, '') !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Verified Stripe checkout event is incomplete.' using errcode = '23514';
  end if;

  insert into public.billing_provider_events (
    provider, event_id, event_type, processing_status, payload_hash
  ) values (
    'stripe', p_provider_event_id, p_event_type, 'received', p_payload_hash
  ) on conflict (provider, event_id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return query select p_checkout_intent_id, null::uuid, 'duplicate_event'::text;
    return;
  end if;

  select * into checkout_intent_row
  from public.billing_checkout_intents as checkout_intent
  where checkout_intent.id = p_checkout_intent_id
  for update;

  if checkout_intent_row.id is null
    or checkout_intent_row.provider <> 'stripe'
    or checkout_intent_row.provider_checkout_session_id <> p_checkout_session_id
  then
    update public.billing_provider_events
    set processing_status = 'review_required', processed_at = now(), error_code = 'checkout_intent_mismatch', safe_error_summary = 'Verified payment did not match a MyLearna checkout intent.', updated_at = now()
    where id = inserted_event_id;
    return query select p_checkout_intent_id, null::uuid, 'review_required'::text;
    return;
  end if;

  if checkout_intent_row.status = 'paid' then
    update public.billing_provider_events
    set processing_status = 'processed', processed_at = now(), updated_at = now()
    where id = inserted_event_id;
    return query select checkout_intent_row.id, null::uuid, 'already_paid'::text;
    return;
  end if;

  if checkout_intent_row.status not in ('pending', 'checkout_created') then
    update public.billing_provider_events
    set processing_status = 'review_required', processed_at = now(), error_code = 'intent_state_invalid', safe_error_summary = 'Verified payment arrived for a checkout intent requiring review.', updated_at = now()
    where id = inserted_event_id;
    update public.billing_checkout_intents
    set status = 'review_required', updated_at = now()
    where id = checkout_intent_row.id;
    return query select checkout_intent_row.id, null::uuid, 'review_required'::text;
    return;
  end if;

  select * into existing_entitlement
  from public.family_entitlements as entitlement
  where entitlement.family_id = checkout_intent_row.family_id
    and entitlement.academic_year_id = checkout_intent_row.academic_year_id
    and entitlement.entitlement_key = 'evidence_media'
    and entitlement.status in ('active', 'grace')
  order by entitlement.created_at desc
  limit 1
  for update;

  if existing_entitlement.id is not null then
    update public.billing_provider_events
    set processing_status = case when existing_entitlement.provider_reference = p_payment_intent_id then 'processed' else 'review_required' end,
        processed_at = now(),
        error_code = case when existing_entitlement.provider_reference = p_payment_intent_id then null else 'current_entitlement_exists' end,
        safe_error_summary = case when existing_entitlement.provider_reference = p_payment_intent_id then null else 'A current media entitlement already exists for this learning year.' end,
        updated_at = now()
    where id = inserted_event_id;
    update public.billing_checkout_intents
    set status = 'review_required',
        updated_at = now()
    where id = checkout_intent_row.id;
    return query select checkout_intent_row.id, existing_entitlement.id,
      case when existing_entitlement.provider_reference = p_payment_intent_id then 'already_granted' else 'review_required' end;
    return;
  end if;

  update public.billing_checkout_intents
  set provider_payment_intent_id = p_payment_intent_id,
      status = 'paid',
      completed_at = now(),
      updated_at = now()
  where id = checkout_intent_row.id;

  insert into public.family_entitlements (
    family_id, entitlement_key, academic_year_id, period_starts_on, period_ends_on,
    period_label, quota_bytes, status, starts_at, provider, provider_reference, source
  ) values (
    checkout_intent_row.family_id, 'evidence_media', checkout_intent_row.academic_year_id,
    checkout_intent_row.period_starts_on, checkout_intent_row.period_ends_on,
    checkout_intent_row.period_label, checkout_intent_row.quota_bytes, 'active', now(),
    'stripe', p_payment_intent_id, 'stripe'
  ) returning id into created_entitlement_id;

  update public.billing_provider_events
  set processing_status = 'processed', processed_at = now(), updated_at = now()
  where id = inserted_event_id;

  return query select checkout_intent_row.id, created_entitlement_id, 'granted'::text;
end;
$$;

revoke all on function public.mylearna_finalize_stripe_paid_checkout(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.mylearna_finalize_stripe_paid_checkout(uuid, text, text, text, text, text)
  to service_role;

alter table public.family_billing_accounts enable row level security;
alter table public.billing_checkout_intents enable row level security;
alter table public.billing_provider_events enable row level security;

revoke all on table public.family_billing_accounts from public, anon, authenticated;
revoke all on table public.billing_checkout_intents from public, anon, authenticated;
revoke all on table public.billing_provider_events from public, anon, authenticated;
grant all on table public.family_billing_accounts to service_role;
grant all on table public.billing_checkout_intents to service_role;
grant all on table public.billing_provider_events to service_role;

commit;
