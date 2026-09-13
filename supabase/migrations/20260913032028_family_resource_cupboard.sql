-- 3K.4A: family-level reusable resource cupboard. Evidence remains separate.
create table if not exists public.family_resources (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  resource_type text not null,
  name text not null,
  url text,
  reference_text text,
  resource_file_id uuid references public.family_resource_files(id) on delete restrict,
  note text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_resources_type_check check (resource_type in ('web_link', 'reference', 'file')),
  constraint family_resources_source_check check (
    (resource_type = 'web_link' and length(btrim(name)) > 0 and url ~* '^https?://' and reference_text is null and resource_file_id is null)
    or (resource_type = 'reference' and length(btrim(name)) > 0 and length(btrim(coalesce(reference_text, ''))) > 0 and url is null and resource_file_id is null)
    or (resource_type = 'file' and length(btrim(name)) > 0 and url is null and reference_text is null and resource_file_id is not null)
  )
);
create index if not exists family_resources_family_created_idx on public.family_resources (family_id, created_at desc);
create index if not exists family_resources_family_type_idx on public.family_resources (family_id, resource_type, created_at desc);

alter table public.custom_learning_resources add column if not exists family_resource_id uuid references public.family_resources(id) on delete restrict;
create index if not exists custom_learning_resources_family_resource_idx on public.custom_learning_resources (family_resource_id);

alter table public.family_resources enable row level security;
alter table public.family_resources force row level security;
revoke all on public.family_resources from public, anon;
grant select, insert, update, delete on public.family_resources to authenticated;

drop policy if exists "family resources select own family" on public.family_resources;
create policy "family resources select own family" on public.family_resources for select to authenticated
  using (public.is_family_member(family_id));
drop policy if exists "family resources insert own family" on public.family_resources;
create policy "family resources insert own family" on public.family_resources for insert to authenticated
  with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());
drop policy if exists "family resources update own family" on public.family_resources;
create policy "family resources update own family" on public.family_resources for update to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());
drop policy if exists "family resources delete unused family" on public.family_resources;
create policy "family resources delete unused family" on public.family_resources for delete to authenticated
  using (public.is_family_member(family_id) and not exists (
    select 1 from public.custom_learning_resources link where link.family_resource_id = family_resources.id
  ));

alter table public.custom_learning_resources drop constraint if exists custom_learning_resources_source_check;
alter table public.custom_learning_resources add constraint custom_learning_resources_source_check check (
  (family_resource_id is not null and url is null and reference_text is null and resource_file_id is null)
  or (family_resource_id is null and resource_type = 'web_link' and length(btrim(coalesce(url, ''))) > 0 and reference_text is null and resource_file_id is null)
  or (family_resource_id is null and resource_type = 'reference' and length(btrim(coalesce(reference_text, ''))) > 0 and url is null and resource_file_id is null)
  or (family_resource_id is null and resource_type = 'file' and resource_file_id is not null and url is null and reference_text is null)
);

create or replace function public.mylearna_validate_family_resource()
returns trigger language plpgsql security definer set search_path = public as $$
declare file_row public.family_resource_files;
begin
  if auth.uid() is null or not public.is_family_member(new.family_id) then raise exception 'Family workspace unavailable.' using errcode = '42501'; end if;
  if new.created_by_user_id <> auth.uid() then raise exception 'Resource creator must be the signed-in user.' using errcode = '42501'; end if;
  if new.resource_type = 'web_link' and new.url !~* '^https?://[^[:space:]]+$' then raise exception 'Use a web link starting with http:// or https://.' using errcode = '22023'; end if;
  if new.resource_type = 'file' then
    select * into file_row from public.family_resource_files where id = new.resource_file_id and family_id = new.family_id and status = 'ready';
    if file_row.id is null then raise exception 'PDF resource is not ready yet.' using errcode = '23503'; end if;
  elsif new.resource_file_id is not null then raise exception 'Only PDF resources may reference a stored file.' using errcode = '23514'; end if;
  return new;
end; $$;
revoke all on function public.mylearna_validate_family_resource() from public, anon;

create or replace function public.mylearna_validate_custom_learning_resource()
returns trigger language plpgsql security definer set search_path = public as $$
declare item_family uuid; file_row public.family_resource_files; cupboard_row public.family_resources;
begin
  if auth.uid() is null or not public.is_family_member(new.family_id) then raise exception 'Family workspace unavailable.' using errcode = '42501'; end if;
  select family_id into item_family from public.custom_learning_items where id = new.custom_learning_item_id;
  if item_family is null or item_family <> new.family_id then raise exception 'Resource must belong to this family custom learning item.' using errcode = '23503'; end if;
  if new.family_resource_id is not null then
    select * into cupboard_row from public.family_resources where id = new.family_resource_id and family_id = new.family_id;
    if cupboard_row.id is null or cupboard_row.resource_type <> new.resource_type then raise exception 'Resource must belong to this family.' using errcode = '23503'; end if;
  elsif new.resource_type = 'file' then
    select * into file_row from public.family_resource_files where id = new.resource_file_id and family_id = new.family_id and status = 'ready';
    if file_row.id is null then raise exception 'PDF resource is not ready yet.' using errcode = '23503'; end if;
  elsif new.resource_file_id is not null then raise exception 'Only PDF resources may reference a stored file.' using errcode = '23514'; end if;
  if tg_op = 'INSERT' and new.created_by_user_id <> auth.uid() then raise exception 'Resource creator must be the signed-in user.' using errcode = '42501'; end if;
  if tg_op = 'UPDATE' and (new.family_id is distinct from old.family_id or new.custom_learning_item_id is distinct from old.custom_learning_item_id or new.created_by_user_id is distinct from old.created_by_user_id) then raise exception 'Resource ownership cannot be changed.' using errcode = '42501'; end if;
  return new;
