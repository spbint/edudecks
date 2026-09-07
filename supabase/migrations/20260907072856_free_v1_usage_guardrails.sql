-- MyLearna Homeschool Free V1 cost guardrails.
--
-- This is intentionally not a billing implementation. It protects the Free
-- family learner limit and family-owned evidence attachment bytes while keeping
-- Reports, generated PDFs, worksheet downloads, and text-only evidence outside
-- the quota.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'evidence',
  'evidence',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.family_evidence_storage_usage (
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  allowance_bytes bigint not null default 262144000,
  used_bytes bigint not null default 0,
  reserved_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (family_id, academic_year_id),
  constraint family_evidence_storage_usage_nonnegative_check
    check (allowance_bytes >= 0 and used_bytes >= 0 and reserved_bytes >= 0)
);

create table if not exists public.evidence_attachment_upload_reservations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  evidence_entry_id uuid not null references public.evidence_entries(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  object_path text not null unique,
  byte_size bigint not null,
  actual_byte_size bigint,
  status text not null default 'reserved',
  created_by_user_id uuid not null,
  expires_at timestamptz not null default now() + interval '15 minutes',
  uploaded_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_attachment_upload_reservations_size_check
    check (byte_size > 0 and byte_size <= 10485760 and (actual_byte_size is null or actual_byte_size >= 0)),
  constraint evidence_attachment_upload_reservations_status_check
    check (status in ('reserved', 'uploaded', 'released'))
);

create index if not exists evidence_attachment_upload_reservations_family_year_idx
  on public.evidence_attachment_upload_reservations (family_id, academic_year_id, status, expires_at);

create index if not exists evidence_attachment_upload_reservations_evidence_idx
  on public.evidence_attachment_upload_reservations (evidence_entry_id, status);

alter table public.family_evidence_storage_usage enable row level security;
alter table public.evidence_attachment_upload_reservations enable row level security;

grant select on public.family_evidence_storage_usage to authenticated;
revoke all on public.evidence_attachment_upload_reservations from anon;
revoke all on public.evidence_attachment_upload_reservations from authenticated;

drop policy if exists "free storage usage select own family" on public.family_evidence_storage_usage;
create policy "free storage usage select own family"
on public.family_evidence_storage_usage
for select
to authenticated
using (public.is_family_member(family_id));

create or replace function public.mylearna_storage_metadata_size_bytes(object_metadata jsonb)
returns bigint
language sql
immutable
as $$
  select case
    when coalesce(object_metadata->>'size', '') ~ '^[0-9]+$'
      then (object_metadata->>'size')::bigint
    else 0
  end;
$$;

revoke all on function public.mylearna_storage_metadata_size_bytes(jsonb) from public;
grant execute on function public.mylearna_storage_metadata_size_bytes(jsonb) to authenticated;
grant execute on function public.mylearna_storage_metadata_size_bytes(jsonb) to service_role;

