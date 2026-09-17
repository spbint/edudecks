begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Storage can insert the evidence object before metadata.size is available.
-- Keep the reservation in place until the authoritative metadata update.
create or replace function public.mylearna_apply_storage_insert_to_free_quota()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  reservation_row public.evidence_attachment_upload_reservations;
  usage_row public.family_evidence_storage_usage;
  actual_size bigint;
begin
  if new.bucket_id <> 'evidence' then
    return new;
  end if;

  if not public.mylearna_runtime_control_enabled('evidence_media_uploads') then
    raise exception 'Media uploads are temporarily unavailable.' using errcode = 'P0001';
  end if;

  if auth.uid() is null
    or not public.mylearna_evidence_storage_object_owned_by_auth(new.name)
  then
    raise exception 'Evidence attachment is not authorised.' using errcode = '42501';
  end if;

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations as reservation
  where reservation.object_path = new.name
    and reservation.status = 'reserved'
    and reservation.created_by_user_id = auth.uid()
    and reservation.expires_at >= now()
  for update;

  if reservation_row.id is null then
    raise exception 'Evidence attachment upload reservation is missing or expired.'
      using errcode = '42501';
  end if;

  actual_size := public.mylearna_storage_metadata_size_bytes(new.metadata);

  if actual_size <= 0 then
    return new;
  end if;

  if actual_size > 10485760 then
    raise exception 'Choose a file smaller than 10 MB.' using errcode = '23514';
  end if;

  select *
  into usage_row
  from public.family_evidence_storage_usage as usage
  where usage.family_id = reservation_row.family_id
    and usage.academic_year_id = reservation_row.academic_year_id
  for update;

  if usage_row.family_id is null
    or actual_size > greatest(
      0,
      usage_row.allowance_bytes
        - usage_row.used_bytes
        - (usage_row.reserved_bytes - reservation_row.byte_size)
    )
  then
    raise exception 'Your Portfolio storage is full for this learning year.'
      using errcode = '23514';
  end if;

  update public.family_evidence_storage_usage as usage
  set reserved_bytes = greatest(0, usage.reserved_bytes - reservation_row.byte_size),
      used_bytes = usage.used_bytes + actual_size,
      updated_at = now()
  where usage.family_id = reservation_row.family_id
    and usage.academic_year_id = reservation_row.academic_year_id;

  update public.evidence_attachment_upload_reservations as reservation
  set status = 'uploaded',
      actual_byte_size = actual_size,
      uploaded_at = now(),
      updated_at = now()
  where reservation.id = reservation_row.id;

  return new;
end;
$$;

-- The first authoritative metadata update finalises a reserved upload. Later
-- metadata changes reconcile only the delta for an already-uploaded object.
create or replace function public.mylearna_apply_storage_update_to_free_quota()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  reservation_row public.evidence_attachment_upload_reservations;
  usage_row public.family_evidence_storage_usage;
  old_size bigint;
  new_size bigint;
  delta_size bigint;
begin
  if new.bucket_id <> 'evidence' then
    return new;
  end if;

  if old.name is distinct from new.name then
    return new;
  end if;

  if auth.uid() is null
    or not public.mylearna_evidence_storage_object_owned_by_auth(new.name)
  then
    raise exception 'Evidence attachment is not authorised.' using errcode = '42501';
  end if;

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations as reservation
  where reservation.object_path = new.name
    and reservation.status in ('reserved', 'uploaded')
    and reservation.created_by_user_id = auth.uid()
    and (
      reservation.status = 'uploaded'
      or reservation.expires_at >= now()
    )
  for update;

  if reservation_row.id is null then
    return new;
  end if;

  old_size := public.mylearna_storage_metadata_size_bytes(old.metadata);
  new_size := public.mylearna_storage_metadata_size_bytes(new.metadata);

  if new_size <= 0 then
    return new;
  end if;

  if new_size > 10485760 then
    raise exception 'Choose a file smaller than 10 MB.' using errcode = '23514';
  end if;

  select *
  into usage_row
  from public.family_evidence_storage_usage as usage
  where usage.family_id = reservation_row.family_id
    and usage.academic_year_id = reservation_row.academic_year_id
  for update;

  if usage_row.family_id is null then
    raise exception 'Portfolio storage usage could not be confirmed.' using errcode = '42501';
  end if;

  if reservation_row.status = 'reserved' then
    if new_size > greatest(
      0,
      usage_row.allowance_bytes
        - usage_row.used_bytes
        - (usage_row.reserved_bytes - reservation_row.byte_size)
    ) then
      raise exception 'Your Portfolio storage is full for this learning year.'
        using errcode = '23514';
    end if;

    update public.family_evidence_storage_usage as usage
    set reserved_bytes = greatest(0, usage.reserved_bytes - reservation_row.byte_size),
        used_bytes = usage.used_bytes + new_size,
        updated_at = now()
    where usage.family_id = reservation_row.family_id
      and usage.academic_year_id = reservation_row.academic_year_id;

    update public.evidence_attachment_upload_reservations as reservation
    set status = 'uploaded',
        actual_byte_size = new_size,
        uploaded_at = now(),
        updated_at = now()
    where reservation.id = reservation_row.id;

    return new;
  end if;

  delta_size := new_size - coalesce(reservation_row.actual_byte_size, old_size);

  if delta_size > greatest(
    0,
    usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes
  ) then
    raise exception 'Your Portfolio storage is full for this learning year.'
      using errcode = '23514';
  end if;

  update public.family_evidence_storage_usage as usage
  set used_bytes = greatest(0, usage.used_bytes + delta_size),
      updated_at = now()
  where usage.family_id = reservation_row.family_id
    and usage.academic_year_id = reservation_row.academic_year_id;

  update public.evidence_attachment_upload_reservations as reservation
  set actual_byte_size = new_size,
      updated_at = now()
  where reservation.id = reservation_row.id;

  return new;
end;
$$;

revoke all on function public.mylearna_apply_storage_insert_to_free_quota() from public, anon, authenticated;
revoke all on function public.mylearna_apply_storage_update_to_free_quota() from public, anon, authenticated;
grant execute on function public.mylearna_apply_storage_insert_to_free_quota() to service_role;
grant execute on function public.mylearna_apply_storage_update_to_free_quota() to service_role;

commit;
