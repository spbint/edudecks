begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Commercial entitlement facts are deliberately separate from provider prices.
-- Academic-year dates and labels are copied here so later family-calendar edits
-- cannot alter the commercial period that was granted.
create table if not exists public.family_entitlements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  entitlement_key text not null,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  period_starts_on date not null,
  period_ends_on date not null,
  period_label text not null,
  quota_bytes bigint not null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  grace_ends_at timestamptz,
  provider text not null default 'manual',
  provider_reference text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_entitlements_key_check
    check (entitlement_key = 'evidence_media'),
  constraint family_entitlements_period_check
    check (period_ends_on >= period_starts_on),
  constraint family_entitlements_quota_check
    check (quota_bytes > 0),
  constraint family_entitlements_status_check
    check (status in ('active', 'grace', 'expired', 'revoked')),
  constraint family_entitlements_provider_check
    check (provider in ('manual', 'stripe', 'none')),
  constraint family_entitlements_source_check
    check (source in ('manual', 'complimentary', 'founding', 'legacy', 'stripe')),
  constraint family_entitlements_grace_check
    check (grace_ends_at is null or ends_at is null or grace_ends_at >= ends_at)
);

create unique index if not exists family_entitlements_one_current_evidence_media_idx
  on public.family_entitlements (family_id, academic_year_id, entitlement_key)
  where entitlement_key = 'evidence_media' and status in ('active', 'grace');

create unique index if not exists family_entitlements_provider_reference_idx
  on public.family_entitlements (provider, provider_reference)
  where provider_reference is not null and btrim(provider_reference) <> '';

create index if not exists family_entitlements_family_period_idx
  on public.family_entitlements (family_id, academic_year_id, entitlement_key, status);

create or replace function public.mylearna_validate_family_entitlement_period()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  academic_year_row public.academic_years;
begin
  select *
  into academic_year_row
  from public.academic_years as academic_year
  where academic_year.id = new.academic_year_id
    and academic_year.family_id = new.family_id;

  if academic_year_row.id is null then
    raise exception 'Entitlement learning year is not available for this family.'
      using errcode = '23514';
  end if;

  if new.period_starts_on <> academic_year_row.starts_on
    or new.period_ends_on <> academic_year_row.ends_on
    or new.period_label <> academic_year_row.title
  then
    raise exception 'Entitlement period must snapshot the selected learning year.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.mylearna_validate_family_entitlement_period()
  from public, anon, authenticated;
grant execute on function public.mylearna_validate_family_entitlement_period() to service_role;

drop trigger if exists mylearna_validate_family_entitlement_period_before_write
  on public.family_entitlements;
create trigger mylearna_validate_family_entitlement_period_before_write
before insert or update of family_id, academic_year_id, period_starts_on, period_ends_on, period_label
on public.family_entitlements
for each row execute function public.mylearna_validate_family_entitlement_period();

-- Each current or historical evidence object receives a durable lifecycle row.
-- This does not move, rewrite, or delete any Storage object or evidence content.
create table if not exists public.family_media_assets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid references public.learners(id) on delete set null,
  evidence_entry_id uuid references public.evidence_entries(id) on delete set null,
  academic_year_id uuid references public.academic_years(id) on delete restrict,
  entitlement_id uuid references public.family_entitlements(id) on delete set null,
  object_path text not null unique,
  byte_size bigint not null,
  mime_type text not null default 'application/octet-stream',
  uploaded_at timestamptz not null default now(),
  lifecycle_status text not null default 'active',
  asset_source text not null default 'upload_reservation',
  purge_after timestamptz,
  purged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_media_assets_path_check
    check (btrim(object_path) <> ''),
  constraint family_media_assets_byte_size_check
    check (byte_size > 0 and byte_size <= 10485760),
  constraint family_media_assets_lifecycle_check
    check (lifecycle_status in ('active', 'grace', 'purge_pending', 'purged')),
  constraint family_media_assets_source_check
    check (asset_source in ('legacy_backfill', 'upload_reservation')),
  constraint family_media_assets_purge_state_check
    check (
      (lifecycle_status = 'purged' and purged_at is not null)
      or (lifecycle_status <> 'purged' and purged_at is null)
    )
);

