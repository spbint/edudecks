-- Remove the legacy bucket-agnostic owner policies that can satisfy Storage
-- RLS before MyLearna's evidence reservation, canonical-path, and family
-- checks are evaluated. Existing bucket-specific policies remain unchanged.

do $preflight$
declare
  policy_row record;
  combined_expression text;
  expected_command text;
begin
  if pg_catalog.to_regclass('storage.objects') is null then
    raise exception 'Required relation storage.objects is missing';
  end if;

  if not (
    select relation.relrowsecurity
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'storage'
      and relation.relname = 'objects'
  ) then
    raise exception 'RLS must remain enabled on storage.objects';
  end if;

  -- If a legacy name has already been repurposed for a bucket-scoped policy,
  -- stop instead of deleting a policy with different intent.
  for policy_row in
    select policy.policyname,
           policy.cmd,
           policy.roles,
           policy.qual,
           policy.with_check
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = any (array[
        'Users can access own files',
        'Users can delete own files',
        'Users can update own files',
        'Users can upload own files'
      ])
  loop
    expected_command := case policy_row.policyname
      when 'Users can access own files' then 'SELECT'
      when 'Users can delete own files' then 'DELETE'
      when 'Users can update own files' then 'UPDATE'
      when 'Users can upload own files' then 'INSERT'
    end;
    combined_expression := lower(
      coalesce(policy_row.qual, '') || ' ' || coalesce(policy_row.with_check, '')
    );

    if policy_row.cmd <> expected_command
       or pg_catalog.cardinality(policy_row.roles) <> 1
       or not (policy_row.roles @> array['public']::name[])
       or position('auth.uid()' in combined_expression) = 0
       or position('owner' in combined_expression) = 0
       or position('bucket_id' in combined_expression) > 0 then
      raise exception 'Legacy Storage policy % no longer has the reviewed owner-only shape',
        policy_row.policyname;
    end if;
  end loop;

  -- Do not remove the global fallback unless every current MyLearna Storage
  -- operation has its own authenticated, bucket-scoped policy.
  if not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = 'mylearna evidence storage insert own'
      and policy.cmd = 'INSERT'
      and policy.roles @> array['authenticated']::name[]
      and position('bucket_id' in lower(coalesce(policy.with_check, ''))) > 0
      and position('mylearna_evidence_storage_object_owned_by_auth' in lower(coalesce(policy.with_check, ''))) > 0
      and position('mylearna_evidence_attachment_upload_reserved' in lower(coalesce(policy.with_check, ''))) > 0
  ) then
    raise exception 'Required reserved evidence INSERT policy is missing or unexpectedly broad';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = 'mylearna evidence storage select own'
      and policy.cmd = 'SELECT'
      and policy.roles @> array['authenticated']::name[]
      and position('bucket_id' in lower(coalesce(policy.qual, ''))) > 0
      and position('mylearna_evidence_storage_object_owned_by_auth' in lower(coalesce(policy.qual, ''))) > 0
  ) or not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = 'mylearna evidence storage update own'
      and policy.cmd = 'UPDATE'
      and policy.roles @> array['authenticated']::name[]
      and position('mylearna_evidence_storage_object_owned_by_auth' in lower(coalesce(policy.qual, ''))) > 0
      and position('mylearna_evidence_storage_object_owned_by_auth' in lower(coalesce(policy.with_check, ''))) > 0
  ) or not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = 'mylearna evidence storage delete own'
      and policy.cmd = 'DELETE'
      and policy.roles @> array['authenticated']::name[]
      and position('mylearna_evidence_storage_object_owned_by_auth' in lower(coalesce(policy.qual, ''))) > 0
  ) then
    raise exception 'Required evidence SELECT, UPDATE, or DELETE policy is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = 'mylearna learning resources insert reserved'
      and policy.cmd = 'INSERT'
      and policy.roles @> array['authenticated']::name[]
      and position('bucket_id' in lower(coalesce(policy.with_check, ''))) > 0
      and position('mylearna_resource_file_upload_reserved' in lower(coalesce(policy.with_check, ''))) > 0
  ) or not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = 'mylearna learning resources select family'
      and policy.cmd = 'SELECT'
      and policy.roles @> array['authenticated']::name[]
      and position('bucket_id' in lower(coalesce(policy.qual, ''))) > 0
      and position('is_family_member' in lower(coalesce(policy.qual, ''))) > 0
  ) or not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = 'mylearna learning resources update reserved'
      and policy.cmd = 'UPDATE'
      and policy.roles @> array['authenticated']::name[]
      and position('bucket_id' in lower(coalesce(policy.qual, ''))) > 0
      and position('bucket_id' in lower(coalesce(policy.with_check, ''))) > 0
  ) then
    raise exception 'Required learning-resource INSERT, SELECT, or UPDATE policy is missing';
  end if;
end
$preflight$;

drop policy if exists "Users can access own files" on storage.objects;
drop policy if exists "Users can delete own files" on storage.objects;
drop policy if exists "Users can update own files" on storage.objects;
drop policy if exists "Users can upload own files" on storage.objects;

