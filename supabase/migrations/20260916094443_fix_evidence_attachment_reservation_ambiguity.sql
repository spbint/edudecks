begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- The RETURNS TABLE output columns include family_id and academic_year_id.
-- Qualify the storage-usage update so PL/pgSQL cannot resolve those names as
-- output variables instead of columns.
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
  target_year_id uuid;
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
  from public.evidence_entries ee
  where ee.id = p_evidence_entry_id
    and ee.family_id = p_family_id
    and ee.learner_id = p_learner_id
    and public.is_family_member(ee.family_id)
  for update;

  if evidence_row.id is null then
    raise exception 'Evidence record could not be confirmed before uploading.'
      using errcode = '42501';
  end if;

  target_year_id := public.mylearna_resolve_evidence_academic_year_id(
    p_family_id,
    evidence_row.observed_on
  );

  if target_year_id is null then
    raise exception 'Add a learning year for this evidence date before uploading files.'
      using errcode = '23514';
  end if;

  insert into public.family_evidence_storage_usage (family_id, academic_year_id)
  values (p_family_id, target_year_id)
  on conflict (family_id, academic_year_id) do nothing;

  select *
  into usage_row
  from public.family_evidence_storage_usage usage
  where usage.family_id = p_family_id
    and usage.academic_year_id = target_year_id
  for update;

  perform public.mylearna_release_expired_evidence_storage_reservations(p_family_id, target_year_id);

  select *
  into usage_row
  from public.family_evidence_storage_usage usage
  where usage.family_id = p_family_id
    and usage.academic_year_id = target_year_id
  for update;

  if p_byte_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes) then
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
    target_year_id,
    p_object_path,
    p_byte_size,
    auth.uid()
  );

  update public.family_evidence_storage_usage as usage
  set reserved_bytes = usage.reserved_bytes + p_byte_size,
      updated_at = now()
  where usage.family_id = p_family_id
    and usage.academic_year_id = target_year_id
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

revoke all on function public.mylearna_reserve_evidence_attachment_upload(uuid, uuid, uuid, text, bigint) from public, anon;
grant execute on function public.mylearna_reserve_evidence_attachment_upload(uuid, uuid, uuid, text, bigint) to authenticated;

commit;
