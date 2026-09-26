begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create extension if not exists btree_gist with schema extensions;

alter table public.academic_years
  add column if not exists time_zone text,
  add column if not exists time_zone_confirmed_at timestamptz;

create or replace function public.mylearna_is_valid_time_zone(p_time_zone text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(btrim(p_time_zone), '') is not null
    and exists (
      select 1
      from pg_catalog.pg_timezone_names as zone
      where zone.name = btrim(p_time_zone)
    );
$$;

revoke all on function public.mylearna_is_valid_time_zone(text) from public, anon;
grant execute on function public.mylearna_is_valid_time_zone(text) to authenticated, service_role;

alter table public.academic_years
  drop constraint if exists academic_years_date_range_check;

alter table public.academic_years
  add constraint academic_years_date_range_check
    check (ends_on > starts_on),
  add constraint academic_years_time_zone_check
    check (time_zone is null or public.mylearna_is_valid_time_zone(time_zone)),
  add constraint academic_years_time_zone_confirmation_check
    check (time_zone_confirmed_at is null or time_zone is not null);

-- Compatibility suggestions only. These values mirror the existing billing
-- geography defaults so current non-destructive behavior keeps working. They
-- remain explicitly unconfirmed; parents must review them before any later
-- destructive lifecycle phase. A dependent year gets one explicit chance to
-- confirm or correct this unconfirmed value; after confirmation it is locked.
with authority_source as (
  select
    academic_year.id,
    upper(btrim(coalesce(academic_year.country_code, profile.country_code, ''))) as country_code,
    upper(regexp_replace(btrim(coalesce(academic_year.jurisdiction_code, profile.jurisdiction_code, '')), '^(AU|US)-', '')) as jurisdiction_code
  from public.academic_years as academic_year
  join public.family_profiles as profile on profile.id = academic_year.family_id
), suggestions as (
  select
    source.id,
    case
      when source.country_code = 'UK' then 'Europe/London'
      when source.country_code = 'AU' then
        case source.jurisdiction_code
          when 'ACT' then 'Australia/Sydney'
          when 'NSW' then 'Australia/Sydney'
          when 'NT' then 'Australia/Darwin'
          when 'QLD' then 'Australia/Brisbane'
          when 'SA' then 'Australia/Adelaide'
          when 'TAS' then 'Australia/Hobart'
          when 'VIC' then 'Australia/Melbourne'
          when 'WA' then 'Australia/Perth'
          else null
        end
      when source.country_code = 'US' then
        case source.jurisdiction_code
          when 'AL' then 'America/Chicago'
          when 'AK' then 'America/Anchorage'
          when 'AR' then 'America/Chicago'
          when 'AZ' then 'America/Phoenix'
          when 'CA' then 'America/Los_Angeles'
          when 'CO' then 'America/Denver'
          when 'CT' then 'America/New_York'
          when 'DC' then 'America/New_York'
          when 'DE' then 'America/New_York'
          when 'FL' then 'America/New_York'
          when 'GA' then 'America/New_York'
          when 'HI' then 'Pacific/Honolulu'
          when 'IA' then 'America/Chicago'
          when 'ID' then 'America/Boise'
          when 'IL' then 'America/Chicago'
          when 'IN' then 'America/Indiana/Indianapolis'
          when 'KS' then 'America/Chicago'
          when 'KY' then 'America/Kentucky/Louisville'
          when 'LA' then 'America/Chicago'
          when 'MA' then 'America/New_York'
          when 'MD' then 'America/New_York'
          when 'ME' then 'America/New_York'
          when 'MI' then 'America/Detroit'
          when 'MN' then 'America/Chicago'
          when 'MO' then 'America/Chicago'
          when 'MS' then 'America/Chicago'
          when 'MT' then 'America/Denver'
          when 'ND' then 'America/North_Dakota/Center'
          when 'NE' then 'America/Chicago'
          when 'NC' then 'America/New_York'
          when 'NH' then 'America/New_York'
          when 'NJ' then 'America/New_York'
          when 'NM' then 'America/Denver'
          when 'NV' then 'America/Los_Angeles'
          when 'NY' then 'America/New_York'
          when 'OH' then 'America/New_York'
          when 'OK' then 'America/Chicago'
          when 'OR' then 'America/Los_Angeles'
          when 'PA' then 'America/New_York'
          when 'RI' then 'America/New_York'
          when 'SC' then 'America/New_York'
          when 'SD' then 'America/Chicago'
          when 'TN' then 'America/Chicago'
          when 'TX' then 'America/Chicago'
          when 'UT' then 'America/Denver'
          when 'VA' then 'America/New_York'
          when 'VT' then 'America/New_York'
          when 'WA' then 'America/Los_Angeles'
          when 'WI' then 'America/Chicago'
          when 'WV' then 'America/New_York'
          when 'WY' then 'America/Denver'
          else null
        end
      else null
    end as suggested_time_zone
  from authority_source as source
)
update public.academic_years as academic_year
set time_zone = suggestion.suggested_time_zone,
    time_zone_confirmed_at = null
from suggestions as suggestion
where suggestion.id = academic_year.id
  and academic_year.time_zone is null
  and suggestion.suggested_time_zone is not null;

alter table public.academic_years
  add constraint academic_years_family_date_range_excl
  exclude using gist (
    family_id with =,
    daterange(starts_on, ends_on, '[]') with &&
  );

create or replace function public.mylearna_resolve_current_academic_year(
  p_family_id uuid,
  p_at timestamptz default now()
)
returns table (
  id uuid,
  family_id uuid,
  title text,
  country_code text,
  jurisdiction_code text,
  starts_on date,
  ends_on date,
  time_zone text,
  time_zone_confirmed_at timestamptz,
  is_time_zone_confirmed boolean,
  current_resolution_source text,
  week_start text,
  notes text,
  created_by_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    academic_year.id,
    academic_year.family_id,
    academic_year.title,
    academic_year.country_code,
    academic_year.jurisdiction_code,
    academic_year.starts_on,
    academic_year.ends_on,
    academic_year.time_zone,
    academic_year.time_zone_confirmed_at,
    academic_year.time_zone is not null
      and academic_year.time_zone_confirmed_at is not null,
    case
      when academic_year.time_zone_confirmed_at is not null then 'confirmed_timezone'
      when academic_year.time_zone is not null then 'unconfirmed_timezone'
      else 'legacy_date'
    end,
    academic_year.week_start,
    academic_year.notes,
    academic_year.created_by_user_id,
    academic_year.created_at,
    academic_year.updated_at
  from public.academic_years as academic_year
  where academic_year.family_id = p_family_id
    and academic_year.starts_on <= case
      when public.mylearna_is_valid_time_zone(academic_year.time_zone)
        then (coalesce(p_at, now()) at time zone academic_year.time_zone)::date
      else coalesce(p_at, now())::date
    end
    and academic_year.ends_on >= case
      when public.mylearna_is_valid_time_zone(academic_year.time_zone)
        then (coalesce(p_at, now()) at time zone academic_year.time_zone)::date
      else coalesce(p_at, now())::date
    end
    and ((select auth.uid()) is null or public.is_family_member(p_family_id))
  limit 1;
$$;

comment on function public.mylearna_resolve_current_academic_year(uuid, timestamptz) is
  'Phase A1 non-destructive current-year resolver. Confirmed timezone wins; unconfirmed suggestions are allowed for continuity; NULL timezone temporarily falls back to the legacy database date. Never use resolution_source other than confirmed_timezone for purge or destructive lifecycle authority. Phase A2 must remove the legacy fallback after readiness is proven.';

revoke all on function public.mylearna_resolve_current_academic_year(uuid, timestamptz)
  from public, anon;
grant execute on function public.mylearna_resolve_current_academic_year(uuid, timestamptz)
  to authenticated, service_role;

create or replace function public.mylearna_learning_year_cutoff_utc(
  p_ends_on date,
  p_time_zone text,
  p_time_zone_confirmed_at timestamptz
)
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when p_ends_on is null
      or p_time_zone_confirmed_at is null
      or not public.mylearna_is_valid_time_zone(p_time_zone)
    then null::timestamptz
    else ((p_ends_on + 1)::timestamp at time zone p_time_zone)
  end;
$$;

revoke all on function public.mylearna_learning_year_cutoff_utc(date, text, timestamptz)
  from public, anon;
grant execute on function public.mylearna_learning_year_cutoff_utc(date, text, timestamptz)
  to authenticated, service_role;

create or replace function public.mylearna_academic_year_has_media_or_billing(
  p_academic_year_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.family_media_assets where academic_year_id = p_academic_year_id)
    or exists (select 1 from public.evidence_attachment_upload_reservations where academic_year_id = p_academic_year_id)
    or exists (select 1 from public.billing_checkout_intents where academic_year_id = p_academic_year_id)
    or exists (select 1 from public.family_entitlements where academic_year_id = p_academic_year_id);
$$;

revoke all on function public.mylearna_academic_year_has_media_or_billing(uuid)
  from public, anon, authenticated;
grant execute on function public.mylearna_academic_year_has_media_or_billing(uuid)
  to service_role;

create or replace function public.mylearna_guard_academic_year_authority()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  has_dependent_facts boolean;
begin
  has_dependent_facts := public.mylearna_academic_year_has_media_or_billing(old.id);

  if tg_op = 'DELETE' then
    if has_dependent_facts then
      raise exception 'This learning year cannot be deleted because media or billing activity already belongs to it.'
        using errcode = '23514';
    end if;
    return old;
  end if;

  if new.family_id is distinct from old.family_id then
    raise exception 'A learning year cannot be moved to another family.'
      using errcode = '23514';
  end if;

  if has_dependent_facts and (
    new.starts_on is distinct from old.starts_on
    or new.ends_on is distinct from old.ends_on
    or new.country_code is distinct from old.country_code
    or new.jurisdiction_code is distinct from old.jurisdiction_code
  ) then
    raise exception 'This learning year''s dates or timezone can no longer be changed because media or billing activity already belongs to it.'
      using errcode = '23514';
  end if;

  if has_dependent_facts and old.time_zone_confirmed_at is not null and (
    new.time_zone is distinct from old.time_zone
    or new.time_zone_confirmed_at is distinct from old.time_zone_confirmed_at
  ) then
    raise exception 'This learning year''s dates or timezone can no longer be changed because media or billing activity already belongs to it.'
      using errcode = '23514';
  end if;

  if has_dependent_facts
    and old.time_zone_confirmed_at is null
    and new.time_zone is distinct from old.time_zone
    and new.time_zone_confirmed_at is null
  then
    raise exception 'Confirm the corrected learning year timezone when saving it.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.mylearna_guard_academic_year_authority()
  from public, anon, authenticated;
grant execute on function public.mylearna_guard_academic_year_authority()
  to service_role;

drop trigger if exists mylearna_academic_year_authority_before_write on public.academic_years;
create trigger mylearna_academic_year_authority_before_write
before update or delete on public.academic_years
for each row execute function public.mylearna_guard_academic_year_authority();

create or replace function public.mylearna_create_academic_year(
  p_family_id uuid,
  p_title text,
  p_country_code text,
  p_jurisdiction_code text,
  p_starts_on date,
  p_ends_on date,
  p_time_zone text,
  p_confirm_time_zone boolean,
  p_week_start text default 'monday',
  p_notes text default null
)
returns setof public.academic_years
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_id uuid;
begin
  if (select auth.uid()) is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception 'A learning year title is required.' using errcode = '23514';
  end if;
  if p_starts_on is null or p_ends_on is null or p_ends_on <= p_starts_on then
    raise exception 'The learning year end date must be after the start date.' using errcode = '23514';
  end if;
  if not coalesce(p_confirm_time_zone, false)
    or not public.mylearna_is_valid_time_zone(p_time_zone)
  then
    raise exception 'Choose and confirm a valid learning year timezone.' using errcode = '23514';
  end if;

  insert into public.academic_years (
    family_id, title, country_code, jurisdiction_code, starts_on, ends_on,
    time_zone, time_zone_confirmed_at, week_start, notes, created_by_user_id
  ) values (
    p_family_id, btrim(p_title), nullif(btrim(p_country_code), ''),
    nullif(btrim(p_jurisdiction_code), ''), p_starts_on, p_ends_on,
    btrim(p_time_zone), now(), coalesce(nullif(btrim(p_week_start), ''), 'monday'),
    nullif(btrim(p_notes), ''), (select auth.uid())
  ) returning academic_years.id into created_id;

  return query select * from public.academic_years where academic_years.id = created_id;
exception
  when exclusion_violation then
    raise exception 'This learning year overlaps another learning year. Adjust the dates so each day belongs to only one year.'
      using errcode = '23514';
end;
$$;

create or replace function public.mylearna_update_academic_year(
  p_family_id uuid,
  p_academic_year_id uuid,
  p_title text,
  p_country_code text,
  p_jurisdiction_code text,
  p_starts_on date,
  p_ends_on date,
  p_time_zone text,
  p_confirm_time_zone boolean,
  p_week_start text,
  p_notes text
)
returns setof public.academic_years
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_year public.academic_years;
begin
  if (select auth.uid()) is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  select * into existing_year
  from public.academic_years
  where id = p_academic_year_id and family_id = p_family_id
  for update;

  if existing_year.id is null then
    raise exception 'Learning year unavailable.' using errcode = 'P0002';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception 'A learning year title is required.' using errcode = '23514';
  end if;
  if p_starts_on is null or p_ends_on is null or p_ends_on <= p_starts_on then
    raise exception 'The learning year end date must be after the start date.' using errcode = '23514';
  end if;
  if not coalesce(p_confirm_time_zone, false)
    or not public.mylearna_is_valid_time_zone(p_time_zone)
  then
    raise exception 'Choose and confirm a valid learning year timezone.' using errcode = '23514';
  end if;

  update public.academic_years
  set title = btrim(p_title),
      country_code = nullif(btrim(p_country_code), ''),
      jurisdiction_code = nullif(btrim(p_jurisdiction_code), ''),
      starts_on = p_starts_on,
      ends_on = p_ends_on,
      time_zone = btrim(p_time_zone),
      time_zone_confirmed_at = case
        when existing_year.time_zone is distinct from btrim(p_time_zone)
          or existing_year.time_zone_confirmed_at is null
        then now()
        else existing_year.time_zone_confirmed_at
      end,
      week_start = coalesce(nullif(btrim(p_week_start), ''), existing_year.week_start),
      notes = nullif(btrim(p_notes), '')
  where id = p_academic_year_id and family_id = p_family_id;

  return query select * from public.academic_years where id = p_academic_year_id;
exception
  when exclusion_violation then
    raise exception 'This learning year overlaps another learning year. Adjust the dates so each day belongs to only one year.'
      using errcode = '23514';
end;
$$;

create or replace function public.mylearna_delete_academic_year(
  p_family_id uuid,
  p_academic_year_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  delete from public.academic_years
  where id = p_academic_year_id and family_id = p_family_id;
  return found;
end;
$$;

revoke all on function public.mylearna_create_academic_year(uuid, text, text, text, date, date, text, boolean, text, text)
  from public, anon;
revoke all on function public.mylearna_update_academic_year(uuid, uuid, text, text, text, date, date, text, boolean, text, text)
  from public, anon;
revoke all on function public.mylearna_delete_academic_year(uuid, uuid)
  from public, anon;
grant execute on function public.mylearna_create_academic_year(uuid, text, text, text, date, date, text, boolean, text, text)
  to authenticated;
grant execute on function public.mylearna_update_academic_year(uuid, uuid, text, text, text, date, date, text, boolean, text, text)
  to authenticated;
grant execute on function public.mylearna_delete_academic_year(uuid, uuid)
  to authenticated;

-- Phase A2 hardening is deliberately deferred until production timezone
-- readiness is proven. That later migration must revoke direct academic_years
-- DML from authenticated/anon, cut entitlement and reservation authority over
-- to confirmed Learning Year timezones, and remove the legacy-date fallback.

commit;
