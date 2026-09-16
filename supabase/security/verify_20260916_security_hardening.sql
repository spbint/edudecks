-- Read-only verification for the September 2026 RLS, RPC, and search-path
-- hardening migrations:
--
--   * 20260916082435_contain_remaining_legacy_rls_exposure.sql
--   * 20260916082517_harden_legacy_security_definer_functions.sql
--   * 20260916082555_pin_public_function_search_paths.sql
--
-- Run this as a privileged database role only after all three migrations have
-- been applied to an approved test environment. It does not create test data
-- or change database objects. Any failed assertion aborts the transaction.
-- The final ROLLBACK also clears the local role/JWT settings used below.

begin;
set transaction read only;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ---------------------------------------------------------------------------
-- 1. RLS, table grants, policy shapes, and service-role preservation
-- ---------------------------------------------------------------------------

do $verify_table_security$
declare
  table_name text;
  role_name text;
  privilege_name text;
  policy_expression text;
  all_privileges constant text[] := array[
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
  ];
  write_privileges constant text[] := array[
    'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
  ];
  sensitive_fail_closed constant text[] := array[
    'intervention_evidence_links',
    'intervention_reviews',
    'intervention_students',
    'interventions',
    'student_notes',
    'teacher_notes',
    'beta_interest'
  ];
  scoped_or_reference constant text[] := array[
    'assessments',
    'assessment_instruments',
    'class_assessment_instruments',
    'leadership_targets'
  ];
  service_role_tables constant text[] := array[
    'intervention_evidence_links',
    'intervention_reviews',
    'intervention_students',
    'interventions',
    'student_notes',
    'teacher_notes',
    'assessments',
    'assessment_instruments',
    'class_assessment_instruments',
    'leadership_targets',
    'beta_interest'
  ];
