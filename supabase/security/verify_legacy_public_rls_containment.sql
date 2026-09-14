-- Read-only verification for 20260914130000_contain_legacy_public_rls_exposure.
-- Run against a disposable/staging database after the migration, never as a
-- substitute for authenticated cross-tenant tests.

do $$
declare
  table_name text;
  public_read_tables constant text[] := array[
    'attribute_curriculum_map', 'attribute_definitions', 'curriculum_codes',
    'curriculum_framework_items', 'curriculum_frameworks',
    'curriculum_skill_attribute_map', 'curriculum_skill_sets',
    'curriculum_skills', 'development_domains',
    'learning_area_framework_map', 'learning_tendencies', 'scale_levels', 'scales'
  ];
  contained_tables constant text[] := array[
    'assessment_copies', 'assessment_event_classes', 'assessment_events',
    'assessment_template_versions', 'assessment_templates', 'attribute_rules',
    'attribute_state_history', 'attribute_state_points', 'attribute_states',
    'class_teachers', 'class_term_targets', 'curriculum_codes_staging',
    'evidence_attribute_contributions', 'evidence_attribute_impacts',
    'evidence_attribute_links', 'evidence_impact_rules', 'ilp_goals',
    'instrument_domain_map', 'intervention_attribute_snapshots',
    'intervention_templates', 'organisations', 'portfolio_representative_samples',
    'student_attribute_states', 'student_attribute_trend_points',
    'student_domain_status', 'student_learning_tendencies',
    'teacher_class_assignments'
  ];
begin
  foreach table_name in array public_read_tables || contained_tables loop
    if not (select c.relrowsecurity
            from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relname = table_name) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;
    if has_table_privilege('anon', format('public.%I', table_name), 'INSERT')
       or has_table_privilege('anon', format('public.%I', table_name), 'UPDATE')
       or has_table_privilege('anon', format('public.%I', table_name), 'DELETE')
       or has_table_privilege('anon', format('public.%I', table_name), 'TRUNCATE')
       or has_table_privilege('anon', format('public.%I', table_name), 'REFERENCES')
       or has_table_privilege('anon', format('public.%I', table_name), 'TRIGGER') then
      raise exception 'Anonymous write privilege remains on public.%', table_name;
    end if;
  end loop;

  foreach table_name in array public_read_tables loop
    if not has_table_privilege('anon', format('public.%I', table_name), 'SELECT') then
      raise exception 'Expected anonymous read privilege is missing on public.%', table_name;
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = 'legacy_public_read_' || table_name
        and cmd = 'SELECT'
    ) then
      raise exception 'Public read policy is missing on public.%', table_name;
    end if;
  end loop;

  foreach table_name in array contained_tables loop
    if has_table_privilege('anon', format('public.%I', table_name), 'SELECT') then
      raise exception 'Anonymous read privilege remains on contained table public.%', table_name;
    end if;
  end loop;
end
$$;

do $$
declare
  function_row record;
begin
  for function_row in
    select p.proname, pg_get_function_identity_arguments(p.oid) as identity_arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
      and p.proname <> 'get_shared_portfolio'
  loop
    raise exception 'Unexpected anonymous EXECUTE on public.%(%)',
      function_row.proname, function_row.identity_arguments;
  end loop;
end
$$;

-- Reporting views must not bypass the table containment above.
do $$
declare
  view_name text;
begin
  foreach view_name in array array[
    'v_active_plans_by_class', 'v_assessment_points', 'v_assessment_runs',
    'v_attribute_system_health', 'v_class_assessment_benchmarks',
    'v_class_assessment_dashboard', 'v_class_assessment_form',
    'v_class_assessment_gap_rollup', 'v_class_assessment_results',
    'v_class_domain_coverage', 'v_class_domain_term_counts',
    'v_class_interventions_dashboard', 'v_class_overview',
    'v_class_overview_priority', 'v_class_roster_fm', 'v_class_roster_fm_named',
    'v_evidence_domain', 'v_evidence_norm', 'v_intervention_deltas',
    'v_leadership_heatmap', 'v_leadership_mtss', 'v_leadership_workload',
    'v_student_assessment_heatmap', 'v_student_assessment_latest',
    'v_student_assessment_state', 'v_student_assessment_trend',
    'v_student_assessment_trend_points', 'v_student_attribute_form_last5',
    'v_student_attribute_risk', 'v_student_attribute_snapshot',
    'v_student_attribute_snapshot_v1', 'v_student_domain_evidence_counts',
    'v_student_profile_overview', 'v_student_profile_overview_fm',
    'v_suggested_interventions', 'v_teacher_class_home',
    'v_teacher_class_task_counts', 'v_teacher_task_actions_deduped',
    'v_teacher_task_inbox_v2', 'v_teacher_task_inbox_v3', 'v_teacher_tasks',
    'v_teacher_tasks_class'
  ] loop
    if to_regclass(format('public.%I', view_name)) is not null
       and (has_table_privilege('anon', format('public.%I', view_name), 'SELECT')
            or has_table_privilege('authenticated', format('public.%I', view_name), 'SELECT')) then
      raise exception 'Unauthorised SELECT remains on sensitive view public.%', view_name;
    end if;
  end loop;
end
$$;
