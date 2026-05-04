-- Evidence Attachments release gate for EduDecks / MyLearna.
--
-- IMPORTANT:
-- 1. The current app stores public URLs from Supabase Storage via getPublicUrl(...).
-- 2. To preserve that behaviour, this draft keeps the `evidence` bucket public.
-- 3. Public evidence URLs are acceptable for development or tightly controlled
--    private beta only. They are not a production-grade privacy posture for
--    child evidence.
-- 4. Before applying the `evidence_entries` RLS policies below, confirm that
--    live evidence rows have `user_id` populated. Older rows with null
--    `user_id` will be hidden by strict ownership policies.
--
-- Preflight checks to run manually in Supabase SQL editor before applying:
-- select count(*) as rows_missing_user_id
-- from public.evidence_entries
-- where user_id is null;
--
-- select id, student_id, title, created_at
-- from public.evidence_entries
-- where user_id is null
-- order by created_at desc
-- limit 20;
--
-- If rows_missing_user_id > 0, backfill `user_id` before enabling strict RLS.

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
  true,
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

create or replace function public.mylearna_evidence_entry_owned_by_auth(
  target_evidence_id text,
  target_student_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.evidence_entries ee
    where ee.id::text = target_evidence_id
      and ee.student_id::text = target_student_id
      and ee.user_id::text = auth.uid()::text
  );
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
    and public.mylearna_family_profile_owned_by_auth((storage.foldername(object_name))[2])
    and public.mylearna_evidence_entry_owned_by_auth(
      (storage.foldername(object_name))[6],
      (storage.foldername(object_name))[4]
    );
$$;

grant execute on function public.mylearna_evidence_storage_object_owned_by_auth(text) to authenticated;

alter table if exists public.evidence_entries enable row level security;

drop policy if exists "mylearna evidence entries select own" on public.evidence_entries;
create policy "mylearna evidence entries select own"
on public.evidence_entries
for select
to authenticated
using (
  auth.uid() is not null
  and user_id::text = auth.uid()::text
);

drop policy if exists "mylearna evidence entries insert own" on public.evidence_entries;
create policy "mylearna evidence entries insert own"
on public.evidence_entries
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id::text = auth.uid()::text
);

drop policy if exists "mylearna evidence entries update own" on public.evidence_entries;
create policy "mylearna evidence entries update own"
on public.evidence_entries
for update
to authenticated
using (
  auth.uid() is not null
  and user_id::text = auth.uid()::text
)
with check (
  auth.uid() is not null
  and user_id::text = auth.uid()::text
);

drop policy if exists "mylearna evidence entries delete own" on public.evidence_entries;
create policy "mylearna evidence entries delete own"
on public.evidence_entries
for delete
to authenticated
using (
  auth.uid() is not null
  and user_id::text = auth.uid()::text
);

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