end; $$;

-- Backfill one family-level row for each distinct existing resource identity,
-- then preserve existing rows as readable compatibility associations.
insert into public.family_resources (family_id, resource_type, name, url, reference_text, resource_file_id, created_by_user_id, created_at, updated_at)
select distinct on (r.family_id, r.resource_type, r.url, r.reference_text, r.resource_file_id)
       r.family_id,
       r.resource_type,
       coalesce(nullif(btrim(r.label), ''), nullif(btrim(r.reference_text), ''), nullif(btrim(r.url), ''), f.original_filename, 'Resource'),
       case when r.resource_type = 'web_link' then r.url end,
       case when r.resource_type = 'reference' then r.reference_text end,
       case when r.resource_type = 'file' then r.resource_file_id end,
       r.created_by_user_id, r.created_at, r.updated_at
from public.custom_learning_resources r
left join public.family_resource_files f on f.id = r.resource_file_id
where not exists (
  select 1 from public.family_resources existing
  where existing.family_id = r.family_id and existing.resource_type = r.resource_type
    and existing.url is not distinct from case when r.resource_type = 'web_link' then r.url end
    and existing.reference_text is not distinct from case when r.resource_type = 'reference' then r.reference_text end
    and existing.resource_file_id is not distinct from case when r.resource_type = 'file' then r.resource_file_id end
)
order by r.family_id, r.resource_type, r.url, r.reference_text, r.resource_file_id, r.created_at, r.id;

alter table public.custom_learning_resources disable trigger mylearna_validate_custom_learning_resource_before_write;
update public.custom_learning_resources r
set family_resource_id = existing.id, url = null, reference_text = null, resource_file_id = null
from public.family_resources existing
where r.family_id = existing.family_id and r.resource_type = existing.resource_type
  and existing.url is not distinct from case when r.resource_type = 'web_link' then r.url end
  and existing.reference_text is not distinct from case when r.resource_type = 'reference' then r.reference_text end
  and existing.resource_file_id is not distinct from case when r.resource_type = 'file' then r.resource_file_id end
  and r.family_resource_id is null;
alter table public.custom_learning_resources enable trigger mylearna_validate_custom_learning_resource_before_write;

drop trigger if exists mylearna_validate_family_resource_before_write on public.family_resources;
create trigger mylearna_validate_family_resource_before_write
before insert or update on public.family_resources for each row execute function public.mylearna_validate_family_resource();

create or replace function public.mylearna_cleanup_unreferenced_resource_file()
returns trigger language plpgsql security definer set search_path = public, storage as $$
declare f public.family_resource_files; referenced boolean;
begin
  if old.resource_type <> 'file' or old.resource_file_id is null then return old; end if;
  select exists (select 1 from public.custom_learning_resources r where r.resource_file_id = old.resource_file_id or r.family_resource_id = old.family_resource_id)
    or exists (select 1 from public.family_resources cupboard where cupboard.resource_file_id = old.resource_file_id)
    into referenced;
  if referenced then return old; end if;
  select * into f from public.family_resource_files where id = old.resource_file_id and family_id = old.family_id for update;
  if f.id is not null and f.status = 'ready' then delete from storage.objects where bucket_id = f.storage_bucket and name = f.object_path; end if;
  if f.id is not null and f.status <> 'deleted' then update public.family_resource_files set status = 'deleted', updated_at = now() where id = f.id; end if;
  return old;
end; $$;

create or replace function public.mylearna_cleanup_deleted_family_resource()
returns trigger language plpgsql security definer set search_path = public, storage as $$
declare f public.family_resource_files;
begin
  if old.resource_type <> 'file' or old.resource_file_id is null then return old; end if;
  if exists (select 1 from public.custom_learning_resources r where r.family_resource_id = old.id or r.resource_file_id = old.resource_file_id) then return old; end if;
  select * into f from public.family_resource_files where id = old.resource_file_id for update;
  if f.id is not null and f.status = 'ready' then delete from storage.objects where bucket_id = f.storage_bucket and name = f.object_path; end if;
  delete from public.family_resource_files where id = old.resource_file_id;
  return old;
