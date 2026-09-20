begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.billing_checkout_intents
  drop constraint billing_checkout_intents_currency_check;

alter table public.billing_checkout_intents
  add constraint billing_checkout_intents_currency_check
  check (currency in ('AUD', 'USD', 'GBP'));

create or replace function public.mylearna_validate_billing_checkout_intent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  academic_year_row public.academic_years;
  family_country_code text;
  expected_currency text;
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

  select upper(btrim(coalesce(profile.country_code, '')))
  into family_country_code
  from public.family_profiles as profile
  where profile.id = new.family_id;

  case family_country_code
    when 'AU' then expected_currency := 'AUD';
    when 'US' then expected_currency := 'USD';
    when 'UK' then expected_currency := 'GBP';
    else raise exception 'Billing checkout country is not supported.' using errcode = '23514';
  end case;

  if new.currency <> expected_currency then
    raise exception 'Billing checkout currency does not match the family country.' using errcode = '23514';
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
    when 'MEDIA_100' then expected_quota_bytes := 104857600;
    when 'MEDIA_250' then expected_quota_bytes := 262144000;
    when 'MEDIA_500' then expected_quota_bytes := 524288000;
    when 'MEDIA_1000' then expected_quota_bytes := 1073741824;
    else raise exception 'Billing checkout media product is not supported.' using errcode = '23514';
  end case;

  case expected_currency
    when 'AUD' then
      case new.product_key
        when 'MEDIA_100' then expected_amount_minor := 1495;
        when 'MEDIA_250' then expected_amount_minor := 2195;
        when 'MEDIA_500' then expected_amount_minor := 3495;
        when 'MEDIA_1000' then expected_amount_minor := 5495;
      end case;
    when 'USD' then
      case new.product_key
        when 'MEDIA_100' then expected_amount_minor := 999;
        when 'MEDIA_250' then expected_amount_minor := 1499;
        when 'MEDIA_500' then expected_amount_minor := 2299;
        when 'MEDIA_1000' then expected_amount_minor := 3999;
      end case;
    when 'GBP' then
      case new.product_key
        when 'MEDIA_100' then expected_amount_minor := 799;
        when 'MEDIA_250' then expected_amount_minor := 1199;
        when 'MEDIA_500' then expected_amount_minor := 1899;
        when 'MEDIA_1000' then expected_amount_minor := 2999;
      end case;
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

-- The historical entitlement foundation recorded the temporary 250 MiB beta
-- fallback. Launch uses an implicit 5 MiB family/year Free allowance instead.
-- Explicit commercial grants always take precedence and expired/revoked grants
-- continue to fail closed, so no entitlement row is created for Free access.
create or replace function public.mylearna_resolve_evidence_media_entitlement(
  p_family_id uuid,
  p_observed_on date default current_date
)
returns table (
  family_id uuid,
  academic_year_id uuid,
  entitlement_source text,
  entitlement_status text,
  entitlement_quota_bytes bigint,
  quota_bytes bigint,
  is_compatibility_fallback boolean,
  period_starts_on date,
  period_ends_on date,
  period_label text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_year public.academic_years;
  entitlement_row public.family_entitlements;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  select *
  into target_year
  from public.academic_years as academic_year
  where academic_year.family_id = p_family_id
    and academic_year.starts_on <= coalesce(p_observed_on, current_date)
    and academic_year.ends_on >= coalesce(p_observed_on, current_date)
  order by academic_year.starts_on desc, academic_year.created_at desc
  limit 1;

  if target_year.id is null then
    return query
    select
      p_family_id,
      null::uuid,
      'none'::text,
      'none'::text,
      null::bigint,
      0::bigint,
      false,
      null::date,
      null::date,
      null::text;
    return;
  end if;

  select *
  into entitlement_row
  from public.family_entitlements as entitlement
  where entitlement.family_id = p_family_id
    and entitlement.academic_year_id = target_year.id
    and entitlement.entitlement_key = 'evidence_media'
  order by
    case entitlement.status when 'active' then 0 when 'grace' then 1 else 2 end,
    entitlement.created_at desc
  limit 1;

  if entitlement_row.id is not null
    and entitlement_row.status in ('active', 'grace')
  then
    return query
    select
      p_family_id,
      target_year.id,
      entitlement_row.source,
      entitlement_row.status,
      entitlement_row.quota_bytes,
      entitlement_row.quota_bytes,
      false,
      entitlement_row.period_starts_on,
      entitlement_row.period_ends_on,
      entitlement_row.period_label;
    return;
  end if;

  if entitlement_row.id is not null then
    return query
    select
      p_family_id,
      target_year.id,
      entitlement_row.source,
      entitlement_row.status,
      entitlement_row.quota_bytes,
      0::bigint,
      false,
      entitlement_row.period_starts_on,
      entitlement_row.period_ends_on,
      entitlement_row.period_label;
    return;
  end if;

  return query
  select
    p_family_id,
    target_year.id,
    'free'::text,
    'free'::text,
    null::bigint,
    5242880::bigint,
    true,
    target_year.starts_on,
    target_year.ends_on,
    target_year.title;
end;
$$;

revoke all on function public.mylearna_resolve_evidence_media_entitlement(uuid, date)
  from public, anon;
grant execute on function public.mylearna_resolve_evidence_media_entitlement(uuid, date)
  to authenticated;

commit;