create index if not exists family_media_assets_family_year_status_idx
  on public.family_media_assets (family_id, academic_year_id, lifecycle_status);

create index if not exists family_media_assets_evidence_status_idx
  on public.family_media_assets (evidence_entry_id, lifecycle_status);

create index if not exists family_media_assets_entitlement_status_idx
  on public.family_media_assets (entitlement_id, lifecycle_status);

-- Preserve canonical orphaned Storage objects without inventing an evidence
-- entry, academic year, or entitlement. This table has no purge state by
-- design: future lifecycle code must resolve these records before it can act.
create table if not exists public.family_unresolved_legacy_media_assets (
  id uuid primary key default gen_random_uuid(),
  -- These are raw canonical-path identities, not foreign keys: an orphaned
  -- object may outlive the current relational row that would otherwise prove
  -- its ownership. Keeping them nullable preserves the object without
  -- fabricating a family or learner relationship.
  family_id uuid,
  learner_id uuid,
  object_path text not null unique,
  byte_size bigint not null,
  mime_type text not null default 'application/octet-stream',
  unresolved_reason text not null default 'missing_evidence_entry',
  preservation_status text not null default 'preserved_unresolved',
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_unresolved_legacy_media_assets_path_check
    check (btrim(object_path) <> ''),
  constraint family_unresolved_legacy_media_assets_byte_size_check
    check (byte_size > 0 and byte_size <= 10485760),
  constraint family_unresolved_legacy_media_assets_reason_check
    check (unresolved_reason in ('missing_evidence_entry', 'missing_current_owner')),
  constraint family_unresolved_legacy_media_assets_preservation_check
    check (preservation_status = 'preserved_unresolved')
);

create index if not exists family_unresolved_legacy_media_assets_family_idx
  on public.family_unresolved_legacy_media_assets (family_id, preservation_status);

create or replace function public.mylearna_validate_family_media_asset()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  learner_row public.learners;
  evidence_row public.evidence_entries;
  academic_year_row public.academic_years;
  entitlement_row public.family_entitlements;
  path_segments text[];
begin
  if new.lifecycle_status <> 'purged'
    and (new.learner_id is null or new.evidence_entry_id is null)
  then
    raise exception 'Active media assets require learner and evidence ownership.'
      using errcode = '23514';
  end if;

  if new.learner_id is not null then
    select * into learner_row
    from public.learners as learner
    where learner.id = new.learner_id
      and learner.family_id = new.family_id;
    if learner_row.id is null then
      raise exception 'Media asset learner is not available for this family.'
        using errcode = '23514';
    end if;
  end if;

  if new.evidence_entry_id is not null then
    select * into evidence_row
    from public.evidence_entries as evidence
    where evidence.id = new.evidence_entry_id
      and evidence.family_id = new.family_id;
    if evidence_row.id is null then
      raise exception 'Media asset evidence is not available for this family.'
        using errcode = '23514';
    end if;
    if new.learner_id is not null and evidence_row.learner_id <> new.learner_id then
      raise exception 'Media asset learner does not match its evidence record.'
        using errcode = '23514';
    end if;
  end if;

  if new.academic_year_id is not null then
    select * into academic_year_row
    from public.academic_years as academic_year
    where academic_year.id = new.academic_year_id
      and academic_year.family_id = new.family_id;
    if academic_year_row.id is null then
      raise exception 'Media asset learning year is not available for this family.'
        using errcode = '23514';
    end if;
    if evidence_row.id is not null
      and (evidence_row.observed_on < academic_year_row.starts_on
        or evidence_row.observed_on > academic_year_row.ends_on)
    then
      raise exception 'Media asset learning year does not match its evidence date.'
        using errcode = '23514';
    end if;
  end if;

  if new.entitlement_id is not null then
    if new.academic_year_id is null then
      raise exception 'Entitled media assets require a learning year.' using errcode = '23514';
    end if;
    select * into entitlement_row
    from public.family_entitlements as entitlement
    where entitlement.id = new.entitlement_id
      and entitlement.family_id = new.family_id
      and entitlement.entitlement_key = 'evidence_media';
    if entitlement_row.id is null then
      raise exception 'Media asset entitlement is not available for this family.'
        using errcode = '23514';
    end if;
    if entitlement_row.academic_year_id <> new.academic_year_id then
      raise exception 'Media asset entitlement does not match its learning year.'
        using errcode = '23514';
    end if;
  end if;

  if new.lifecycle_status <> 'purged' then
    path_segments := storage.foldername(new.object_path);
    if pg_catalog.array_length(path_segments, 1) <> 6
      or path_segments[1] <> 'family'
      or path_segments[2] <> new.family_id::text
      or path_segments[3] <> 'learner'
      or path_segments[4] <> new.learner_id::text
      or path_segments[5] <> 'evidence'
      or path_segments[6] <> new.evidence_entry_id::text
    then
      raise exception 'Media asset path does not match its family, learner, and evidence record.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.mylearna_validate_unresolved_legacy_media_asset()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  path_segments text[];
