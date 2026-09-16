-- Pin the execution search path for the remaining legacy public functions.
--
-- This is compatibility-focused hardening. The live definitions contain
-- unqualified references to public relations/helpers, and
-- add_assessment_result(uuid, ...) calls gen_random_uuid() without a schema
-- qualifier, so the Supabase extension schema is retained for compatibility.
-- Production preflight confirmed
-- that anon, authenticated, and service_role have USAGE but not CREATE on each
-- persistent schema in this fixed path. pg_temp is named explicitly at the end
-- so PostgreSQL does not implicitly search the caller's temporary schema first.
--
-- The two get_shared_portfolio overloads are intentionally absent: the
-- immediately preceding RPC-hardening migration recreates those functions with
-- fully qualified references and an empty search_path.
--
-- Each lookup is guarded because the repository and remote migration ledgers
-- contain known historical divergence. Missing legacy functions are skipped;
-- every function that does exist is addressed by its exact identity signature.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $pin_public_function_search_paths$
declare
  target_signature text;
  target_signatures constant text[] := array[
    'public.accept_suggested_impacts(integer,uuid)',
    'public.add_assessment_result(uuid,text,text,text,date,numeric,text,text,text,integer)',
    'public.add_intervention_review(uuid,text,text,text,text,date)',
    'public.apply_accepted_impacts(integer)',
    'public.apply_staleness_decay(integer,numeric,numeric,integer)',
    'public.assert_user_owns_student(uuid)',
    'public.auto_accept_suggested_impacts(numeric,integer)',
    'public.auto_accept_suggested_impacts_allowlist(numeric,integer,text[])',
    'public.can_access_class(uuid)',
    'public.can_access_student(uuid)',
    'public.can_view_student(uuid)',
    'public.capture_intervention_snapshot(uuid,text)',
    'public.class_overview_feed(uuid,integer,boolean,text,integer)',
    'public.clean_set_updated_at()',
    'public.community_sync_new_thread_activity()',
    'public.community_sync_reply_activity()',
    'public.create_student_plan_from_template(uuid,uuid,uuid,text,date,uuid)',
    'public.ensure_intervention_baseline(uuid)',
    'public.finalize_intervention_review(uuid,date,text,text,jsonb,uuid[])',
    'public.generate_impacts_from_evidence(integer)',
    'public.get_admin_evidence_coverage(integer,integer)',
    'public.get_admin_interventions_queue(integer)',
    'public.get_admin_overview_metrics(integer)',
    'public.get_admin_students_directory()',
    'public.get_assessment_heatmap(text,uuid)',
    'public.get_attribute_heatmap_view(uuid)',
    'public.get_class_evidence_rollup(uuid,date,date)',
    'public.get_class_hub(uuid)',
    'public.get_class_intervention_log(uuid,text,text,integer,integer)',
    'public.get_class_interventions_queue(uuid,integer)',
    'public.get_class_leadership_dashboard(uuid)',
    'public.get_class_overview_metrics(uuid)',
    'public.get_class_squad_view(uuid)',
    'public.get_cohort_coach_summary(uuid)',
    'public.get_cohort_squad_view(uuid)',
    'public.get_curriculum_lens_view(uuid,text)',
    'public.get_curriculum_lens_view(uuid,text,text,integer,text,integer)',
    'public.get_evidence_drawer_view(uuid)',
    'public.get_intervention_detail(uuid,integer,integer)',
    'public.get_intervention_review(uuid)',
    'public.get_intervention_reviews(uuid)',
    'public.get_intervention_shortlist(uuid,integer)',
    'public.get_leadership_overview()',
    'public.get_school_leadership_dashboard()',
    'public.get_student_profile_v1(uuid,integer)',
    'public.get_student_profile_view(uuid,integer,text,integer)',
    'public.get_student_quick_view(uuid,integer)',
    'public.is_admin()',
    'public.is_staff_admin(uuid)',
    'public.key_stage_for_year(integer)',
    'public.migrate_assessment_results_to_evidence(integer)',
    'public.migrate_student_notes_to_evidence(integer)',
    'public.mylearna_storage_metadata_size_bytes(jsonb)',
    'public.normalise_scale_label(uuid,text)',
    'public.refresh_reporting_caches()',
    'public.refresh_student_attribute_trends(integer,numeric,numeric)',
    'public.rpc_actions_due_soon(text,uuid,integer,text,integer,text)',
    'public.rpc_attention_queue(integer)',
    'public.rpc_cohort_planning_dashboard(text,uuid,uuid,integer,text,integer,boolean,boolean)',
    'public.rpc_pick_col(text,text[])',
    'public.rpc_student_last_activity(uuid[])',
    'public.run_full_impact_pipeline(integer,numeric,integer,integer)',
    'public.run_full_impact_pipeline_allowlist(integer,numeric,integer,integer,text[])',
    'public.run_impact_pipeline(numeric,integer,integer)',
    'public.seed_baseline_acara_attributes(numeric)',
    'public.set_family_profiles_updated_at()',
    'public.set_owner_user_id()',
    'public.set_planner_blocks_updated_at()',
    'public.set_report_drafts_updated_at()',
    'public.set_report_presets_updated_at()',
    'public.set_snapshot_day()',
    'public.set_sps_updated_at()',
    'public.set_student_evidence_curation_updated_at()',
    'public.set_student_profile_snapshots_updated_at()',
    'public.set_teacher_full_name()',
    'public.set_teacher_notes_user_id()',
    'public.set_updated_at()',
    'public.snapshot_attribute_states(text)',
    'public.touch_updated_at()',
    'public.trg_set_updated_at()',
    'public.year_level_to_key_stage(integer)'
  ];
  target_oid oid;
  target_schema name;
  target_name name;
  target_arguments text;
  target_count integer;
  distinct_target_count integer;
begin
  select pg_catalog.count(*), pg_catalog.count(distinct listed.signature)
  into target_count, distinct_target_count
  from pg_catalog.unnest(target_signatures) as listed(signature);

  if target_count <> 81 then
    raise exception 'Expected 81 function signatures, found %', target_count;
  end if;

  if distinct_target_count <> target_count then
    raise exception 'Function signature list contains % duplicate entries',
      target_count - distinct_target_count;
  end if;

  foreach target_signature in array target_signatures
  loop
    target_oid := pg_catalog.to_regprocedure(target_signature)::oid;

    if target_oid is null then
      raise notice 'Skipping absent legacy function: %', target_signature;
      continue;
    end if;

    select
      namespace.nspname,
      proc.proname,
      pg_catalog.pg_get_function_identity_arguments(proc.oid)
    into
      target_schema,
      target_name,
      target_arguments
    from pg_catalog.pg_proc as proc
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where proc.oid = target_oid;

    execute pg_catalog.format(
      'alter function %I.%I(%s) set search_path to pg_catalog, public, extensions, pg_temp',
      target_schema,
      target_name,
      target_arguments
    );
  end loop;
end;
$pin_public_function_search_paths$;

commit;
