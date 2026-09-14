-- Containment for the historical school/assessment schema exposed through
-- public. This migration intentionally fails closed for sensitive and
-- internal tables. Policies for those tables must be added only after the
-- corresponding organisation/class/family access model has been validated.
--
-- The current MyLearna Homeschool application does not query these legacy
-- tables directly. service_role is intentionally left unchanged for
-- server-side maintenance and migration work.

-- Public curriculum/reference data: read-only to both API roles.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'assessment_copies',
    'assessment_event_classes',
    'assessment_events',
    'assessment_template_versions',
    'assessment_templates',
    'attribute_curriculum_map',
    'attribute_definitions',
    'attribute_rules',
    'attribute_state_history',
    'attribute_state_points',
    'attribute_states',
    'class_teachers',
    'class_term_targets',
    'curriculum_codes',
    'curriculum_codes_staging',
    'curriculum_framework_items',
    'curriculum_frameworks',
    'curriculum_skill_attribute_map',
    'curriculum_skill_sets',
    'curriculum_skills',
    'development_domains',
    'evidence_attribute_contributions',
    'evidence_attribute_impacts',
    'evidence_attribute_links',
    'evidence_impact_rules',
    'ilp_goals',
    'instrument_domain_map',
    'intervention_attribute_snapshots',
    'intervention_templates',
    'learning_area_framework_map',
    'learning_tendencies',
    'organisations',
    'portfolio_representative_samples',
    'scale_levels',
    'scales',
    'student_attribute_states',
    'student_attribute_trend_points',
    'student_domain_status',
    'student_learning_tendencies',
    'teacher_class_assignments'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
  end loop;
end
$$;

-- Views bypass table RLS unless they are security-invoker views. These
-- historical reporting views project learner, assessment, evidence, class,
-- or intervention data, so remove Data API access until each view has an
-- explicit, validated access design.
do $$
declare
  view_name text;
begin
  foreach view_name in array array[
    'v_active_plans_by_class',
    'v_assessment_points',
    'v_assessment_runs',
    'v_attribute_system_health',
    'v_class_assessment_benchmarks',
    'v_class_assessment_dashboard',
    'v_class_assessment_form',
    'v_class_assessment_gap_rollup',
    'v_class_assessment_results',
    'v_class_domain_coverage',
    'v_class_domain_term_counts',
    'v_class_interventions_dashboard',
    'v_class_overview',
    'v_class_overview_priority',
    'v_class_roster_fm',
    'v_class_roster_fm_named',
    'v_evidence_domain',
    'v_evidence_norm',
    'v_intervention_deltas',
    'v_leadership_heatmap',
    'v_leadership_mtss',
    'v_leadership_workload',
    'v_student_assessment_heatmap',
    'v_student_assessment_latest',
    'v_student_assessment_state',
    'v_student_assessment_trend',
    'v_student_assessment_trend_points',
    'v_student_attribute_form_last5',
    'v_student_attribute_risk',
    'v_student_attribute_snapshot',
    'v_student_attribute_snapshot_v1',
    'v_student_domain_evidence_counts',
    'v_student_profile_overview',
    'v_student_profile_overview_fm',
    'v_suggested_interventions',
    'v_teacher_class_home',
    'v_teacher_class_task_counts',
    'v_teacher_task_actions_deduped',
    'v_teacher_task_inbox_v2',
    'v_teacher_task_inbox_v3',
    'v_teacher_tasks',
    'v_teacher_tasks_class'
  ] loop
    if to_regclass(format('public.%I', view_name)) is not null then
      execute format('revoke select on table public.%I from anon, authenticated', view_name);
    end if;
  end loop;
end
$$;

-- Public RPC execution is another API surface. Keep only the intentionally
-- public shared-portfolio lookup available to anon. Current authenticated
-- grants are preserved; this revokes only anonymous/public execution.
do $$
declare
  function_row record;
begin
  for function_row in
    select p.oid,
           p.proname,
           pg_get_function_identity_arguments(p.oid) as identity_arguments,
           has_function_privilege('public', p.oid, 'EXECUTE') as public_execute
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
      and p.proname <> 'get_shared_portfolio'
  loop
    if function_row.public_execute then
      execute format(
        'revoke execute on function public.%I(%s) from public',
        function_row.proname,
        function_row.identity_arguments
      );
    end if;
    execute format(
      'revoke execute on function public.%I(%s) from anon',
      function_row.proname,
      function_row.identity_arguments
    );
  end loop;
end
$$;

grant execute on function public.get_shared_portfolio(text) to anon;
grant execute on function public.get_shared_portfolio(text, text) to anon;

-- Remove anonymous writes explicitly on the reference tables as well. The
-- later grants restore SELECT only; service_role remains unaffected.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'attribute_curriculum_map',
    'attribute_definitions',
    'curriculum_codes',
    'curriculum_framework_items',
    'curriculum_frameworks',
    'curriculum_skill_attribute_map',
    'curriculum_skill_sets',
    'curriculum_skills',
    'development_domains',
    'learning_area_framework_map',
    'learning_tendencies',
    'scale_levels',
    'scales'
  ] loop
    execute format('revoke insert, update, delete, truncate, references, trigger on table public.%I from authenticated', table_name);
    execute format('grant select on table public.%I to anon, authenticated', table_name);
    execute format('drop policy if exists %I on public.%I', 'legacy_public_read_' || table_name, table_name);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', 'legacy_public_read_' || table_name, table_name);
  end loop;
end
$$;

-- These are not public catalogue data. With RLS enabled and no policy, the
-- ordinary API roles receive no rows and cannot mutate them. They remain
-- available to service_role for controlled server-side operations.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'assessment_copies',
    'assessment_event_classes',
    'assessment_events',
    'assessment_template_versions',
    'assessment_templates',
    'attribute_rules',
    'attribute_state_history',
    'attribute_state_points',
    'attribute_states',
    'class_teachers',
    'class_term_targets',
    'curriculum_codes_staging',
    'evidence_attribute_contributions',
    'evidence_attribute_impacts',
    'evidence_attribute_links',
    'evidence_impact_rules',
    'ilp_goals',
    'instrument_domain_map',
    'intervention_attribute_snapshots',
    'intervention_templates',
    'organisations',
    'portfolio_representative_samples',
    'student_attribute_states',
    'student_attribute_trend_points',
    'student_domain_status',
    'student_learning_tendencies',
    'teacher_class_assignments'
  ] loop
    execute format('revoke all on table public.%I from authenticated', table_name);
  end loop;
end
$$;