begin
  path_segments := storage.foldername(new.object_path);
  if pg_catalog.array_length(path_segments, 1) <> 6
    or path_segments[1] <> 'family'
    or path_segments[3] <> 'learner'
    or path_segments[5] <> 'evidence'
    or (new.family_id is not null and path_segments[2] <> new.family_id::text)
    or (new.learner_id is not null and path_segments[4] <> new.learner_id::text)
  then
    raise exception 'Unresolved legacy media path does not match its preserved family and learner identity.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.mylearna_validate_family_media_asset()
  from public, anon, authenticated;
revoke all on function public.mylearna_validate_unresolved_legacy_media_asset()
  from public, anon, authenticated;
grant execute on function public.mylearna_validate_family_media_asset() to service_role;
grant execute on function public.mylearna_validate_unresolved_legacy_media_asset() to service_role;

drop trigger if exists mylearna_validate_family_media_asset_before_write
  on public.family_media_assets;
create trigger mylearna_validate_family_media_asset_before_write
before insert or update of family_id, learner_id, evidence_entry_id, academic_year_id, entitlement_id, object_path, lifecycle_status
on public.family_media_assets
for each row execute function public.mylearna_validate_family_media_asset();

drop trigger if exists mylearna_validate_unresolved_legacy_media_asset_before_write
  on public.family_unresolved_legacy_media_assets;
create trigger mylearna_validate_unresolved_legacy_media_asset_before_write
before insert or update of family_id, learner_id, object_path
on public.family_unresolved_legacy_media_assets
for each row execute function public.mylearna_validate_unresolved_legacy_media_asset();

alter table public.family_entitlements enable row level security;
alter table public.family_media_assets enable row level security;
alter table public.family_unresolved_legacy_media_assets enable row level security;

revoke all on table public.family_entitlements from public, anon, authenticated;
revoke all on table public.family_media_assets from public, anon, authenticated;
revoke all on table public.family_unresolved_legacy_media_assets from public, anon, authenticated;
grant all on table public.family_entitlements to service_role;
grant all on table public.family_media_assets to service_role;
grant all on table public.family_unresolved_legacy_media_assets to service_role;

drop policy if exists "family entitlements select own family" on public.family_entitlements;
create policy "family entitlements select own family"
on public.family_entitlements
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "family media assets select own family" on public.family_media_assets;
create policy "family media assets select own family"
on public.family_media_assets
for select
to authenticated
using (public.is_family_member(family_id));

-- Returns the effective quota used by the existing beta pipeline. Only a
-- family/year with no explicit entitlement receives the temporary 250 MiB
-- compatibility allowance; explicit expired or revoked grants fail closed.
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
      'legacy_beta_compatibility'::text,
      'legacy_beta_compatibility'::text,
      null::bigint,
      262144000::bigint,
      true,
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
    'legacy_beta_compatibility'::text,
    'legacy_beta_compatibility'::text,
    null::bigint,
    262144000::bigint,
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

