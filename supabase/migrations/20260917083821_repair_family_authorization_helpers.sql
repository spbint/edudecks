-- Forward-only repair for legacy authorization helpers that outlived the
-- family_profiles.user_id / owner_user_id compatibility columns.
--
-- The current family model authorizes through family_members, with the profile
-- creator retained as a bootstrap-safe fallback. Evidence storage paths are
-- also bound to the family, learner, and evidence row they claim to represent.

do $preflight$
begin
  if pg_catalog.to_regprocedure(
    'public.mylearna_family_profile_owned_by_auth(uuid)'
  ) is null then
    raise exception 'Required function mylearna_family_profile_owned_by_auth(uuid) is missing';
  end if;

  if pg_catalog.to_regprocedure(
    'public.mylearna_family_profile_owned_by_auth(text)'
  ) is null then
    raise exception 'Required function mylearna_family_profile_owned_by_auth(text) is missing';
  end if;

  if pg_catalog.to_regprocedure(
    'public.mylearna_evidence_storage_object_owned_by_auth(text)'
  ) is null then
    raise exception 'Required function mylearna_evidence_storage_object_owned_by_auth(text) is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_profiles'
      and column_name = 'created_by_user_id'
      and data_type = 'uuid'
  ) then
    raise exception 'Required column public.family_profiles.created_by_user_id uuid is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence_entries'
      and column_name = 'family_id'
      and data_type = 'uuid'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence_entries'
      and column_name = 'learner_id'
      and data_type = 'uuid'
  ) then
    raise exception 'Required evidence family/learner columns are missing';
  end if;
end
$preflight$;

create or replace function public.mylearna_family_profile_owned_by_auth(
  profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.family_profiles as fp
      where fp.id = profile_id
        and (
          fp.created_by_user_id = auth.uid()
          or public.is_family_member(fp.id)
        )
    );
$$;

create or replace function public.mylearna_family_profile_owned_by_auth(
  target_family_profile_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.family_profiles as fp
      where fp.id::text = pg_catalog.btrim(target_family_profile_id)
        and (
          fp.created_by_user_id = auth.uid()
          or public.is_family_member(fp.id)
        )
    );
$$;

revoke all on function public.mylearna_family_profile_owned_by_auth(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.mylearna_family_profile_owned_by_auth(text)
  from public, anon, authenticated, service_role;
grant execute on function public.mylearna_family_profile_owned_by_auth(uuid)
  to authenticated, service_role;
grant execute on function public.mylearna_family_profile_owned_by_auth(text)
  to authenticated, service_role;

create or replace function public.mylearna_evidence_storage_object_owned_by_auth(
  object_name text
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
    auth.uid() is not null
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
        and (
          ee.created_by_user_id = auth.uid()
          or public.is_family_member(ee.family_id)
        )
    )
  from object_path;
$$;

revoke all on function public.mylearna_evidence_storage_object_owned_by_auth(text)
  from public, anon, authenticated, service_role;
grant execute on function public.mylearna_evidence_storage_object_owned_by_auth(text)
  to authenticated, service_role;