create or replace function public.mylearna_resolve_evidence_academic_year_id(
  target_family_id uuid,
  target_observed_on date
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ay.id
  from public.academic_years ay
  where ay.family_id = target_family_id
    and ay.starts_on <= target_observed_on
    and ay.ends_on >= target_observed_on
  order by ay.starts_on desc, ay.created_at desc
  limit 1;
$$;

revoke all on function public.mylearna_resolve_evidence_academic_year_id(uuid, date) from public;
grant execute on function public.mylearna_resolve_evidence_academic_year_id(uuid, date) to authenticated;
grant execute on function public.mylearna_resolve_evidence_academic_year_id(uuid, date) to service_role;

create or replace function public.mylearna_enforce_free_learner_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_learner_count integer := 0;
begin
  perform 1
  from public.family_profiles
  where id = new.family_id
  for update;

  select count(*)
  into existing_learner_count
  from public.learners
  where family_id = new.family_id;

  if existing_learner_count >= 3 then
    raise exception 'MyLearna Free supports up to 3 learners per family.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists mylearna_free_learner_limit_before_insert on public.learners;
create trigger mylearna_free_learner_limit_before_insert
before insert on public.learners
for each row execute function public.mylearna_enforce_free_learner_limit();

create or replace function public.mylearna_release_expired_evidence_storage_reservations(
  target_family_id uuid,
  target_academic_year_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_bytes bigint := 0;
begin
  select coalesce(sum(byte_size), 0)
  into expired_bytes
  from public.evidence_attachment_upload_reservations
  where family_id = target_family_id
    and academic_year_id = target_academic_year_id
    and status = 'reserved'
    and expires_at < now();

  if expired_bytes <= 0 then
    return;
  end if;

  update public.evidence_attachment_upload_reservations
  set status = 'released',
      released_at = now(),
      updated_at = now()
  where family_id = target_family_id
    and academic_year_id = target_academic_year_id
    and status = 'reserved'
    and expires_at < now();

  update public.family_evidence_storage_usage
  set reserved_bytes = greatest(0, reserved_bytes - expired_bytes),
      updated_at = now()
  where family_id = target_family_id
    and academic_year_id = target_academic_year_id;
end;
$$;

revoke all on function public.mylearna_release_expired_evidence_storage_reservations(uuid, uuid) from public;
grant execute on function public.mylearna_release_expired_evidence_storage_reservations(uuid, uuid) to authenticated;
grant execute on function public.mylearna_release_expired_evidence_storage_reservations(uuid, uuid) to service_role;

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
  target_year_id uuid;
  usage_row public.family_evidence_storage_usage;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  target_year_id := public.mylearna_resolve_evidence_academic_year_id(p_family_id, p_observed_on);

  if target_year_id is null then
    return query
    select p_family_id, null::uuid, 262144000::bigint, 0::bigint, 0::bigint, 262144000::bigint;
    return;
  end if;

  insert into public.family_evidence_storage_usage (family_id, academic_year_id)
  values (p_family_id, target_year_id)
  on conflict (family_id, academic_year_id) do nothing;

  perform public.mylearna_release_expired_evidence_storage_reservations(p_family_id, target_year_id);

  select *
  into usage_row
  from public.family_evidence_storage_usage usage
  where usage.family_id = p_family_id
    and usage.academic_year_id = target_year_id;

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

revoke all on function public.mylearna_get_evidence_storage_usage(uuid, date) from public;
grant execute on function public.mylearna_get_evidence_storage_usage(uuid, date) to authenticated;

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

  update public.family_evidence_storage_usage
  set reserved_bytes = reserved_bytes + p_byte_size,
      updated_at = now()
  where family_id = p_family_id
    and academic_year_id = target_year_id
  returning * into usage_row;

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

revoke all on function public.mylearna_reserve_evidence_attachment_upload(uuid, uuid, uuid, text, bigint) from public;
grant execute on function public.mylearna_reserve_evidence_attachment_upload(uuid, uuid, uuid, text, bigint) to authenticated;

create or replace function public.mylearna_release_evidence_attachment_reservation(
  p_object_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation_row public.evidence_attachment_upload_reservations;
begin
  if auth.uid() is null then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations reservation
  where reservation.object_path = p_object_path
    and reservation.created_by_user_id = auth.uid()
  for update;

  if reservation_row.id is null or reservation_row.status <> 'reserved' then
    return;
  end if;

  update public.family_evidence_storage_usage usage
  set reserved_bytes = greatest(0, usage.reserved_bytes - reservation_row.byte_size),
      updated_at = now()
  where usage.family_id = reservation_row.family_id
    and usage.academic_year_id = reservation_row.academic_year_id;

  update public.evidence_attachment_upload_reservations
  set status = 'released',
      released_at = now(),
      updated_at = now()
  where id = reservation_row.id;
end;
$$;

revoke all on function public.mylearna_release_evidence_attachment_reservation(text) from public;
grant execute on function public.mylearna_release_evidence_attachment_reservation(text) to authenticated;

create or replace function public.mylearna_evidence_attachment_upload_reserved(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.evidence_attachment_upload_reservations reservation
    where reservation.object_path = object_name
      and reservation.status = 'reserved'
      and reservation.created_by_user_id = auth.uid()
      and reservation.expires_at >= now()
  );
$$;

revoke all on function public.mylearna_evidence_attachment_upload_reserved(text) from public;
grant execute on function public.mylearna_evidence_attachment_upload_reserved(text) to authenticated;

create or replace function public.mylearna_apply_storage_insert_to_free_quota()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  reservation_row public.evidence_attachment_upload_reservations;
  usage_row public.family_evidence_storage_usage;
  evidence_row public.evidence_entries;
  target_year_id uuid;
  actual_size bigint;
begin
  if new.bucket_id <> 'evidence' then
    return new;
  end if;

  actual_size := public.mylearna_storage_metadata_size_bytes(new.metadata);

  if actual_size <= 0 then
    raise exception 'Attachment size could not be confirmed.' using errcode = '22023';
  end if;

  if actual_size > 10485760 then
    raise exception 'Choose a file smaller than 10 MB.' using errcode = '23514';
  end if;

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations reservation
  where reservation.object_path = new.name
    and reservation.status = 'reserved'
  for update;

  if reservation_row.id is not null then
    select *
    into usage_row
    from public.family_evidence_storage_usage usage
    where usage.family_id = reservation_row.family_id
      and usage.academic_year_id = reservation_row.academic_year_id
    for update;

    if actual_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - (usage_row.reserved_bytes - reservation_row.byte_size)) then
      raise exception 'Your Portfolio storage is full for this learning year. Everything you''ve already captured is safe. You can continue using MyLearna and adding text learning records.'
        using errcode = '23514';
    end if;

    update public.family_evidence_storage_usage
    set reserved_bytes = greatest(0, reserved_bytes - reservation_row.byte_size),
        used_bytes = used_bytes + actual_size,
        updated_at = now()
    where family_id = reservation_row.family_id
      and academic_year_id = reservation_row.academic_year_id;

    update public.evidence_attachment_upload_reservations
    set status = 'uploaded',
        actual_byte_size = actual_size,
        uploaded_at = now(),
        updated_at = now()
    where id = reservation_row.id;

    return new;
  end if;

  select *
  into evidence_row
  from public.evidence_entries ee
  where ee.id::text = (storage.foldername(new.name))[6]
    and ee.family_id::text = (storage.foldername(new.name))[2]
    and ee.learner_id::text = (storage.foldername(new.name))[4];

  if evidence_row.id is null then
    raise exception 'Evidence record could not be confirmed before uploading.'
      using errcode = '42501';
  end if;

  target_year_id := public.mylearna_resolve_evidence_academic_year_id(
    evidence_row.family_id,
    evidence_row.observed_on
  );

  if target_year_id is null then
    raise exception 'Add a learning year for this evidence date before uploading files.'
      using errcode = '23514';
  end if;

  insert into public.family_evidence_storage_usage (family_id, academic_year_id)
  values (evidence_row.family_id, target_year_id)
  on conflict (family_id, academic_year_id) do nothing;

  select *
  into usage_row
  from public.family_evidence_storage_usage usage
  where usage.family_id = evidence_row.family_id
    and usage.academic_year_id = target_year_id
  for update;

  if actual_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes) then
    raise exception 'Your Portfolio storage is full for this learning year. Everything you''ve already captured is safe. You can continue using MyLearna and adding text learning records.'
      using errcode = '23514';
  end if;

  update public.family_evidence_storage_usage
  set used_bytes = used_bytes + actual_size,
      updated_at = now()
  where family_id = evidence_row.family_id
    and academic_year_id = target_year_id;

  return new;
end;
$$;

create or replace function public.mylearna_apply_storage_delete_to_free_quota()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  reservation_row public.evidence_attachment_upload_reservations;
  evidence_row public.evidence_entries;
  target_year_id uuid;
  actual_size bigint;
begin
  if old.bucket_id <> 'evidence' then
    return old;
  end if;

  actual_size := public.mylearna_storage_metadata_size_bytes(old.metadata);

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations reservation
  where reservation.object_path = old.name
    and reservation.status in ('reserved', 'uploaded')
  for update;

  if reservation_row.id is not null then
    if reservation_row.status = 'reserved' then
      update public.family_evidence_storage_usage usage
      set reserved_bytes = greatest(0, usage.reserved_bytes - reservation_row.byte_size),
          updated_at = now()
      where usage.family_id = reservation_row.family_id
        and usage.academic_year_id = reservation_row.academic_year_id;
    else
      update public.family_evidence_storage_usage usage
      set used_bytes = greatest(
            0,
            usage.used_bytes - coalesce(nullif(actual_size, 0), reservation_row.actual_byte_size, reservation_row.byte_size)
          ),
          updated_at = now()
      where usage.family_id = reservation_row.family_id
        and usage.academic_year_id = reservation_row.academic_year_id;
    end if;

    update public.evidence_attachment_upload_reservations
    set status = 'released',
        released_at = now(),
        updated_at = now()
    where id = reservation_row.id;

    return old;
  end if;

  select *
  into evidence_row
  from public.evidence_entries ee
  where ee.id::text = (storage.foldername(old.name))[6]
    and ee.family_id::text = (storage.foldername(old.name))[2]
    and ee.learner_id::text = (storage.foldername(old.name))[4];

  if evidence_row.id is null then
    return old;
  end if;

  target_year_id := public.mylearna_resolve_evidence_academic_year_id(
    evidence_row.family_id,
    evidence_row.observed_on
  );

  if target_year_id is null then
    return old;
  end if;

  update public.family_evidence_storage_usage usage
  set used_bytes = greatest(0, usage.used_bytes - actual_size),
      updated_at = now()
  where usage.family_id = evidence_row.family_id
    and usage.academic_year_id = target_year_id;

  return old;
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
  delta bigint;
begin
  if new.bucket_id <> 'evidence' then
    return new;
  end if;

  old_size := public.mylearna_storage_metadata_size_bytes(old.metadata);
  new_size := public.mylearna_storage_metadata_size_bytes(new.metadata);

  if new_size <= 0 then
    raise exception 'Attachment size could not be confirmed.' using errcode = '22023';
  end if;

  if new_size > 10485760 then
    raise exception 'Choose a file smaller than 10 MB.' using errcode = '23514';
  end if;

  if old.name is distinct from new.name then
    return new;
  end if;

  delta := new_size - old_size;
  if delta = 0 then
    return new;
  end if;

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations reservation
  where reservation.object_path = new.name
    and reservation.status = 'uploaded'
  for update;

  if reservation_row.id is null then
    return new;
  end if;

  select *
  into usage_row
  from public.family_evidence_storage_usage usage
  where usage.family_id = reservation_row.family_id
    and usage.academic_year_id = reservation_row.academic_year_id
  for update;

  if delta > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes) then
    raise exception 'Your Portfolio storage is full for this learning year. Everything you''ve already captured is safe. You can continue using MyLearna and adding text learning records.'
      using errcode = '23514';
  end if;

  update public.family_evidence_storage_usage
  set used_bytes = greatest(0, used_bytes + delta),
      updated_at = now()
  where family_id = reservation_row.family_id
    and academic_year_id = reservation_row.academic_year_id;

  update public.evidence_attachment_upload_reservations
  set actual_byte_size = new_size,
      updated_at = now()
  where id = reservation_row.id;

  return new;