-- This usage RPC is read-only: unlike the compatibility RPC below, it does not
-- create usage rows or release reservations merely because a family views usage.
create or replace function public.mylearna_get_evidence_media_usage(
  p_family_id uuid,
  p_observed_on date default current_date
)
returns table (
  family_id uuid,
  academic_year_id uuid,
  entitlement_source text,
  entitlement_status text,
  quota_bytes bigint,
  used_bytes bigint,
  reserved_bytes bigint,
  remaining_bytes bigint,
  historical_archive_bytes bigint,
  unresolved_legacy_archive_bytes bigint,
  is_compatibility_fallback boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  resolution record;
  usage_row public.family_evidence_storage_usage;
  archive_bytes bigint := 0;
  unresolved_archive_bytes bigint := 0;
begin
  select *
  into resolution
  from public.mylearna_resolve_evidence_media_entitlement(p_family_id, p_observed_on)
  limit 1;

  if resolution.academic_year_id is not null then
    select *
    into usage_row
    from public.family_evidence_storage_usage as usage
    where usage.family_id = p_family_id
      and usage.academic_year_id = resolution.academic_year_id;

  end if;

  select coalesce(sum(asset.byte_size), 0)
  into archive_bytes
  from public.family_media_assets as asset
  where asset.family_id = p_family_id
    and asset.academic_year_id is not null
    and (
      resolution.academic_year_id is null
      or asset.academic_year_id <> resolution.academic_year_id
    )
    and asset.lifecycle_status in ('active', 'grace', 'purge_pending');

  select
    coalesce((
      select sum(asset.byte_size)
      from public.family_media_assets as asset
      where asset.family_id = p_family_id
        and asset.academic_year_id is null
        and asset.lifecycle_status in ('active', 'grace', 'purge_pending')
    ), 0)
    + coalesce((
      select sum(asset.byte_size)
      from public.family_unresolved_legacy_media_assets as unresolved_asset
      where unresolved_asset.family_id = p_family_id
        and unresolved_asset.preservation_status = 'preserved_unresolved'
    ), 0)
  into unresolved_archive_bytes;

  return query
  select
    p_family_id,
    resolution.academic_year_id,
    resolution.entitlement_source,
    resolution.entitlement_status,
    resolution.quota_bytes,
    coalesce(usage_row.used_bytes, 0::bigint),
    coalesce(usage_row.reserved_bytes, 0::bigint),
    greatest(
      0::bigint,
      resolution.quota_bytes
        - coalesce(usage_row.used_bytes, 0::bigint)
        - coalesce(usage_row.reserved_bytes, 0::bigint)
    ),
    archive_bytes,
    unresolved_archive_bytes,
    resolution.is_compatibility_fallback;
end;
$$;

revoke all on function public.mylearna_get_evidence_media_usage(uuid, date)
  from public, anon;
grant execute on function public.mylearna_get_evidence_media_usage(uuid, date)
  to authenticated;

-- Keep the established UI RPC compatible while making its allowance resolver
-- entitlement-aware. It intentionally retains its existing write behaviour.
create or replace function public.mylearna_get_evidence_storage_usage(
  p_family_id uuid,
  p_observed_on date default current_date
)
returns table (
  family_id uuid,
  academic_year_id uuid,
  allowance_bytes bigint,
  used_bytes bigint,
  reserved_bytes bigint,
  remaining_bytes bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  resolution record;
  usage_row public.family_evidence_storage_usage;
begin
  select *
  into resolution
  from public.mylearna_resolve_evidence_media_entitlement(p_family_id, p_observed_on)
  limit 1;

  if resolution.academic_year_id is null then
    return query
    select p_family_id, null::uuid, resolution.quota_bytes, 0::bigint, 0::bigint,
      resolution.quota_bytes;
    return;
  end if;

  insert into public.family_evidence_storage_usage as usage (
    family_id,
    academic_year_id,
    allowance_bytes
  )
  values (p_family_id, resolution.academic_year_id, resolution.quota_bytes)
  on conflict on constraint family_evidence_storage_usage_pkey do update
  set allowance_bytes = excluded.allowance_bytes,
      updated_at = now();

  perform public.mylearna_release_expired_evidence_storage_reservations(
    p_family_id,
    resolution.academic_year_id
  );

  select *
  into usage_row
  from public.family_evidence_storage_usage as usage
  where usage.family_id = p_family_id
    and usage.academic_year_id = resolution.academic_year_id;

  return query
  select
    usage_row.family_id,
    usage_row.academic_year_id,
    usage_row.allowance_bytes,
    usage_row.used_bytes,
    usage_row.reserved_bytes,
    greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes);
end;
$$;

revoke all on function public.mylearna_get_evidence_storage_usage(uuid, date)
  from public, anon;
grant execute on function public.mylearna_get_evidence_storage_usage(uuid, date)
  to authenticated;

-- The reservation flow remains the authority for path, learner, evidence,
-- attachment size, rate, and actual-byte enforcement. Only allowance lookup is
-- routed through the new entitlement resolver.
create or replace function public.mylearna_reserve_evidence_attachment_upload(
  p_family_id uuid,
  p_learner_id uuid,
  p_evidence_entry_id uuid,
  p_object_path text,
  p_byte_size bigint
)
returns table (
  object_path text,
  family_id uuid,
  academic_year_id uuid,
  allowance_bytes bigint,
  used_bytes bigint,
  reserved_bytes bigint,
  remaining_bytes bigint
)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  evidence_row public.evidence_entries;
  resolution record;
  usage_row public.family_evidence_storage_usage;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if not public.mylearna_runtime_control_enabled('evidence_media_uploads') then
    perform public.mylearna_record_guardrail_event(
      'evidence_upload_blocked',
      p_family_id,
      'evidence_media_uploads_disabled'
    );
    raise exception 'Media uploads are temporarily unavailable. You can still save a text learning record and use the rest of MyLearna.'
      using errcode = 'P0001';
  end if;

  perform public.mylearna_enforce_mutation_rate_limit(
    'evidence_attachment_reservation',
    p_family_id,
    1
  );

  if coalesce(p_byte_size, 0) <= 0 then
    raise exception 'Attachment size could not be confirmed.' using errcode = '22023';
  end if;

  if p_byte_size > 10485760 then
    raise exception 'Choose a file smaller than 10 MB.' using errcode = '23514';
  end if;

  if p_object_path is null
    or (storage.foldername(p_object_path))[1] <> 'family'
    or (storage.foldername(p_object_path))[2] <> p_family_id::text
    or (storage.foldername(p_object_path))[3] <> 'learner'
    or (storage.foldername(p_object_path))[4] <> p_learner_id::text
    or (storage.foldername(p_object_path))[5] <> 'evidence'
    or (storage.foldername(p_object_path))[6] <> p_evidence_entry_id::text
  then
    raise exception 'Attachment storage path does not match this evidence record.'
      using errcode = '22023';
  end if;

  select *
  into evidence_row
  from public.evidence_entries as evidence
  where evidence.id = p_evidence_entry_id
    and evidence.family_id = p_family_id
    and evidence.learner_id = p_learner_id
    and public.is_family_member(evidence.family_id)
  for update;

  if evidence_row.id is null then
    raise exception 'Evidence record could not be confirmed before uploading.'
      using errcode = '42501';
  end if;

  select *
  into resolution
  from public.mylearna_resolve_evidence_media_entitlement(
    p_family_id,
    evidence_row.observed_on
  )
  limit 1;

  if resolution.academic_year_id is null then
    raise exception 'Add a learning year for this evidence date before uploading files.'
      using errcode = '23514';
  end if;

  insert into public.family_evidence_storage_usage as usage (
    family_id,
    academic_year_id,
    allowance_bytes
  )
  values (p_family_id, resolution.academic_year_id, resolution.quota_bytes)
  on conflict on constraint family_evidence_storage_usage_pkey do update
  set allowance_bytes = excluded.allowance_bytes,
      updated_at = now();

  perform public.mylearna_release_expired_evidence_storage_reservations(
    p_family_id,
    resolution.academic_year_id
  );

  select *
  into usage_row
  from public.family_evidence_storage_usage as usage
  where usage.family_id = p_family_id
    and usage.academic_year_id = resolution.academic_year_id
  for update;

  if p_byte_size > greatest(
    0,
    usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes
  ) then
    raise exception 'Your Portfolio storage is full for this learning year. Everything you''ve already captured is safe. You can continue using MyLearna and adding text learning records.'
      using errcode = '23514';
  end if;

  insert into public.evidence_attachment_upload_reservations (
    family_id,
    learner_id,
    evidence_entry_id,
    academic_year_id,
    object_path,
    byte_size,
    created_by_user_id
  )
  values (
    p_family_id,
    p_learner_id,
    p_evidence_entry_id,
    resolution.academic_year_id,
    p_object_path,
    p_byte_size,
    auth.uid()
  );

  update public.family_evidence_storage_usage as usage
  set reserved_bytes = usage.reserved_bytes + p_byte_size,
      updated_at = now()
  where usage.family_id = p_family_id
    and usage.academic_year_id = resolution.academic_year_id
  returning usage.* into usage_row;

  return query
  select
    p_object_path,
    usage_row.family_id,
    usage_row.academic_year_id,
    usage_row.allowance_bytes,
    usage_row.used_bytes,
    usage_row.reserved_bytes,
    greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes);