end; $$;
drop trigger if exists mylearna_cleanup_deleted_family_resource_after_delete on public.family_resources;
create trigger mylearna_cleanup_deleted_family_resource_after_delete after delete on public.family_resources
for each row execute function public.mylearna_cleanup_deleted_family_resource();

drop trigger if exists family_resources_updated_at on public.family_resources;
create trigger family_resources_updated_at before update on public.family_resources
for each row execute function public.clean_set_updated_at();

-- Homeschool currently has no production billing entitlement. Keep the policy
-- in one server-side resolver so a real subscription source can replace this
-- default without changing reservation or accounting callers.
create or replace function public.mylearna_resource_storage_allowance_bytes(p_family_id uuid)
returns bigint language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then raise exception 'Family workspace unavailable.' using errcode = '42501'; end if;
  return 262144000;
end; $$;
revoke all on function public.mylearna_resource_storage_allowance_bytes(uuid) from public, anon;
grant execute on function public.mylearna_resource_storage_allowance_bytes(uuid) to authenticated;

update public.family_resource_storage_usage
set allowance_bytes = greatest(262144000, used_bytes + reserved_bytes), updated_at = now()
where allowance_bytes > 262144000;

create or replace function public.mylearna_reserve_resource_file_upload(
  p_family_id uuid, p_custom_learning_item_id uuid, p_original_filename text,
  p_mime_type text, p_byte_size bigint
)
returns table (reservation_id uuid, resource_file_id uuid, bucket text, object_path text, reserved_byte_size bigint, remaining_bytes bigint)
language plpgsql security definer set search_path = public, storage as $$
declare
  usage_row public.family_resource_storage_usage;
  policy_allowance bigint;
  file_id uuid := gen_random_uuid();
  clean_name text := public.mylearna_sanitise_resource_filename(p_original_filename);
  file_path text;
  clean_mime text := lower(btrim(coalesce(p_mime_type, '')));
  reservation_id_value uuid;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then raise exception 'Family workspace unavailable.' using errcode = '42501'; end if;
  if not public.mylearna_runtime_control_enabled('resource_file_uploads') then raise exception 'PDF uploads are temporarily unavailable. You can still use web links and references.' using errcode = 'P0001'; end if;
  perform public.mylearna_enforce_mutation_rate_limit('resource_file_upload_reservation', p_family_id, 1);
  if p_custom_learning_item_id is not null and not exists (select 1 from public.custom_learning_items item where item.id = p_custom_learning_item_id and item.family_id = p_family_id) then raise exception 'Learning item could not be confirmed.' using errcode = '42501'; end if;
  if coalesce(p_byte_size, 0) <= 0 then raise exception 'Choose a PDF file before uploading.' using errcode = '22023'; end if;
  if p_byte_size > 26214400 then raise exception 'PDF files can be up to 25 MB.' using errcode = '23514'; end if;
  if clean_mime <> 'application/pdf' then raise exception 'Choose a PDF file.' using errcode = '22023'; end if;
  if clean_name = '' or clean_name !~* '\.pdf$' then raise exception 'Choose a PDF file with a .pdf filename.' using errcode = '22023'; end if;
  insert into public.family_resource_storage_usage (family_id) values (p_family_id) on conflict (family_id) do nothing;
  perform public.mylearna_release_expired_resource_file_upload_reservations(p_family_id);
  select * into usage_row from public.family_resource_storage_usage where family_id = p_family_id for update;
  policy_allowance := public.mylearna_resource_storage_allowance_bytes(p_family_id);
  if p_byte_size > policy_allowance - usage_row.used_bytes - usage_row.reserved_bytes then raise exception 'Your Resource Cupboard file storage is full.' using errcode = '23514'; end if;
  file_path := 'family/' || p_family_id::text || '/resources/' || file_id::text || '/' || clean_name;
  insert into public.family_resource_files (id, family_id, original_filename, display_name, object_path, mime_type, created_by_user_id)
  values (file_id, p_family_id, btrim(p_original_filename), nullif(btrim(p_original_filename), ''), file_path, clean_mime, auth.uid());
  insert into public.resource_file_upload_reservations (family_id, resource_file_id, object_path, byte_size, created_by_user_id)
  values (p_family_id, file_id, file_path, p_byte_size, auth.uid()) returning id into reservation_id_value;
  update public.family_resource_storage_usage set reserved_bytes = reserved_bytes + p_byte_size, allowance_bytes = greatest(allowance_bytes, policy_allowance, used_bytes + reserved_bytes + p_byte_size), updated_at = now() where family_id = p_family_id returning * into usage_row;
  return query select reservation_id_value, file_id, 'learning-resources'::text, file_path, p_byte_size, greatest(0, policy_allowance - usage_row.used_bytes - usage_row.reserved_bytes);
end; $$;
revoke all on function public.mylearna_reserve_resource_file_upload(uuid, uuid, text, text, bigint) from public, anon;
grant execute on function public.mylearna_reserve_resource_file_upload(uuid, uuid, text, text, bigint) to authenticated;
