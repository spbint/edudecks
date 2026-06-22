-- MyLearna clean evidence storage policy compatibility.
--
-- The original evidence storage policy checked legacy evidence_entries columns:
--   student_id, user_id
--
-- Clean MyLearna evidence rows use:
--   family_id, learner_id, created_by_user_id
--
-- This migration keeps the same private `evidence` bucket/path convention while
-- allowing authenticated members of the clean family workspace to upload files
-- for evidence entries they can access.

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

alter table if exists public.evidence_entries
  add column if not exists attachment_urls jsonb;

alter table if exists public.evidence_entries
  add column if not exists image_url text;

alter table if exists public.evidence_entries
  add column if not exists file_url text;

alter table if exists public.evidence_entries
  add column if not exists audio_url text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence_entries'
      and column_name = 'family_id'
  ) then
    alter table public.evidence_entries enable row level security;

    drop policy if exists "mylearna clean evidence entries select own family" on public.evidence_entries;
    create policy "mylearna clean evidence entries select own family"
    on public.evidence_entries
    for select
    to authenticated
    using (public.is_family_member(family_id));

    drop policy if exists "mylearna clean evidence entries update own family" on public.evidence_entries;
    create policy "mylearna clean evidence entries update own family"
    on public.evidence_entries
    for update
    to authenticated
    using (public.is_family_member(family_id))
    with check (public.is_family_member(family_id));
  end if;
end $$;

drop policy if exists "mylearna evidence storage select own" on storage.objects;
drop policy if exists "mylearna evidence storage insert own" on storage.objects;
drop policy if exists "mylearna evidence storage update own" on storage.objects;
drop policy if exists "mylearna evidence storage delete own" on storage.objects;

drop function if exists public.mylearna_evidence_storage_object_owned_by_auth(text);
drop function if exists public.mylearna_evidence_entry_owned_by_auth(text, text);

create or replace function public.mylearna_evidence_entry_owned_by_auth(
  target_evidence_id text,
  target_learner_id text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  has_clean_schema boolean;
  has_legacy_schema boolean;
  is_owned boolean := false;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence_entries'
      and column_name = 'learner_id'
  )
  into has_clean_schema;

  if has_clean_schema then
    execute '
      select exists (
        select 1
        from public.evidence_entries ee
        where ee.id::text = $1
          and ee.learner_id::text = $2
          and (
            ee.created_by_user_id = auth.uid()
            or public.is_family_member(ee.family_id)
          )
      )
    '
    into is_owned
    using target_evidence_id, target_learner_id;

    return coalesce(is_owned, false);
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence_entries'
      and column_name = 'student_id'
  )
  into has_legacy_schema;

  if has_legacy_schema then
    execute '
      select exists (
        select 1
        from public.evidence_entries ee
        where ee.id::text = $1
          and ee.student_id::text = $2
          and ee.user_id::text = auth.uid()::text
      )
    '
    into is_owned
    using target_evidence_id, target_learner_id;

    return coalesce(is_owned, false);
  end if;

  return false;
end;
$$;

grant execute on function public.mylearna_evidence_entry_owned_by_auth(text, text) to authenticated;

create or replace function public.mylearna_evidence_storage_object_owned_by_auth(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select
    coalesce((storage.foldername(object_name))[1], '') = 'family'
    and coalesce((storage.foldername(object_name))[3], '') = 'learner'
    and coalesce((storage.foldername(object_name))[5], '') = 'evidence'
    and public.mylearna_evidence_entry_owned_by_auth(
      (storage.foldername(object_name))[6],
      (storage.foldername(object_name))[4]
    );
$$;

grant execute on function public.mylearna_evidence_storage_object_owned_by_auth(text) to authenticated;

drop policy if exists "mylearna evidence storage select own" on storage.objects;
create policy "mylearna evidence storage select own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'evidence'
  and public.mylearna_evidence_storage_object_owned_by_auth(name)
);

drop policy if exists "mylearna evidence storage insert own" on storage.objects;
create policy "mylearna evidence storage insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'evidence'
  and public.mylearna_evidence_storage_object_owned_by_auth(name)
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

drop policy if exists "mylearna evidence storage delete own" on storage.objects;
create policy "mylearna evidence storage delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'evidence'
  and public.mylearna_evidence_storage_object_owned_by_auth(name)
);
