begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Storage quota triggers can run without the browser JWT context.  Keep the
-- auth-bound helper for Storage RLS, but validate the durable reservation
-- creator explicitly inside the SECURITY DEFINER trigger path.
create or replace function public.mylearna_evidence_storage_object_owned_by_user(
  object_name text,
  actor_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  with object_path as (
    select storage.foldername(object_name) as segments
  )
  select
    actor_user_id is not null
    and pg_catalog.array_length(object_path.segments, 1) = 6
    and coalesce(object_path.segments[1], '') = 'family'
    and coalesce(object_path.segments[3], '') = 'learner'
    and coalesce(object_path.segments[5], '') = 'evidence'
    and exists (
      select 1
      from public.evidence_entries as ee
      where ee.id::text = object_path.segments[6]
        and ee.family_id::text = object_path.segments[2]
        and ee.learner_id::text = object_path.segments[4]
        and exists (
          select 1
          from public.family_profiles as fp
          where fp.id = ee.family_id
            and (
              fp.created_by_user_id = actor_user_id
              or exists (
                select 1
                from public.family_members as fm
                where fm.family_id = ee.family_id
                  and fm.user_id = actor_user_id
              )
            )
        )
    )
  from object_path;
$$;

revoke all on function public.mylearna_evidence_storage_object_owned_by_user(text, uuid)
  from public, anon, authenticated;
grant execute on function public.mylearna_evidence_storage_object_owned_by_user(text, uuid)
  to service_role;

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
  path_segments text[];
begin
  if new.bucket_id <> 'evidence' then
    return new;
  end if;

  if not public.mylearna_runtime_control_enabled('evidence_media_uploads') then
    raise exception 'Media uploads are temporarily unavailable.' using errcode = 'P0001';
  end if;

  path_segments := storage.foldername(new.name);

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations as reservation
  where reservation.object_path = new.name
    and reservation.status = 'reserved'
    and reservation.expires_at >= now()
  for update;

  if reservation_row.id is null then
    raise exception 'Evidence attachment upload reservation is missing or expired.'
      using errcode = '42501';
  end if;

  if not public.mylearna_evidence_storage_object_owned_by_user(
    new.name,
    reservation_row.created_by_user_id
  )
    or reservation_row.family_id::text <> path_segments[2]
    or reservation_row.learner_id::text <> path_segments[4]
    or reservation_row.evidence_entry_id::text <> path_segments[6]
    or not exists (
      select 1
      from public.evidence_entries as ee
      where ee.id = reservation_row.evidence_entry_id
        and ee.family_id = reservation_row.family_id
        and ee.learner_id = reservation_row.learner_id
        and ee.id::text = path_segments[6]
        and ee.family_id::text = path_segments[2]
        and ee.learner_id::text = path_segments[4]
    )
  then
    raise exception 'Evidence attachment is not authorised.' using errcode = '42501';
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
  path_segments text[];
begin
  if new.bucket_id <> 'evidence' then
    return new;
  end if;

  if old.name is distinct from new.name then
    return new;
  end if;

  path_segments := storage.foldername(new.name);

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations as reservation
  where reservation.object_path = new.name
    and reservation.status in ('reserved', 'uploaded')
    and (
      reservation.status = 'uploaded'
      or reservation.expires_at >= now()
    )
  for update;

  if reservation_row.id is null then
    return new;
  end if;

  if not public.mylearna_evidence_storage_object_owned_by_user(
    new.name,
    reservation_row.created_by_user_id
  )
    or reservation_row.family_id::text <> path_segments[2]
    or reservation_row.learner_id::text <> path_segments[4]
    or reservation_row.evidence_entry_id::text <> path_segments[6]
    or not exists (
      select 1
      from public.evidence_entries as ee
      where ee.id = reservation_row.evidence_entry_id
        and ee.family_id = reservation_row.family_id
        and ee.learner_id = reservation_row.learner_id
        and ee.id::text = path_segments[6]
        and ee.family_id::text = path_segments[2]
        and ee.learner_id::text = path_segments[4]
    )
  then
    raise exception 'Evidence attachment is not authorised.' using errcode = '42501';
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
