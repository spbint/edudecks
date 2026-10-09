-- Stripe one-time checkout for paid MyLearna Marketplace resources.
-- Stripe is payment provider only. MyLearna catalogue metadata and
-- family_marketplace_entitlements remain the commercial/access authority.

create table if not exists public.marketplace_checkout_intents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  requested_by_user_id uuid not null,
  marketplace_resource_id uuid not null references public.marketplace_resources(id) on delete restrict,
  external_product_id text not null,
  currency text not null,
  amount_minor integer not null,
  status text not null default 'pending',
  provider text not null default 'stripe',
  provider_checkout_session_id text,
  provider_payment_intent_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '45 minutes'),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint marketplace_checkout_intents_currency_check check (currency = 'AUD'),
  constraint marketplace_checkout_intents_amount_check check (amount_minor > 0),
  constraint marketplace_checkout_intents_status_check
    check (status in ('pending','checkout_created','paid','cancelled','expired','failed','review_required')),
  constraint marketplace_checkout_intents_provider_check check (provider = 'stripe'),
  constraint marketplace_checkout_intents_product_check check (btrim(external_product_id) <> ''),
  constraint marketplace_checkout_intents_expiry_check check (expires_at > created_at)
);

create unique index if not exists marketplace_checkout_intents_provider_session_unique
  on public.marketplace_checkout_intents(provider, provider_checkout_session_id)
  where provider_checkout_session_id is not null and btrim(provider_checkout_session_id) <> '';

create unique index if not exists marketplace_checkout_intents_provider_payment_unique
  on public.marketplace_checkout_intents(provider, provider_payment_intent_id)
  where provider_payment_intent_id is not null and btrim(provider_payment_intent_id) <> '';

create unique index if not exists marketplace_checkout_intents_one_open_unique
  on public.marketplace_checkout_intents(family_id, marketplace_resource_id)
  where status in ('pending','checkout_created');

create index if not exists marketplace_checkout_intents_family_status_idx
  on public.marketplace_checkout_intents(family_id, status, created_at desc);

alter table public.marketplace_checkout_intents enable row level security;
revoke all on table public.marketplace_checkout_intents from public, anon, authenticated;
grant all on table public.marketplace_checkout_intents to service_role;

create or replace function public.mylearna_finalize_marketplace_paid_checkout(
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
  intent_row public.marketplace_checkout_intents;
  created_entitlement_id uuid;
  inserted_event_id uuid;
begin
  if p_checkout_intent_id is null
    or btrim(coalesce(p_checkout_session_id, '')) = ''
    or btrim(coalesce(p_payment_intent_id, '')) = ''
    or btrim(coalesce(p_provider_event_id, '')) = ''
    or p_event_type not in ('checkout.session.completed','checkout.session.async_payment_succeeded')
    or coalesce(p_payload_hash, '') !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Verified Marketplace Stripe event is incomplete.' using errcode = '23514';
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

  select *
  into intent_row
  from public.marketplace_checkout_intents
  where id = p_checkout_intent_id
  for update;

  if intent_row.id is null
    or intent_row.provider <> 'stripe'
    or intent_row.provider_checkout_session_id <> p_checkout_session_id
  then
    update public.billing_provider_events
    set processing_status='review_required',
        processed_at=now(),
        error_code='marketplace_checkout_intent_mismatch',
        safe_error_summary='Verified Marketplace payment did not match a checkout intent.',
        updated_at=now()
    where id=inserted_event_id;
    return query select p_checkout_intent_id, null::uuid, 'review_required'::text;
    return;
  end if;

  if intent_row.status = 'paid' then
    update public.billing_provider_events
    set processing_status='processed', processed_at=now(), updated_at=now()
    where id=inserted_event_id;
    return query select intent_row.id, null::uuid, 'already_paid'::text;
    return;
  end if;

  if intent_row.status not in ('pending','checkout_created') then
    update public.billing_provider_events
    set processing_status='review_required',
        processed_at=now(),
        error_code='marketplace_intent_state_invalid',
        safe_error_summary='Verified Marketplace payment arrived for an intent requiring review.',
        updated_at=now()
    where id=inserted_event_id;
    update public.marketplace_checkout_intents
    set status='review_required', updated_at=now()
    where id=intent_row.id;
    return query select intent_row.id, null::uuid, 'review_required'::text;
    return;
  end if;

  update public.marketplace_checkout_intents
  set provider_payment_intent_id=p_payment_intent_id,
      status='paid',
      completed_at=now(),
      updated_at=now()
  where id=intent_row.id;

  select public.mylearna_grant_marketplace_entitlement(
    intent_row.family_id,
    intent_row.external_product_id,
    'purchase',
    'stripe',
    p_payment_intent_id,
    null,
    jsonb_build_object(
      'marketplace_checkout_intent_id', intent_row.id,
      'stripe_checkout_session_id', p_checkout_session_id
    )
  ) into created_entitlement_id;

  update public.billing_provider_events
  set processing_status='processed', processed_at=now(), updated_at=now()
  where id=inserted_event_id;

  return query select intent_row.id, created_entitlement_id, 'granted'::text;
end;
$$;

revoke all on function public.mylearna_finalize_marketplace_paid_checkout(uuid,text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.mylearna_finalize_marketplace_paid_checkout(uuid,text,text,text,text,text)
  to service_role;