begin
  -- Supabase exposes public through the Data API. Every ordinary/partitioned
  -- table in that schema must therefore have RLS enabled.
  select pg_catalog.format('%I.%I', namespace.nspname, relation.relname)
  into table_name
  from pg_catalog.pg_class as relation
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relkind in ('r', 'p')
    and not relation.relrowsecurity
  order by relation.relname
  limit 1;

  if table_name is not null then
    raise exception 'RLS is disabled on exposed table %', table_name;
  end if;

  foreach table_name in array sensitive_fail_closed || scoped_or_reference
  loop
    if pg_catalog.to_regclass(pg_catalog.format('public.%I', table_name)) is null then
      raise exception 'Expected security target public.% is missing', table_name;
    end if;

    if not (
      select relation.relrowsecurity
      from pg_catalog.pg_class as relation
      join pg_catalog.pg_namespace as namespace
        on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = table_name
        and relation.relkind in ('r', 'p')
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;

    -- PUBLIC is a pseudo-role rather than a row in pg_roles. Inspect ACLs
    -- directly to prove no table privilege is inherited through PUBLIC.
    if exists (
      select 1
      from pg_catalog.pg_class as relation
      join pg_catalog.pg_namespace as namespace
        on namespace.oid = relation.relnamespace
      cross join lateral pg_catalog.aclexplode(
        coalesce(
          relation.relacl,
          pg_catalog.acldefault('r', relation.relowner)
        )
      ) as privilege
      where namespace.nspname = 'public'
        and relation.relname = table_name
        and privilege.grantee = 0
    ) then
      raise exception 'PUBLIC still has a table privilege on public.%', table_name;
    end if;
  end loop;

  -- Learner/intervention/note tables intentionally fail closed until a Campus
  -- tenant model is reviewed. The retired beta-interest table also fails closed
  -- until a separately reviewed, rate-limited server endpoint replaces it.
  foreach table_name in array sensitive_fail_closed
  loop
    if exists (
      select 1
      from pg_catalog.pg_policies
      where schemaname = 'public'
        and tablename = table_name
    ) then
      raise exception 'Unexpected RLS policy remains on fail-closed table public.%', table_name;
    end if;

    foreach role_name in array array['anon', 'authenticated']
    loop
      foreach privilege_name in array all_privileges
      loop
        if pg_catalog.has_table_privilege(
          role_name,
          pg_catalog.format('public.%I', table_name),
          privilege_name
        ) then
          raise exception '% still has % on fail-closed table public.%',
            role_name, privilege_name, table_name;
        end if;
      end loop;
    end loop;
  end loop;

  -- assessments: authenticated SELECT only, using global rows or an explicit
  -- administrator/class/organisation membership predicate.
  if not pg_catalog.has_table_privilege('authenticated', 'public.assessments', 'SELECT') then
    raise exception 'authenticated SELECT is missing on public.assessments';
  end if;
  foreach privilege_name in array write_privileges
  loop
    if pg_catalog.has_table_privilege('authenticated', 'public.assessments', privilege_name) then
      raise exception 'authenticated unexpectedly has % on public.assessments', privilege_name;
    end if;
  end loop;
  foreach privilege_name in array all_privileges
  loop
    if pg_catalog.has_table_privilege('anon', 'public.assessments', privilege_name) then
      raise exception 'anon unexpectedly has % on public.assessments', privilege_name;
    end if;
  end loop;

  if (select count(*) from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'assessments') <> 1 then
    raise exception 'public.assessments must have exactly one scoped policy';
  end if;

  select lower(qual)
  into policy_expression
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename = 'assessments'
    and policyname = 'assessments_authenticated_scope'
    and cmd = 'SELECT'
    and roles = array['authenticated']::name[];

  if policy_expression is null
     or policy_expression = 'true'
     or position('org_id is null' in policy_expression) = 0
     or position('class_id is null' in policy_expression) = 0
     or position('is_admin' in policy_expression) = 0
     or position('class_memberships' in policy_expression) = 0
     or position('org_memberships' in policy_expression) = 0
     or position('auth.uid' in policy_expression) = 0 then
    raise exception 'public.assessments does not have the expected tenant-scoped SELECT policy';
  end if;

  -- assessment_instruments: authenticated CRUD grants are narrowed by a
  -- parent-assessment SELECT policy and existing is_admin() write policies.
  foreach privilege_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
  loop
    if not pg_catalog.has_table_privilege(
      'authenticated', 'public.assessment_instruments', privilege_name
    ) then
      raise exception 'authenticated % is missing on public.assessment_instruments', privilege_name;
    end if;
  end loop;
  foreach privilege_name in array array['TRUNCATE', 'REFERENCES', 'TRIGGER']
  loop
    if pg_catalog.has_table_privilege(
      'authenticated', 'public.assessment_instruments', privilege_name
    ) then
      raise exception 'authenticated unexpectedly has % on public.assessment_instruments', privilege_name;
    end if;
  end loop;
  foreach privilege_name in array all_privileges
  loop
    if pg_catalog.has_table_privilege('anon', 'public.assessment_instruments', privilege_name) then
      raise exception 'anon unexpectedly has % on public.assessment_instruments', privilege_name;
    end if;
  end loop;

  if (select count(*) from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'assessment_instruments') <> 4 then
    raise exception 'public.assessment_instruments must have one scoped read and three admin write policies';
  end if;

  select lower(qual)
  into policy_expression
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename = 'assessment_instruments'
    and policyname = 'assessment_instruments_authenticated_read'
    and cmd = 'SELECT'
    and roles = array['authenticated']::name[];

  if policy_expression is null
     or policy_expression = 'true'
     or position('assessments' in policy_expression) = 0
     or position('assessment_id' in policy_expression) = 0 then
    raise exception 'assessment instruments are not scoped through their parent assessment';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_instruments'
      and policyname = 'assessment_instruments_admin_insert'
      and cmd = 'INSERT'
      and lower(with_check) <> 'true'
  ) or not exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_instruments'
      and policyname = 'assessment_instruments_admin_update'
      and cmd = 'UPDATE'
      and lower(qual) <> 'true'
      and lower(with_check) <> 'true'
  ) or not exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_instruments'
      and policyname = 'assessment_instruments_admin_delete'
      and cmd = 'DELETE'
      and lower(qual) <> 'true'
  ) then
    raise exception 'assessment instrument write policies are not admin-scoped';
  end if;

  -- class_assessment_instruments: authenticated CRUD grants, but tenant-scoped
  -- reads and administrator-only writes.
  foreach privilege_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
  loop
    if not pg_catalog.has_table_privilege(
      'authenticated', 'public.class_assessment_instruments', privilege_name
    ) then
      raise exception 'authenticated % is missing on public.class_assessment_instruments', privilege_name;
    end if;
  end loop;
  foreach privilege_name in array array['TRUNCATE', 'REFERENCES', 'TRIGGER']
  loop
    if pg_catalog.has_table_privilege(
      'authenticated', 'public.class_assessment_instruments', privilege_name
    ) then
      raise exception 'authenticated unexpectedly has % on public.class_assessment_instruments', privilege_name;
    end if;
  end loop;
  foreach privilege_name in array all_privileges
  loop
    if pg_catalog.has_table_privilege('anon', 'public.class_assessment_instruments', privilege_name) then
      raise exception 'anon unexpectedly has % on public.class_assessment_instruments', privilege_name;
    end if;
  end loop;

  if (select count(*) from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'class_assessment_instruments') <> 4 then
    raise exception 'class assessment instruments must have one scoped read and three admin write policies';
  end if;

  select lower(qual)
  into policy_expression
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename = 'class_assessment_instruments'
    and policyname = 'class_assessment_instruments_authenticated_scope'
    and cmd = 'SELECT'
    and roles = array['authenticated']::name[];

  if policy_expression is null
     or policy_expression = 'true'
     or position('classes' in policy_expression) = 0
     or position('class_memberships' in policy_expression) = 0
     or position('auth.uid' in policy_expression) = 0 then
    raise exception 'class assessment instruments do not have the expected tenant scope';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'class_assessment_instruments'
      and policyname = 'class_assessment_instruments_admin_insert'
      and cmd = 'INSERT'
      and lower(with_check) <> 'true'
  ) or not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'class_assessment_instruments'
      and policyname = 'class_assessment_instruments_admin_update'
      and cmd = 'UPDATE'
      and lower(qual) <> 'true'
      and lower(with_check) <> 'true'
  ) or not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'class_assessment_instruments'
      and policyname = 'class_assessment_instruments_admin_delete'
      and cmd = 'DELETE'
      and lower(qual) <> 'true'
  ) then
    raise exception 'class assessment instrument write policies are not admin-scoped';
  end if;

  -- leadership_targets intentionally has global authenticated read access, but
  -- each write command must remain leader/admin-only with no overlapping ALL
  -- policy.
  foreach privilege_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
  loop
    if not pg_catalog.has_table_privilege(
      'authenticated', 'public.leadership_targets', privilege_name
    ) then
      raise exception 'authenticated % is missing on public.leadership_targets', privilege_name;
    end if;
  end loop;
  foreach privilege_name in array array['TRUNCATE', 'REFERENCES', 'TRIGGER']
  loop
    if pg_catalog.has_table_privilege('authenticated', 'public.leadership_targets', privilege_name) then
      raise exception 'authenticated unexpectedly has % on public.leadership_targets', privilege_name;
    end if;
  end loop;
  foreach privilege_name in array all_privileges
  loop
    if pg_catalog.has_table_privilege('anon', 'public.leadership_targets', privilege_name) then
      raise exception 'anon unexpectedly has % on public.leadership_targets', privilege_name;
    end if;
  end loop;

  if (select count(*) from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'leadership_targets') <> 4 then
    raise exception 'leadership targets must have one read and three leader/admin write policies';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'leadership_targets'
      and policyname = 'leadership_targets_authenticated_read'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and lower(qual) = 'true'
  ) or exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'leadership_targets'
      and cmd = 'ALL'
  ) then
    raise exception 'leadership target read/write policy split is incorrect';
  end if;

  foreach privilege_name in array array['INSERT', 'UPDATE', 'DELETE']
  loop
    if not exists (
      select 1
      from pg_catalog.pg_policies
      where schemaname = 'public'
        and tablename = 'leadership_targets'
        and cmd = privilege_name
        and roles = array['authenticated']::name[]
        and coalesce(lower(qual), lower(with_check)) <> 'true'
        and (
          privilege_name <> 'UPDATE'
          or (
            lower(qual) <> 'true'
            and lower(with_check) <> 'true'
          )
        )
    ) then
      raise exception 'leadership target % policy is missing or broad', privilege_name;
    end if;
  end loop;

  -- The service role must keep controlled server-side access to every repaired
  -- table. Test the four data privileges used by maintenance workflows.
  foreach table_name in array service_role_tables
  loop
    foreach privilege_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
    loop
      if not pg_catalog.has_table_privilege(
        'service_role', pg_catalog.format('public.%I', table_name), privilege_name
      ) then
        raise exception 'service_role lost % on public.%', privilege_name, table_name;
      end if;
    end loop;
  end loop;

  if not (
    select role.rolbypassrls
    from pg_catalog.pg_roles as role
    where role.rolname = 'service_role'
  ) then
    raise exception 'service_role no longer has its expected BYPASSRLS attribute';
  end if;

  -- Advisor-equivalent guard: no ordinary API write policy may reduce its
  -- USING/WITH CHECK expression to TRUE. Global read-only catalogue policies
  -- are intentionally excluded.
  if exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      and policy.roles && array['public', 'anon', 'authenticated']::name[]
      and (
        lower(pg_catalog.btrim(coalesce(policy.qual, ''))) in ('true', '(true)')
        or lower(pg_catalog.btrim(coalesce(policy.with_check, ''))) in ('true', '(true)')
      )
  ) then
    raise exception 'An always-true ordinary API write policy remains in public';
  end if;
