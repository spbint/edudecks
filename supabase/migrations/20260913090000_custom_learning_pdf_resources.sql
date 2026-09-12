-- MyLearna Homeschool 3K.2B: reusable private PDF resources.
-- This is additive. Evidence storage, reservations, triggers, policies, and
-- academic-year accounting are intentionally left untouched.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learning-resources', 'learning-resources', false, 26214400, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.family_resource_files (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  original_filename text not null,
  display_name text,
  storage_bucket text not null default 'learning-resources',
  object_path text not null unique,
  mime_type text not null,
  byte_size bigint,
  status text not null default 'pending',
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_resource_files_bucket_check check (storage_bucket = 'learning-resources'),
  constraint family_resource_files_mime_check check (mime_type = 'application/pdf'),
  constraint family_resource_files_status_check check (status in ('pending', 'ready', 'deleted')),
  constraint family_resource_files_filename_check check (length(btrim(original_filename)) between 1 and 255),
  constraint family_resource_files_size_check check (byte_size is null or (byte_size > 0 and byte_size <= 26214400))
);

create index if not exists family_resource_files_family_status_idx
  on public.family_resource_files (family_id, status, created_at desc);

create table if not exists public.family_resource_storage_usage (
  family_id uuid primary key references public.family_profiles(id) on delete cascade,
  allowance_bytes bigint not null default 524288000,
  used_bytes bigint not null default 0,
  reserved_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_resource_storage_usage_nonnegative_check
    check (allowance_bytes >= 0 and used_bytes >= 0 and reserved_bytes >= 0),
  constraint family_resource_storage_usage_capacity_check
    check (used_bytes + reserved_bytes <= allowance_bytes)
);

create table if not exists public.resource_file_upload_reservations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  resource_file_id uuid not null references public.family_resource_files(id) on delete cascade,
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
  constraint resource_file_upload_reservations_size_check
    check (byte_size > 0 and byte_size <= 26214400 and (actual_byte_size is null or (actual_byte_size > 0 and actual_byte_size <= 26214400))),
  constraint resource_file_upload_reservations_status_check
    check (status in ('reserved', 'uploaded', 'released'))
);

create index if not exists resource_file_upload_reservations_family_status_idx
  on public.resource_file_upload_reservations (family_id, status, expires_at);
create index if not exists resource_file_upload_reservations_file_idx
  on public.resource_file_upload_reservations (resource_file_id, status);

alter table public.custom_learning_resources
  add column if not exists resource_file_id uuid references public.family_resource_files(id) on delete restrict;

alter table public.custom_learning_resources
  drop constraint if exists custom_learning_resources_type_check;
alter table public.custom_learning_resources
  add constraint custom_learning_resources_type_check
  check (resource_type in ('web_link', 'reference', 'file'));

alter table public.custom_learning_resources
  drop constraint if exists custom_learning_resources_source_check;
alter table public.custom_learning_resources
  add constraint custom_learning_resources_source_check
  check (
    (resource_type = 'web_link' and length(btrim(coalesce(url, ''))) > 0 and reference_text is null and resource_file_id is null)
    or
    (resource_type = 'reference' and length(btrim(coalesce(reference_text, ''))) > 0 and url is null and resource_file_id is null)
    or
    (resource_type = 'file' and resource_file_id is not null and url is null and reference_text is null)
  );

create index if not exists custom_learning_resources_file_idx
  on public.custom_learning_resources (resource_file_id) where resource_file_id is not null;

alter table public.family_resource_files enable row level security;
alter table public.family_resource_storage_usage enable row level security;
alter table public.resource_file_upload_reservations enable row level security;

revoke all on public.family_resource_files from public, anon;
grant select on public.family_resource_files to authenticated;
revoke all on public.family_resource_storage_usage from public, anon;
grant select on public.family_resource_storage_usage to authenticated;
revoke all on public.resource_file_upload_reservations from public, anon, authenticated;

drop policy if exists "resource files select own family" on public.family_resource_files;
create policy "resource files select own family" on public.family_resource_files
  for select to authenticated using (public.is_family_member(family_id) and status = 'ready');
drop policy if exists "resource storage usage select own family" on public.family_resource_storage_usage;
create policy "resource storage usage select own family" on public.family_resource_storage_usage
  for select to authenticated using (public.is_family_member(family_id));

create or replace function public.mylearna_sanitise_resource_filename(p_filename text)
returns text language sql immutable set search_path = public as $$
  select left(
    regexp_replace(
      regexp_replace(coalesce(nullif(btrim(p_filename), ''), 'resource.pdf'), '[^A-Za-z0-9._-]+', '_', 'g'),
      '^\.+', '', 'g'
    ), 180
  );