end;
$$;

revoke all on function public.mylearna_reserve_evidence_attachment_upload(uuid, uuid, uuid, text, bigint)
  from public, anon;
grant execute on function public.mylearna_reserve_evidence_attachment_upload(uuid, uuid, uuid, text, bigint)
  to authenticated;

-- Storage triggers run after the established quota trigger (the zz prefix is
-- intentional). They observe the final reservation status and maintain only
-- lifecycle metadata; they do not perform quota accounting or media deletion.
create or replace function public.mylearna_sync_evidence_media_asset_from_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  reservation_row public.evidence_attachment_upload_reservations;
  entitlement_row public.family_entitlements;
  actual_size bigint;
begin
  if new.bucket_id <> 'evidence' then
    return new;
  end if;

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations as reservation
  where reservation.object_path = new.name
    and reservation.status = 'uploaded'
  limit 1;

  if reservation_row.id is null then
    return new;
  end if;

  select *
  into entitlement_row
  from public.family_entitlements as entitlement
  where entitlement.family_id = reservation_row.family_id
    and entitlement.academic_year_id = reservation_row.academic_year_id
    and entitlement.entitlement_key = 'evidence_media'
    and entitlement.status in ('active', 'grace')
  order by entitlement.created_at desc
  limit 1;

  actual_size := public.mylearna_storage_metadata_size_bytes(new.metadata);

  insert into public.family_media_assets as asset (
    family_id,
    learner_id,
    evidence_entry_id,
    academic_year_id,
    entitlement_id,
    object_path,
    byte_size,
    mime_type,
    uploaded_at,
    lifecycle_status,
    asset_source
  )
  values (
    reservation_row.family_id,
    reservation_row.learner_id,
    reservation_row.evidence_entry_id,
    reservation_row.academic_year_id,
    entitlement_row.id,
    new.name,
    coalesce(nullif(actual_size, 0), reservation_row.actual_byte_size, reservation_row.byte_size),
    coalesce(nullif(btrim(new.metadata ->> 'mimetype'), ''), 'application/octet-stream'),
    coalesce(reservation_row.uploaded_at, now()),
    'active',
    'upload_reservation'
  )
  on conflict (object_path) do update
  set family_id = excluded.family_id,
      learner_id = excluded.learner_id,
      evidence_entry_id = excluded.evidence_entry_id,
      academic_year_id = excluded.academic_year_id,
      entitlement_id = coalesce(asset.entitlement_id, excluded.entitlement_id),
      byte_size = excluded.byte_size,
      mime_type = excluded.mime_type,
      uploaded_at = excluded.uploaded_at,
      lifecycle_status = 'active',
      purge_after = null,
      purged_at = null,
      updated_at = now();

  return new;