end
$verify_table_security$;

-- Materialized views in an exposed schema must not be directly readable by
-- either ordinary API role.
do $verify_materialized_views$
declare
  exposed_view text;
begin
  select pg_catalog.format('%I.%I', namespace.nspname, relation.relname)
  into exposed_view
  from pg_catalog.pg_class as relation
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relkind = 'm'
    and (
      pg_catalog.has_table_privilege(
        'anon', pg_catalog.format('%I.%I', namespace.nspname, relation.relname), 'SELECT'
      )
      or pg_catalog.has_table_privilege(
        'authenticated', pg_catalog.format('%I.%I', namespace.nspname, relation.relname), 'SELECT'
      )
    )
  order by relation.relname
  limit 1;

  if exposed_view is not null then
    raise exception 'Materialized view % remains exposed to an ordinary API role', exposed_view;
  end if;
end
$verify_materialized_views$;

-- ---------------------------------------------------------------------------
-- 2. SECURITY DEFINER grants, application RPC allowlist, and search paths
-- ---------------------------------------------------------------------------

do $verify_function_security$
declare
  function_signature text;
  function_oid oid;
  role_name text;
  unexpected_function text;
  mutable_function text;
  schema_name text;
  revoked_rpc_count integer;
  revoked_rpc_distinct_count integer;
  allowed_authenticated_definers constant text[] := array[
    'clean_allocate_program_occurrence(uuid,uuid,uuid)',
    'clean_set_calendar_item_completion(uuid,uuid,timestamp with time zone)',
    'is_family_member(uuid)',
    'is_family_owner(uuid)',
    'mylearna_evidence_attachment_upload_reserved(text)',
    'mylearna_evidence_storage_object_owned_by_auth(text)',
    'mylearna_family_profile_owned_by_auth(uuid)',
    'mylearna_family_profile_owned_by_auth(text)',
    'mylearna_get_evidence_storage_usage(uuid,date)',
    'mylearna_get_runtime_control_state(text)',
    'mylearna_release_evidence_attachment_reservation(text)',
    'mylearna_release_resource_file_upload(uuid)',
    'mylearna_reserve_evidence_attachment_upload(uuid,uuid,uuid,text,bigint)',
    'mylearna_reserve_resource_file_upload(uuid,uuid,text,text,bigint)',
    'mylearna_resource_file_upload_reserved(text)',
    'mylearna_resource_storage_allowance_bytes(uuid)'
  ];
  required_application_rpcs constant text[] := array[
    'clean_allocate_program_occurrence(uuid,uuid,uuid)',
    'clean_append_program_lessons(uuid,uuid,jsonb)',
    'clean_assign_program_learners(uuid,uuid,uuid[])',
    'clean_remove_program_lesson(uuid,uuid,uuid)',
    'clean_reorder_program_lessons(uuid,uuid,uuid[])',
    'clean_set_calendar_item_completion(uuid,uuid,timestamp with time zone)',
    'mylearna_create_custom_learning_queue_item(uuid,uuid,text,text,text)',
    'mylearna_create_custom_learning_queue_item_with_resource(uuid,uuid,text,text,text,text,text,text)',
    'mylearna_get_evidence_storage_usage(uuid,date)',
    'mylearna_get_runtime_control_state(text)',
    'mylearna_release_evidence_attachment_reservation(text)',
    'mylearna_release_resource_file_upload(uuid)',
    'mylearna_reserve_evidence_attachment_upload(uuid,uuid,uuid,text,bigint)',
    'mylearna_reserve_resource_file_upload(uuid,uuid,text,text,bigint)',
    'mylearna_resource_storage_allowance_bytes(uuid)'
  ];
  revoked_rpc_signatures constant text[] := array[
    'add_assessment_result(uuid,text,text,text,date,numeric,text,text,text,integer)',
    'assert_user_owns_student(uuid)',
    'capture_intervention_snapshot(uuid,text)',
    'create_class_intervention(uuid,text,integer)',
    'ensure_intervention_baseline(uuid)',
    'finalize_intervention_review(uuid,date,text,text,jsonb,uuid[])',
    'get_assessment_heatmap(text,uuid)',
    'get_class_hub(uuid)',
    'get_class_leadership_dashboard(uuid)',
    'get_class_overview_metrics(uuid)',
    'get_school_leadership_dashboard()',
    'get_teacher_task_inbox(uuid,integer)',
    'recompute_student_attributes(uuid,integer)',
    'rpc_assessment_distribution(text,uuid,uuid,integer,text,integer)',
    'rpc_support_signals(text,uuid,uuid,integer,text,integer,integer,boolean)',
    'rpc_upsert_assessment_results(jsonb)',
    'save_evidence_attribute_contributions(uuid,jsonb)',
    'upsert_evidence_attribute_contribution(uuid,text,public.evidence_strength,public.evidence_confidence)',
    'current_family_ids()',
    'generate_impacts_from_evidence(integer)',
    'mylearna_enforce_mutation_rate_limit(text,uuid,integer)',
    'mylearna_evidence_entry_owned_by_auth(text,text)',
    'mylearna_record_guardrail_event(text,uuid,text)',
    'mylearna_release_expired_evidence_storage_reservations(uuid,uuid)',
    'mylearna_release_expired_resource_file_upload_reservations(uuid)',
    'mylearna_resolve_evidence_academic_year_id(uuid,date)',
    'mylearna_runtime_control_enabled(text)',
    'recompute_student_attributes_system(uuid,integer)',
    'clean_bootstrap_family_owner_membership()',
    'clean_set_updated_at()',
    'clean_validate_default_learner()',
    'community_sync_new_thread_activity()',
    'community_sync_reply_activity()',
    'mylearna_apply_resource_storage_delete()',
    'mylearna_apply_resource_storage_insert()',
    'mylearna_apply_storage_delete_to_free_quota()',
    'mylearna_apply_storage_insert_to_free_quota()',
    'mylearna_apply_storage_update_to_free_quota()',
    'mylearna_cleanup_deleted_family_resource()',
    'mylearna_cleanup_unreferenced_resource_file()',
    'mylearna_enforce_evidence_record_rate_limit()',
    'mylearna_enforce_learner_abuse_ceiling()',
    'mylearna_enforce_learner_creation_rate_limit()',
    'mylearna_enforce_new_family_activation_enabled()',
    'mylearna_sync_primary_evidence_learner_link()',
    'mylearna_validate_custom_learning_item()',
    'mylearna_validate_custom_learning_resource()',
    'mylearna_validate_evidence_learner_link()',
    'mylearna_validate_family_resource()',
    'mylearna_validate_learner_help_request()',
    'mylearna_validate_learning_queue_item()',
    'set_teacher_notes_user_id()',
    'tg_recompute_student_attributes()'
  ];
