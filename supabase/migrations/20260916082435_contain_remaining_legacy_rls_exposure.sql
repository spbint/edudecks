-- Contain the remaining broad legacy school/assessment policies found after
-- 20260914125836_contain_legacy_public_rls_exposure.
--
-- The current MyLearna Homeschool application has a read-only dependency on
-- assessment_instruments; the scoped assessment policies below preserve that
-- path. It does not query the intervention, teacher-note, student-note,
-- leadership-target, or retired beta-interest tables below. Sensitive legacy
-- tables therefore fail closed until a separately reviewed Campus
-- organisation/class authorization model is ready.
--
-- service_role grants are intentionally left unchanged. It bypasses RLS and is
-- still required for controlled server-side maintenance and migration work.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- These tables contain learner notes, interventions, reviews, evidence links,
-- or learner assignments. Their historical policies allowed every signed-in
-- user to see or mutate every row. No current Homeschool runtime dependency was
-- found, so remove all ordinary API access and every legacy policy.
do $contain_sensitive_legacy_tables$
declare
  table_name text;
  policy_row record;
begin
  foreach table_name in array array[
    'intervention_evidence_links',
    'intervention_reviews',
    'intervention_students',
    'interventions',
    'student_notes',
    'teacher_notes'
  ] loop
    if to_regclass(format('public.%I', table_name)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'revoke all privileges on table public.%I from public, anon, authenticated',
      table_name
    );

    for policy_row in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        policy_row.policyname,
        table_name
      );
    end loop;
  end loop;
end
$contain_sensitive_legacy_tables$;

-- Legacy assessment headers may identify an organisation or class. Retain
-- authenticated read access only when the caller is an administrator,
-- owns/belongs to the class, or belongs to the organisation. Ordinary API
-- writes remain disabled; service_role is unchanged. These predicates use the
-- caller-visible membership rows directly: the historical can_access_class()
-- helper cannot reliably recognise an ordinary class member because it is a
-- security-invoker function and the classes table has its own RLS filter.
alter table if exists public.assessments enable row level security;
revoke all privileges on table public.assessments from public, anon, authenticated;
grant select on table public.assessments to authenticated;

drop policy if exists assessments_select_auth on public.assessments;
drop policy if exists assessments_authenticated_scope on public.assessments;
create policy assessments_authenticated_scope
on public.assessments
for select
to authenticated
using (
  -- Existing catalogue rows are global (both scope columns are null). Future
  -- tenant rows must satisfy an explicit administrator/class/org predicate.
  (org_id is null and class_id is null)
  or (select public.is_admin())
  or (
    class_id is not null
    and exists (
      select 1
      from public.classes class_row
      where class_row.id = assessments.class_id
        and class_row.owner_user_id = (select auth.uid())
    )
  )
  or (
    class_id is not null
    and exists (
      select 1
      from public.class_memberships membership
      where membership.class_id = assessments.class_id
        and membership.user_id = (select auth.uid())
    )
  )
  or (
    org_id is not null
    and exists (
      select 1
      from public.org_memberships membership
      where membership.org_id = assessments.org_id
        and membership.user_id = (select auth.uid())
    )
  )
);

comment on policy assessments_authenticated_scope on public.assessments is
  'Allows global catalogue rows and restricts tenant assessment headers to administrators, class members, or organisation members.';

-- Assessment instruments are reference metadata used by the historical
-- assessment snapshot. Preserve all eight current instruments because their
-- parent assessments are global, inherit any future tenant scope from the
-- parent assessment policy, consolidate the duplicate read policies, and
-- retain the existing is_admin()-guarded CRUD policies.
alter table if exists public.assessment_instruments enable row level security;
revoke all privileges on table public.assessment_instruments from public, anon, authenticated;
grant select, insert, update, delete on table public.assessment_instruments to authenticated;

drop policy if exists assessment_instruments_read on public.assessment_instruments;
drop policy if exists assessment_instruments_select_auth on public.assessment_instruments;
drop policy if exists assessment_instruments_authenticated_read on public.assessment_instruments;
create policy assessment_instruments_authenticated_read
on public.assessment_instruments
for select
to authenticated
using (
  exists (
    select 1
    from public.assessments parent_assessment
    where parent_assessment.id = assessment_instruments.assessment_id
  )
);