end;
$$;

create or replace function public.mylearna_mark_evidence_media_asset_purged_from_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if old.bucket_id = 'evidence' then
    update public.family_media_assets as asset
    set lifecycle_status = 'purged',
        purge_after = null,
        purged_at = now(),
        updated_at = now()
    where asset.object_path = old.name
      and asset.lifecycle_status <> 'purged';
  end if;
  return old;
end;
$$;

revoke all on function public.mylearna_sync_evidence_media_asset_from_storage()
  from public, anon, authenticated;
revoke all on function public.mylearna_mark_evidence_media_asset_purged_from_storage()
  from public, anon, authenticated;
grant execute on function public.mylearna_sync_evidence_media_asset_from_storage() to service_role;
grant execute on function public.mylearna_mark_evidence_media_asset_purged_from_storage() to service_role;

drop trigger if exists zz_mylearna_evidence_media_asset_after_write on storage.objects;
create trigger zz_mylearna_evidence_media_asset_after_write
after insert or update on storage.objects
for each row execute function public.mylearna_sync_evidence_media_asset_from_storage();

drop trigger if exists zz_mylearna_evidence_media_asset_after_delete on storage.objects;
create trigger zz_mylearna_evidence_media_asset_after_delete
after delete on storage.objects
for each row execute function public.mylearna_mark_evidence_media_asset_purged_from_storage();