end;
$$;

drop trigger if exists mylearna_evidence_storage_quota_after_insert on storage.objects;
create trigger mylearna_evidence_storage_quota_after_insert
after insert on storage.objects
for each row execute function public.mylearna_apply_storage_insert_to_free_quota();

drop trigger if exists mylearna_evidence_storage_quota_after_delete on storage.objects;
create trigger mylearna_evidence_storage_quota_after_delete
after delete on storage.objects
for each row execute function public.mylearna_apply_storage_delete_to_free_quota();

drop trigger if exists mylearna_evidence_storage_quota_after_update on storage.objects;
create trigger mylearna_evidence_storage_quota_after_update
after update of metadata, name on storage.objects
for each row execute function public.mylearna_apply_storage_update_to_free_quota();

drop policy if exists "mylearna evidence storage insert own" on storage.objects;
create policy "mylearna evidence storage insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'evidence'
  and public.mylearna_evidence_storage_object_owned_by_auth(name)
  and public.mylearna_evidence_attachment_upload_reserved(name)
);

drop policy if exists "mylearna evidence storage update own" on storage.objects;
create policy "mylearna evidence storage update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'evidence'
  and public.mylearna_evidence_storage_object_owned_by_auth(name)
)
with check (
  bucket_id = 'evidence'
  and public.mylearna_evidence_storage_object_owned_by_auth(name)
);

insert into public.family_evidence_storage_usage (
  family_id,
  academic_year_id,
  used_bytes,
  reserved_bytes
)
select
  ee.family_id,
  ay.id as academic_year_id,
  coalesce(sum(public.mylearna_storage_metadata_size_bytes(obj.metadata)), 0) as used_bytes,
  0::bigint as reserved_bytes
from storage.objects obj
join public.evidence_entries ee
  on ee.id::text = (storage.foldername(obj.name))[6]
  and ee.family_id::text = (storage.foldername(obj.name))[2]
  and ee.learner_id::text = (storage.foldername(obj.name))[4]
join public.academic_years ay
  on ay.family_id = ee.family_id
  and ay.starts_on <= ee.observed_on
  and ay.ends_on >= ee.observed_on
where obj.bucket_id = 'evidence'
  and (storage.foldername(obj.name))[1] = 'family'
  and (storage.foldername(obj.name))[3] = 'learner'
  and (storage.foldername(obj.name))[5] = 'evidence'
group by ee.family_id, ay.id
on conflict (family_id, academic_year_id) do update
set used_bytes = excluded.used_bytes,
    reserved_bytes = 0,
    updated_at = now();