comment on policy assessment_instruments_authenticated_read on public.assessment_instruments is
  'Allows signed-in users to read instruments only when the parent assessment is visible under RLS.';

-- Class/instrument assignments are tenant data. Preserve administrator writes,
-- but only expose rows to administrators, class owners, or class members.
alter table if exists public.class_assessment_instruments enable row level security;
revoke all privileges on table public.class_assessment_instruments from public, anon, authenticated;
grant select, insert, update, delete on table public.class_assessment_instruments to authenticated;

drop policy if exists class_assessment_instruments_read on public.class_assessment_instruments;
drop policy if exists class_assessment_instruments_authenticated_scope on public.class_assessment_instruments;
create policy class_assessment_instruments_authenticated_scope
on public.class_assessment_instruments
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.classes class_row
    where class_row.id = class_assessment_instruments.class_id
      and class_row.owner_user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.class_memberships membership
    where membership.class_id = class_assessment_instruments.class_id
      and membership.user_id = (select auth.uid())
  )
);

comment on policy class_assessment_instruments_authenticated_scope on public.class_assessment_instruments is
  'Restricts legacy class/instrument assignments to administrators and authorised class members.';

-- Leadership targets are global, non-learner configuration values. Preserve
-- signed-in read access and leader/admin writes, while removing unnecessary
-- TRUNCATE, REFERENCES, and TRIGGER privileges. Split the historical ALL
-- policy by command so it no longer overlaps the global SELECT policy.
alter table if exists public.leadership_targets enable row level security;
revoke all privileges on table public.leadership_targets from public, anon, authenticated;
grant select, insert, update, delete on table public.leadership_targets to authenticated;

drop policy if exists "read targets" on public.leadership_targets;
drop policy if exists "edit targets leaders" on public.leadership_targets;
drop policy if exists leadership_targets_authenticated_read on public.leadership_targets;
drop policy if exists leadership_targets_leader_insert on public.leadership_targets;
drop policy if exists leadership_targets_leader_update on public.leadership_targets;
drop policy if exists leadership_targets_leader_delete on public.leadership_targets;
create policy leadership_targets_authenticated_read
on public.leadership_targets
for select
to authenticated
using (true);

create policy leadership_targets_leader_insert
on public.leadership_targets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and (coalesce(profile_row.is_admin, false) or coalesce(profile_row.is_leader, false))
  )
);

create policy leadership_targets_leader_update
on public.leadership_targets
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and (coalesce(profile_row.is_admin, false) or coalesce(profile_row.is_leader, false))
  )
)
with check (
  exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and (coalesce(profile_row.is_admin, false) or coalesce(profile_row.is_leader, false))
  )
);

create policy leadership_targets_leader_delete
on public.leadership_targets
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and (coalesce(profile_row.is_admin, false) or coalesce(profile_row.is_leader, false))
  )
);

comment on policy leadership_targets_authenticated_read on public.leadership_targets is
  'Allows signed-in users to read global leadership target configuration; writes remain leader/admin-only.';

-- /beta is retired, the application has no beta_interest runtime references,
-- and production currently contains no rows. Remove the dormant public append
-- endpoint entirely. A future lead form must use a separately reviewed,
-- rate-limited server endpoint rather than reopening direct anonymous table
-- access.
do $contain_retired_beta_interest$
declare
  policy_row record;
begin
  if to_regclass('public.beta_interest') is not null then
    alter table public.beta_interest enable row level security;
    revoke all privileges on table public.beta_interest from public, anon, authenticated;

    for policy_row in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'beta_interest'
    loop
      execute format(
        'drop policy if exists %I on public.beta_interest',
        policy_row.policyname
      );
    end loop;
  end if;
end
$contain_retired_beta_interest$;

commit;

-- Verification expectations (enforced by the companion read-only security
-- verification script):
--   * anon has no privileges on the ten legacy school/assessment tables or
--     the retired beta_interest table;
--   * authenticated has no privileges/policies on the six sensitive tables or
--     the retired beta_interest table;
--   * assessments and class assignments are tenant-scoped;
--   * assessment instruments and leadership targets remain authenticated-read;
--   * beta_interest has no ordinary API privileges or policies;
--   * service_role privileges are unchanged.