-- Deterministic, metadata-only legacy backfill. It considers only private
-- canonical evidence paths that still join to their owning evidence row. It
-- leaves all existing Storage objects and evidence content untouched.
insert into public.family_media_assets as asset (
  family_id,
  learner_id,
  evidence_entry_id,
  academic_year_id,
  entitlement_id,
  object_path,
  byte_size,
  mime_type,
  uploaded_at,
  lifecycle_status,
  asset_source
)
select
  evidence.family_id,
  evidence.learner_id,
  evidence.id,
  public.mylearna_resolve_evidence_academic_year_id(evidence.family_id, evidence.observed_on),
  null::uuid,
  object.name,
  public.mylearna_storage_metadata_size_bytes(object.metadata),
  coalesce(nullif(btrim(object.metadata ->> 'mimetype'), ''), 'application/octet-stream'),
  coalesce(reservation.uploaded_at, object.created_at, now()),
  'active',
  'legacy_backfill'
from storage.objects as object
join public.evidence_entries as evidence
  on evidence.id::text = (storage.foldername(object.name))[6]
 and evidence.family_id::text = (storage.foldername(object.name))[2]
 and evidence.learner_id::text = (storage.foldername(object.name))[4]
left join lateral (
  select reservation_row.*
  from public.evidence_attachment_upload_reservations as reservation_row
  where reservation_row.object_path = object.name
  order by reservation_row.uploaded_at desc nulls last, reservation_row.created_at desc
  limit 1
) as reservation on true
where object.bucket_id = 'evidence'
  and pg_catalog.array_length(storage.foldername(object.name), 1) = 6
  and (storage.foldername(object.name))[1] = 'family'
  and (storage.foldername(object.name))[3] = 'learner'
  and (storage.foldername(object.name))[5] = 'evidence'
on conflict (object_path) do nothing;

-- Canonical objects with no evidence row are preserved separately. Their raw
-- family/learner path identities are retained when UUID-shaped, even if the
-- current family or learner row is absent; no ownership, evidence, or
-- academic-year relationship is invented.
insert into public.family_unresolved_legacy_media_assets as unresolved_asset (
  family_id,
  learner_id,
  object_path,
  byte_size,
  mime_type,
  unresolved_reason,
  preservation_status,
  discovered_at
)
select
  case
    when (storage.foldername(object.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (storage.foldername(object.name))[2]::uuid
    else null::uuid
  end,
  case
    when (storage.foldername(object.name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (storage.foldername(object.name))[4]::uuid
    else null::uuid
  end,
  object.name,
  public.mylearna_storage_metadata_size_bytes(object.metadata),
  coalesce(nullif(btrim(object.metadata ->> 'mimetype'), ''), 'application/octet-stream'),
  case
    when family.id is not null and learner.id is not null then 'missing_evidence_entry'
    else 'missing_current_owner'
  end,
  'preserved_unresolved',
  coalesce(object.created_at, now())
from storage.objects as object
left join public.family_profiles as family
  on family.id::text = (storage.foldername(object.name))[2]
left join public.learners as learner
  on learner.id::text = (storage.foldername(object.name))[4]
 and learner.family_id = family.id
left join public.evidence_entries as evidence
  on evidence.id::text = (storage.foldername(object.name))[6]
 and evidence.family_id = family.id
 and evidence.learner_id = learner.id
where object.bucket_id = 'evidence'
  and pg_catalog.array_length(storage.foldername(object.name), 1) = 6
  and (storage.foldername(object.name))[1] = 'family'
  and (storage.foldername(object.name))[3] = 'learner'
  and (storage.foldername(object.name))[5] = 'evidence'
  and evidence.id is null
on conflict (object_path) do nothing;

commit;