$$;
revoke all on function public.mylearna_sanitise_resource_filename(text) from public;
revoke all on function public.mylearna_sanitise_resource_filename(text) from anon;
grant execute on function public.mylearna_sanitise_resource_filename(text) to authenticated;

create or replace function public.mylearna_release_expired_resource_file_upload_reservations(p_family_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  released bigint := 0;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;
  select coalesce(sum(byte_size), 0) into released
  from public.resource_file_upload_reservations
  where family_id = p_family_id and status = 'reserved' and expires_at < now();
  update public.resource_file_upload_reservations
  set status = 'released', released_at = now(), updated_at = now()
  where family_id = p_family_id and status = 'reserved' and expires_at < now();
  if released > 0 then
    update public.family_resource_storage_usage
    set reserved_bytes = greatest(0, reserved_bytes - released), updated_at = now()
    where family_id = p_family_id;
    update public.family_resource_files file
    set status = 'deleted', updated_at = now()
    where file.family_id = p_family_id and file.status = 'pending'
      and not exists (select 1 from public.resource_file_upload_reservations r where r.resource_file_id = file.id and r.status = 'reserved');
  end if;
end;
$$;
revoke all on function public.mylearna_release_expired_resource_file_upload_reservations(uuid) from public;
revoke all on function public.mylearna_release_expired_resource_file_upload_reservations(uuid) from anon;
grant execute on function public.mylearna_release_expired_resource_file_upload_reservations(uuid) to authenticated;

create or replace function public.mylearna_reserve_resource_file_upload(
  p_family_id uuid, p_custom_learning_item_id uuid, p_original_filename text,
  p_mime_type text, p_byte_size bigint
)
returns table (reservation_id uuid, resource_file_id uuid, bucket text, object_path text, reserved_byte_size bigint, remaining_bytes bigint)
language plpgsql security definer set search_path = public, storage as $$
declare
  usage_row public.family_resource_storage_usage;
  file_id uuid := gen_random_uuid();
  clean_name text := public.mylearna_sanitise_resource_filename(p_original_filename);
  file_path text;
  clean_mime text := lower(btrim(coalesce(p_mime_type, '')));
  reservation_id_value uuid;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then raise exception 'Family workspace unavailable.' using errcode = '42501'; end if;
  if not public.mylearna_runtime_control_enabled('resource_file_uploads') then
    raise exception 'PDF uploads are temporarily unavailable. You can still use web links and references.' using errcode = 'P0001';
  end if;
  perform public.mylearna_enforce_mutation_rate_limit('resource_file_upload_reservation', p_family_id, 1);
  if p_custom_learning_item_id is not null and not exists (
    select 1 from public.custom_learning_items item where item.id = p_custom_learning_item_id and item.family_id = p_family_id
  ) then raise exception 'Learning item could not be confirmed.' using errcode = '42501'; end if;
  if coalesce(p_byte_size, 0) <= 0 then raise exception 'Choose a PDF file before uploading.' using errcode = '22023'; end if;
  if p_byte_size > 26214400 then raise exception 'PDF files can be up to 25 MB.' using errcode = '23514'; end if;
  if clean_mime <> 'application/pdf' then raise exception 'Choose a PDF file.' using errcode = '22023'; end if;
  if clean_name = '' or clean_name !~* '\.pdf$' then raise exception 'Choose a PDF file with a .pdf filename.' using errcode = '22023'; end if;
  insert into public.family_resource_storage_usage (family_id) values (p_family_id) on conflict (family_id) do nothing;
  perform public.mylearna_release_expired_resource_file_upload_reservations(p_family_id);
  select * into usage_row from public.family_resource_storage_usage where family_id = p_family_id for update;
  if p_byte_size > usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes then
    raise exception 'Your family’s resource file storage is full. Remove an unused PDF or use a web link instead.' using errcode = '23514';
  end if;
  file_path := 'family/' || p_family_id::text || '/resources/' || file_id::text || '/' || clean_name;
  insert into public.family_resource_files (id, family_id, original_filename, display_name, object_path, mime_type, created_by_user_id)
  values (file_id, p_family_id, btrim(p_original_filename), nullif(btrim(p_original_filename), ''), file_path, clean_mime, auth.uid());
  insert into public.resource_file_upload_reservations (family_id, resource_file_id, object_path, byte_size, created_by_user_id)
  values (p_family_id, file_id, file_path, p_byte_size, auth.uid()) returning id into reservation_id_value;
  update public.family_resource_storage_usage set reserved_bytes = reserved_bytes + p_byte_size, updated_at = now() where family_id = p_family_id returning * into usage_row;
  return query select reservation_id_value, file_id, 'learning-resources'::text, file_path, p_byte_size, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes;
end;
$$;
revoke all on function public.mylearna_reserve_resource_file_upload(uuid, uuid, text, text, bigint) from public;
revoke all on function public.mylearna_reserve_resource_file_upload(uuid, uuid, text, text, bigint) from anon;
grant execute on function public.mylearna_reserve_resource_file_upload(uuid, uuid, text, text, bigint) to authenticated;

create or replace function public.mylearna_release_resource_file_upload(p_reservation_id uuid)
returns void language plpgsql security definer set search_path = public, storage as $$
declare r public.resource_file_upload_reservations; f public.family_resource_files;
begin
  select * into r from public.resource_file_upload_reservations where id = p_reservation_id and created_by_user_id = auth.uid() for update;
  if r.id is null then return; end if;
  if r.status = 'reserved' then
    update public.family_resource_storage_usage set reserved_bytes = greatest(0, reserved_bytes - r.byte_size), updated_at = now() where family_id = r.family_id;
    update public.resource_file_upload_reservations set status = 'released', released_at = now(), updated_at = now() where id = r.id;
  end if;
  select * into f from public.family_resource_files where id = r.resource_file_id for update;
  if r.status = 'uploaded' and f.id is not null and not exists (select 1 from public.custom_learning_resources where resource_file_id = f.id) then
    delete from storage.objects where bucket_id = f.storage_bucket and name = f.object_path;
  end if;
  update public.family_resource_files set status = 'deleted', updated_at = now() where id = r.resource_file_id and status = 'pending';
end; $$;
revoke all on function public.mylearna_release_resource_file_upload(uuid) from public;
revoke all on function public.mylearna_release_resource_file_upload(uuid) from anon;
grant execute on function public.mylearna_release_resource_file_upload(uuid) to authenticated;

create or replace function public.mylearna_resource_file_upload_reserved(p_object_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.mylearna_runtime_control_enabled('resource_file_uploads') and exists (
    select 1 from public.resource_file_upload_reservations r
    where r.object_path = p_object_path and r.status = 'reserved' and r.created_by_user_id = auth.uid() and r.expires_at >= now()
  );
$$;
revoke all on function public.mylearna_resource_file_upload_reserved(text) from public;
revoke all on function public.mylearna_resource_file_upload_reserved(text) from anon;
grant execute on function public.mylearna_resource_file_upload_reserved(text) to authenticated;

create or replace function public.mylearna_apply_resource_storage_insert()
returns trigger language plpgsql security definer set search_path = public, storage as $$
declare r public.resource_file_upload_reservations; u public.family_resource_storage_usage; actual bigint;
begin
  if new.bucket_id <> 'learning-resources' then return new; end if;
  actual := public.mylearna_storage_metadata_size_bytes(new.metadata);
  if actual <= 0 or actual > 26214400 or new.metadata->>'mimetype' <> 'application/pdf' then raise exception 'PDF upload could not be confirmed.' using errcode = '23514'; end if;
  select * into r from public.resource_file_upload_reservations where object_path = new.name and status = 'reserved' for update;
  if r.id is null or r.expires_at < now() or r.created_by_user_id <> coalesce(auth.uid(), r.created_by_user_id) then raise exception 'PDF upload reservation is not valid.' using errcode = '42501'; end if;
  select * into u from public.family_resource_storage_usage where family_id = r.family_id for update;
  if actual > u.allowance_bytes - u.used_bytes - (u.reserved_bytes - r.byte_size) then raise exception 'Your family’s resource file storage is full. Remove an unused PDF or use a web link instead.' using errcode = '23514'; end if;
  update public.family_resource_storage_usage set reserved_bytes = greatest(0, reserved_bytes - r.byte_size), used_bytes = used_bytes + actual, updated_at = now() where family_id = r.family_id;
  update public.resource_file_upload_reservations set status = 'uploaded', actual_byte_size = actual, uploaded_at = now(), updated_at = now() where id = r.id;
  update public.family_resource_files set status = 'ready', byte_size = actual, updated_at = now() where id = r.resource_file_id;
  return new;
end; $$;

create or replace function public.mylearna_apply_resource_storage_delete()
returns trigger language plpgsql security definer set search_path = public, storage as $$
declare f public.family_resource_files; actual bigint;
begin
  if old.bucket_id <> 'learning-resources' then return old; end if;
  select * into f from public.family_resource_files where object_path = old.name for update;
  actual := coalesce(f.byte_size, public.mylearna_storage_metadata_size_bytes(old.metadata));
  if f.id is not null and f.status = 'ready' then
    update public.family_resource_storage_usage set used_bytes = greatest(0, used_bytes - actual), updated_at = now() where family_id = f.family_id;
    update public.family_resource_files set status = 'deleted', byte_size = null, updated_at = now() where id = f.id;
  end if;
  return old;
end; $$;

drop trigger if exists mylearna_resource_storage_after_insert on storage.objects;
create trigger mylearna_resource_storage_after_insert after insert on storage.objects for each row execute function public.mylearna_apply_resource_storage_insert();
drop trigger if exists mylearna_resource_storage_after_delete on storage.objects;
create trigger mylearna_resource_storage_after_delete after delete on storage.objects for each row execute function public.mylearna_apply_resource_storage_delete();

drop policy if exists "mylearna learning resources insert reserved" on storage.objects;
create policy "mylearna learning resources insert reserved" on storage.objects for insert to authenticated
  with check (bucket_id = 'learning-resources' and public.mylearna_resource_file_upload_reserved(name));
drop policy if exists "mylearna learning resources select family" on storage.objects;
create policy "mylearna learning resources select family" on storage.objects for select to authenticated
  using (bucket_id = 'learning-resources' and (storage.foldername(name))[1] = 'family' and public.is_family_member(((storage.foldername(name))[2])::uuid)
    and exists (select 1 from public.family_resource_files f where f.object_path = name and f.status = 'ready'));

drop policy if exists "mylearna learning resources update" on storage.objects;
drop policy if exists "mylearna learning resources delete" on storage.objects;

create or replace function public.mylearna_validate_custom_learning_resource()
returns trigger language plpgsql security definer set search_path = public as $$
declare item_family uuid; file_row public.family_resource_files;
begin
  if auth.uid() is null or not public.is_family_member(new.family_id) then raise exception 'Family workspace unavailable.' using errcode = '42501'; end if;
  select family_id into item_family from public.custom_learning_items where id = new.custom_learning_item_id;
  if item_family is null or item_family <> new.family_id then raise exception 'Resource must belong to this family custom learning item.' using errcode = '23503'; end if;
  if new.resource_type = 'file' then
    select * into file_row from public.family_resource_files where id = new.resource_file_id and family_id = new.family_id and status = 'ready';
    if file_row.id is null then raise exception 'PDF resource is not ready yet.' using errcode = '23503'; end if;
  elsif new.resource_file_id is not null then raise exception 'Only PDF resources may reference a stored file.' using errcode = '23514'; end if;
  if tg_op = 'INSERT' and new.created_by_user_id <> auth.uid() then raise exception 'Resource creator must be the signed-in user.' using errcode = '42501'; end if;
  if tg_op = 'UPDATE' and (new.family_id is distinct from old.family_id or new.custom_learning_item_id is distinct from old.custom_learning_item_id or new.created_by_user_id is distinct from old.created_by_user_id) then raise exception 'Resource ownership cannot be changed.' using errcode = '42501'; end if;
  return new;
end; $$;

drop trigger if exists mylearna_validate_custom_learning_resource_before_write on public.custom_learning_resources;
create trigger mylearna_validate_custom_learning_resource_before_write before insert or update on public.custom_learning_resources for each row execute function public.mylearna_validate_custom_learning_resource();

create or replace function public.mylearna_cleanup_unreferenced_resource_file()
returns trigger language plpgsql security definer set search_path = public, storage as $$
declare f public.family_resource_files; referenced boolean;
begin
  if old.resource_type <> 'file' or old.resource_file_id is null then return old; end if;
  select exists (select 1 from public.custom_learning_resources r where r.resource_file_id = old.resource_file_id) into referenced;
  if referenced then return old; end if;
  select * into f from public.family_resource_files where id = old.resource_file_id and family_id = old.family_id for update;
  if f.id is not null and f.status = 'ready' then delete from storage.objects where bucket_id = f.storage_bucket and name = f.object_path; end if;
  if f.id is not null and f.status <> 'deleted' then update public.family_resource_files set status = 'deleted', updated_at = now() where id = f.id; end if;
  return old;
end; $$;
drop trigger if exists mylearna_cleanup_unreferenced_resource_file_after_delete on public.custom_learning_resources;
create trigger mylearna_cleanup_unreferenced_resource_file_after_delete after delete on public.custom_learning_resources for each row execute function public.mylearna_cleanup_unreferenced_resource_file();

alter table public.mylearna_runtime_controls drop constraint if exists mylearna_runtime_controls_known_key_check;
alter table public.mylearna_runtime_controls add constraint mylearna_runtime_controls_known_key_check check (control_key in ('new_family_activation', 'evidence_media_uploads', 'resource_file_uploads'));
insert into public.mylearna_runtime_controls (control_key, is_enabled, reason_code) values ('resource_file_uploads', true, null) on conflict (control_key) do nothing;
alter table public.mylearna_mutation_rate_limit_buckets drop constraint if exists mylearna_mutation_rate_limit_action_check;
alter table public.mylearna_mutation_rate_limit_buckets add constraint mylearna_mutation_rate_limit_action_check check (action_key in ('evidence_attachment_reservation', 'evidence_record_creation', 'learner_creation', 'resource_file_upload_reservation'));

create or replace function public.mylearna_runtime_control_enabled(p_control_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select case when p_control_key not in ('new_family_activation', 'evidence_media_uploads', 'resource_file_uploads') then false
    else coalesce((select is_enabled from public.mylearna_runtime_controls where control_key = p_control_key), true) end;
$$;
revoke all on function public.mylearna_runtime_control_enabled(text) from public;
revoke all on function public.mylearna_runtime_control_enabled(text) from anon;
grant execute on function public.mylearna_runtime_control_enabled(text) to authenticated, service_role;

create or replace function public.mylearna_enforce_mutation_rate_limit(p_action_key text, p_family_id uuid, p_increment integer default 1)
returns void language plpgsql security definer set search_path = public as $$
declare limit_count integer; window_seconds integer := 3600; current_window timestamptz; current_scope_key text; bucket_row public.mylearna_mutation_rate_limit_buckets; inc integer := greatest(1, coalesce(p_increment, 1));
begin
  if auth.uid() is null or p_family_id is null or not public.is_family_member(p_family_id) then raise exception 'Family workspace unavailable.' using errcode = '42501'; end if;
  limit_count := case p_action_key when 'evidence_attachment_reservation' then 120 when 'evidence_record_creation' then 300 when 'learner_creation' then 20 when 'resource_file_upload_reservation' then 60 else null end;
  if limit_count is null then raise exception 'Mutation control unavailable.' using errcode = '22023'; end if;
  current_window := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds); current_scope_key := p_family_id::text || ':' || auth.uid()::text;
  delete from public.mylearna_mutation_rate_limit_buckets where expires_at < now() and ctid in (select ctid from public.mylearna_mutation_rate_limit_buckets where expires_at < now() limit 500);
  insert into public.mylearna_mutation_rate_limit_buckets(scope_key, action_key, window_start, window_seconds, expires_at) values(current_scope_key, p_action_key, current_window, window_seconds, current_window + make_interval(secs => window_seconds * 2)) on conflict do nothing;
  select * into bucket_row from public.mylearna_mutation_rate_limit_buckets where mylearna_mutation_rate_limit_buckets.scope_key = current_scope_key and action_key = p_action_key and window_start = current_window for update;
  if bucket_row.hit_count + inc > limit_count then raise exception 'That''s a lot of activity at once. Please wait a moment and try again.' using errcode = 'P0001'; end if;
  update public.mylearna_mutation_rate_limit_buckets set hit_count = hit_count + inc, updated_at = now() where mylearna_mutation_rate_limit_buckets.scope_key = current_scope_key and action_key = p_action_key and window_start = current_window;
end; $$;
revoke all on function public.mylearna_enforce_mutation_rate_limit(text, uuid, integer) from public;
grant execute on function public.mylearna_enforce_mutation_rate_limit(text, uuid, integer) to service_role;

alter table public.custom_learning_resources drop constraint if exists custom_learning_resources_source_check;
alter table public.custom_learning_resources add constraint custom_learning_resources_source_check check (
  (resource_type = 'web_link' and length(btrim(coalesce(url, ''))) > 0 and reference_text is null and resource_file_id is null)
  or (resource_type = 'reference' and length(btrim(coalesce(reference_text, ''))) > 0 and url is null and resource_file_id is null)
  or (resource_type = 'file' and resource_file_id is not null and url is null and reference_text is null)
);

grant select on public.custom_learning_resources to authenticated;