begin
  select pg_catalog.count(*), pg_catalog.count(distinct listed.signature)
  into revoked_rpc_count, revoked_rpc_distinct_count
  from pg_catalog.unnest(revoked_rpc_signatures) as listed(signature);

  if revoked_rpc_count <> 53 then
    raise exception 'Expected 53 revoked RPC signatures, found %', revoked_rpc_count;
  end if;

  if revoked_rpc_distinct_count <> revoked_rpc_count then
    raise exception 'Revoked RPC signature list contains % duplicate entries',
      revoked_rpc_count - revoked_rpc_distinct_count;
  end if;

  -- The schemas present in the fixed compatibility search path must not be
  -- writable by any runtime role. Otherwise a caller could shadow a referenced
  -- object even though the path itself is fixed.
  foreach role_name in array array['anon', 'authenticated', 'service_role']
  loop
    foreach schema_name in array array['pg_catalog', 'public', 'extensions', 'storage']
    loop
      if pg_catalog.to_regnamespace(schema_name) is null then
        raise exception 'Trusted search-path schema % is missing', schema_name;
      end if;
      if pg_catalog.has_schema_privilege(role_name, schema_name, 'CREATE') then
        raise exception '% unexpectedly has CREATE on trusted schema %', role_name, schema_name;
      end if;
    end loop;
  end loop;

  -- Supabase's mutable-search-path advisor should have no public function left
  -- to report after the exact-signature hardening migration.
  select pg_catalog.format(
    '%I.%I(%s)',
    namespace.nspname,
    procedure.proname,
    pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  )
  into mutable_function
  from pg_catalog.pg_proc as procedure
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.prokind in ('f', 'p')
    and not exists (
      select 1
      from unnest(coalesce(procedure.proconfig, array[]::text[])) as setting
      where pg_catalog.split_part(setting, '=', 1) = 'search_path'
    )
  order by procedure.proname,
           pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  limit 1;

  if mutable_function is not null then
    raise exception 'Public function still has a caller-mutable search_path: %', mutable_function;
  end if;

  -- The hardening migration uses pg_temp explicitly in the final position.
  -- Existing modern functions use either public or public,storage. Reject any
  -- other path shape so a later change cannot silently introduce $user or put
  -- a caller-writable temporary schema ahead of trusted schemas.
  select pg_catalog.format(
    '%I.%I(%s)',
    namespace.nspname,
    procedure.proname,
    pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  )
  into mutable_function
  from pg_catalog.pg_proc as procedure
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = procedure.pronamespace
  cross join lateral unnest(procedure.proconfig) as setting
  where namespace.nspname = 'public'
    and pg_catalog.split_part(setting, '=', 1) = 'search_path'
    and pg_catalog.replace(
      pg_catalog.replace(
        pg_catalog.split_part(setting, '=', 2),
        ' ',
        ''
      ),
      '"',
      ''
    ) not in (
      '',
      'public',
      'public,storage',
      'pg_catalog,public,extensions,pg_temp'
    )
  order by procedure.proname,
           pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  limit 1;

  if mutable_function is not null then
    raise exception 'Public function has an unreviewed fixed search_path: %', mutable_function;
  end if;

  -- Exactly the reviewed 16 SECURITY DEFINER helpers/RPCs remain executable by
  -- authenticated. No SECURITY DEFINER function is directly callable by anon.
  foreach function_signature in array allowed_authenticated_definers
  loop
    function_oid := pg_catalog.to_regprocedure('public.' || function_signature)::oid;
    if function_oid is null then
      raise exception 'Required SECURITY DEFINER function public.% is missing', function_signature;
    end if;
    if not (select procedure.prosecdef from pg_catalog.pg_proc as procedure where procedure.oid = function_oid) then
      raise exception 'Required function public.% is no longer SECURITY DEFINER', function_signature;
    end if;
    if not pg_catalog.has_function_privilege('authenticated', function_oid, 'EXECUTE') then
      raise exception 'authenticated EXECUTE is missing on public.%', function_signature;
    end if;
    if pg_catalog.has_function_privilege('anon', function_oid, 'EXECUTE') then
      raise exception 'anon unexpectedly has EXECUTE on public.%', function_signature;
    end if;
    if not pg_catalog.has_function_privilege('service_role', function_oid, 'EXECUTE') then
      raise exception 'service_role EXECUTE is missing on public.%', function_signature;
    end if;
  end loop;

  select pg_catalog.format(
    '%I.%I(%s)',
    namespace.nspname,
    procedure.proname,
    pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  )
  into unexpected_function
  from pg_catalog.pg_proc as procedure
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.prosecdef
    and pg_catalog.has_function_privilege('authenticated', procedure.oid, 'EXECUTE')
    and not exists (
      select 1
      from unnest(allowed_authenticated_definers) as allowed(signature)
      where pg_catalog.to_regprocedure('public.' || allowed.signature)::oid = procedure.oid
    )
  order by procedure.proname,
           pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  limit 1;

  if unexpected_function is not null then
    raise exception 'Unexpected authenticated SECURITY DEFINER function remains callable: %',
      unexpected_function;
  end if;

  select pg_catalog.format(
    '%I.%I(%s)',
    namespace.nspname,
    procedure.proname,
    pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  )
  into unexpected_function
  from pg_catalog.pg_proc as procedure
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.prosecdef
    and pg_catalog.has_function_privilege('anon', procedure.oid, 'EXECUTE')
  order by procedure.proname,
           pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  limit 1;

  if unexpected_function is not null then
    raise exception 'Anonymous SECURITY DEFINER function remains callable: %', unexpected_function;
  end if;

  -- Every explicitly removed legacy/internal/trigger RPC must remain denied to
  -- both ordinary roles while retaining service_role execution.
  foreach function_signature in array revoked_rpc_signatures
  loop
    function_oid := pg_catalog.to_regprocedure('public.' || function_signature)::oid;
    if function_oid is null then
      raise exception 'Expected revoked function public.% is missing', function_signature;
    end if;
    foreach role_name in array array['anon', 'authenticated']
    loop
      if pg_catalog.has_function_privilege(role_name, function_oid, 'EXECUTE') then
        raise exception '% still has EXECUTE on revoked function public.%',
          role_name, function_signature;
      end if;
    end loop;
    if not pg_catalog.has_function_privilege('service_role', function_oid, 'EXECUTE') then
      raise exception 'service_role lost EXECUTE on public.%', function_signature;
    end if;
  end loop;

  -- Trigger functions must be trigger-only; none may be exposed as a direct RPC.
  select pg_catalog.format(
    '%I.%I(%s)',
    namespace.nspname,
    procedure.proname,
    pg_catalog.pg_get_function_identity_arguments(procedure.oid)
  )
  into unexpected_function
  from pg_catalog.pg_proc as procedure
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype
    and (
      pg_catalog.has_function_privilege('anon', procedure.oid, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', procedure.oid, 'EXECUTE')
    )
  order by procedure.proname
  limit 1;

  if unexpected_function is not null then
    raise exception 'Trigger function remains directly callable by an API role: %',
      unexpected_function;
  end if;

  -- RPCs called by checked-in Homeschool code must remain callable by signed-in
  -- users and service_role, but not by anon.
  foreach function_signature in array required_application_rpcs
  loop
    function_oid := pg_catalog.to_regprocedure('public.' || function_signature)::oid;
    if function_oid is null then
      raise exception 'Required application RPC public.% is missing', function_signature;
    end if;
    if not pg_catalog.has_function_privilege('authenticated', function_oid, 'EXECUTE') then
      raise exception 'authenticated lost EXECUTE on application RPC public.%', function_signature;
    end if;
    if pg_catalog.has_function_privilege('anon', function_oid, 'EXECUTE') then
      raise exception 'anon unexpectedly has EXECUTE on application RPC public.%', function_signature;
    end if;
    if not pg_catalog.has_function_privilege('service_role', function_oid, 'EXECUTE') then
      raise exception 'service_role lost EXECUTE on application RPC public.%', function_signature;
    end if;
  end loop;
end
$verify_function_security$;

-- ---------------------------------------------------------------------------
-- 3. Dormant portfolio-share implementation and password-bypass regression
-- ---------------------------------------------------------------------------

do $verify_portfolio_share_functions$
declare
  one_arg_oid oid := pg_catalog.to_regprocedure('public.get_shared_portfolio(text)')::oid;
  two_arg_oid oid := pg_catalog.to_regprocedure('public.get_shared_portfolio(text,text)')::oid;
  role_name text;
  one_arg_definition text;
  two_arg_definition text;
  search_path_setting text;
  share_record record;
  returned_rows bigint;
begin
  if one_arg_oid is null or two_arg_oid is null then
    raise exception 'Both get_shared_portfolio overloads must exist';
  end if;

  if (select procedure.pronargdefaults from pg_catalog.pg_proc as procedure where procedure.oid = one_arg_oid) <> 0
     or (select procedure.pronargdefaults from pg_catalog.pg_proc as procedure where procedure.oid = two_arg_oid) <> 0 then
    raise exception 'Portfolio-share overloads must not declare default arguments';
  end if;

  foreach role_name in array array['anon', 'authenticated']
  loop
    if pg_catalog.has_function_privilege(role_name, one_arg_oid, 'EXECUTE')
       or pg_catalog.has_function_privilege(role_name, two_arg_oid, 'EXECUTE') then
      raise exception '% can execute a dormant get_shared_portfolio overload', role_name;
    end if;
  end loop;

  if not pg_catalog.has_function_privilege('service_role', one_arg_oid, 'EXECUTE')
     or not pg_catalog.has_function_privilege('service_role', two_arg_oid, 'EXECUTE') then
    raise exception 'service_role must retain both get_shared_portfolio overloads';
  end if;

  if not (select procedure.prosecdef from pg_catalog.pg_proc as procedure where procedure.oid = one_arg_oid)
     or not (select procedure.prosecdef from pg_catalog.pg_proc as procedure where procedure.oid = two_arg_oid) then
    raise exception 'Portfolio-share functions changed away from the reviewed SECURITY DEFINER design';
  end if;

  foreach search_path_setting in array array[
    (select setting
     from pg_catalog.pg_proc as procedure
     cross join lateral unnest(coalesce(procedure.proconfig, array[]::text[])) as setting
     where procedure.oid = one_arg_oid
       and pg_catalog.split_part(setting, '=', 1) = 'search_path'),
    (select setting
     from pg_catalog.pg_proc as procedure
     cross join lateral unnest(coalesce(procedure.proconfig, array[]::text[])) as setting
     where procedure.oid = two_arg_oid
       and pg_catalog.split_part(setting, '=', 1) = 'search_path')
  ]
  loop
    if search_path_setting is null
       or pg_catalog.btrim(
         pg_catalog.replace(
           pg_catalog.split_part(search_path_setting, '=', 2),
           '"',
           ''
         )
       ) <> '' then
      raise exception 'Portfolio-share functions must use an empty fixed search_path';
    end if;
  end loop;

  one_arg_definition := lower(pg_catalog.pg_get_functiondef(one_arg_oid));
  two_arg_definition := lower(pg_catalog.pg_get_functiondef(two_arg_oid));

  if position('length(p_token) < 20' in one_arg_definition) = 0
     or position('expires_at' in one_arg_definition) = 0
     or position('password_hash is null' in one_arg_definition) = 0 then
    raise exception 'One-argument portfolio lookup can bypass token, expiry, or password safeguards';
  end if;

  if position('length(p_token) < 20' in two_arg_definition) = 0
     or position('expires_at' in two_arg_definition) = 0
     or position('p_password is not null' in two_arg_definition) = 0
     or position('extensions.crypt' in two_arg_definition) = 0 then
    raise exception 'Password-aware portfolio lookup is missing a required safeguard';
  end if;

  -- If real share rows exist in a test clone, prove that the one-argument
  -- overload returns no password-protected or expired share. No row contents
  -- are emitted by this verification.
  for share_record in
    select link.share_token,
           link.password_hash,
           link.expires_at
    from public.portfolio_share_links as link
    where pg_catalog.length(link.share_token) >= 20
    order by link.created_at desc
    limit 20
  loop
    select count(*)
    into returned_rows
    from public.get_shared_portfolio(share_record.share_token);

    if share_record.password_hash is not null and returned_rows <> 0 then
      raise exception 'One-argument portfolio lookup exposed a password-protected share';
    end if;
    if share_record.expires_at is not null
       and share_record.expires_at <= pg_catalog.now()
       and returned_rows <> 0 then
      raise exception 'One-argument portfolio lookup exposed an expired share';
    end if;
  end loop;
end
$verify_portfolio_share_functions$;

-- ---------------------------------------------------------------------------
-- 4. Runtime role simulation: two unrelated signed-in identities
-- ---------------------------------------------------------------------------

-- These deterministic UUIDs are used only as JWT claims. Abort rather than
-- accidentally impersonating a real account if either UUID ever exists.
do $verify_sentinel_users$
begin
  if exists (
    select 1
    from auth.users as auth_user
    where auth_user.id = any (array[
      '00000000-0000-0000-0000-000000000001'::uuid,
      'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid
    ])
  ) then
    raise exception 'A verification sentinel UUID belongs to a real auth user';
  end if;
end
$verify_sentinel_users$;

set local role authenticated;

do $verify_authenticated_runtime$
declare
  test_user uuid;
  table_name text;
  visible_rows bigint;
begin
  foreach test_user in array array[
    '00000000-0000-0000-0000-000000000001'::uuid,
    'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid
  ]
  loop
    perform pg_catalog.set_config('request.jwt.claim.sub', test_user::text, true);
    perform pg_catalog.set_config(
      'request.jwt.claims',
      pg_catalog.jsonb_build_object(
        'sub', test_user::text,
        'role', 'authenticated'
      )::text,
      true
    );

    -- The fail-closed tables must deny at the table-grant boundary, not merely
    -- happen to return zero rows for this identity.
    foreach table_name in array array[
      'intervention_evidence_links',
      'intervention_reviews',
      'intervention_students',
      'interventions',
      'student_notes',
      'teacher_notes',
      'beta_interest'
    ]
    loop
      begin
        execute pg_catalog.format('select count(*) from public.%I', table_name)
        into visible_rows;
        raise exception 'Authenticated sentinel unexpectedly read public.%', table_name;
      exception
        when insufficient_privilege then
          null;
      end;
    end loop;

    -- A user with no class/org membership may see global assessment catalogue
    -- rows, but never a tenant-scoped assessment or class assignment.
    select count(*)
    into visible_rows
    from public.assessments
    where org_id is not null or class_id is not null;
    if visible_rows <> 0 then
      raise exception 'Authenticated sentinel saw a tenant-scoped assessment';
    end if;

    select count(*)
    into visible_rows
    from public.class_assessment_instruments;
    if visible_rows <> 0 then
      raise exception 'Authenticated sentinel saw a class/instrument assignment';
    end if;

    -- These intended authenticated-read surfaces must remain queryable.
    perform 1 from public.assessment_instruments limit 1;
    perform 1 from public.leadership_targets limit 1;

  end loop;
end
$verify_authenticated_runtime$;

reset role;

-- Prove service_role can still read every repaired relation and execute the
-- dormant share helpers without exposing any returned data in this report.
set local role service_role;

do $verify_service_runtime$
declare
  table_name text;
  row_count bigint;
begin
  foreach table_name in array array[
    'intervention_evidence_links',
    'intervention_reviews',
    'intervention_students',
    'interventions',
    'student_notes',
    'teacher_notes',
    'assessments',
    'assessment_instruments',
    'class_assessment_instruments',
    'leadership_targets',
    'beta_interest'
  ]
  loop
    execute pg_catalog.format('select count(*) from public.%I', table_name)
    into row_count;
  end loop;

  select count(*)
  into row_count
  from public.get_shared_portfolio('verification-token-is-intentionally-invalid');
end
$verify_service_runtime$;

reset role;

-- Clear the simulated role/JWT settings before returning the summary. All
-- verification above ran in a read-only transaction, so this cannot undo a
-- database change because no database change was permitted.
rollback;

-- ---------------------------------------------------------------------------
-- 5. Compact advisor-oriented result (all assertions above have passed)
-- ---------------------------------------------------------------------------

select pg_catalog.jsonb_build_object(
  'status', 'PASS',
  'rls_disabled_in_public', (
    select count(*)
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p')
      and not relation.relrowsecurity
  ),
  'always_true_write_policies', (
    select count(*)
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      and policy.roles && array['public', 'anon', 'authenticated']::name[]
      and (
        lower(pg_catalog.btrim(coalesce(policy.qual, ''))) in ('true', '(true)')
        or lower(pg_catalog.btrim(coalesce(policy.with_check, ''))) in ('true', '(true)')
      )
  ),
  'mutable_public_function_search_paths', (
    select count(*)
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prokind in ('f', 'p')
      and not exists (
        select 1
        from unnest(coalesce(procedure.proconfig, array[]::text[])) as setting
        where pg_catalog.split_part(setting, '=', 1) = 'search_path'
      )
  ),
  'anon_security_definer_executable', (
    select count(*)
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
      and pg_catalog.has_function_privilege('anon', procedure.oid, 'EXECUTE')
  ),
  'authenticated_security_definer_executable_reviewed', (
    select count(*)
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
      and pg_catalog.has_function_privilege('authenticated', procedure.oid, 'EXECUTE')
  ),
  'api_exposed_materialized_views', (
    select count(*)
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'm'
      and (
        pg_catalog.has_table_privilege(
          'anon', pg_catalog.format('%I.%I', namespace.nspname, relation.relname), 'SELECT'
        )
        or pg_catalog.has_table_privilege(
          'authenticated', pg_catalog.format('%I.%I', namespace.nspname, relation.relname), 'SELECT'
        )
      )
  )
) as verification_summary;
