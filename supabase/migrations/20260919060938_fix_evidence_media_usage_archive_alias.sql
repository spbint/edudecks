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
    from public.family_evidence_storage_usage as usage_entry
    where usage_entry.family_id = p_family_id
      and usage_entry.academic_year_id = resolution.academic_year_id;
  end if;

  select coalesce(sum(historical_media_asset.byte_size), 0)
  into archive_bytes
  from public.family_media_assets as historical_media_asset
  where historical_media_asset.family_id = p_family_id
    and historical_media_asset.academic_year_id is not null
    and (
      resolution.academic_year_id is null
      or historical_media_asset.academic_year_id <> resolution.academic_year_id
    )
    and historical_media_asset.lifecycle_status in ('active', 'grace', 'purge_pending');

  select
    coalesce((
      select sum(legacy_media_asset.byte_size)
      from public.family_media_assets as legacy_media_asset
      where legacy_media_asset.family_id = p_family_id
        and legacy_media_asset.academic_year_id is null
        and legacy_media_asset.lifecycle_status in ('active', 'grace', 'purge_pending')
    ), 0)
    + coalesce((
      select sum(unresolved_media_asset.byte_size)
      from public.family_unresolved_legacy_media_assets as unresolved_media_asset
      where unresolved_media_asset.family_id = p_family_id
        and unresolved_media_asset.preservation_status = 'preserved_unresolved'
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
