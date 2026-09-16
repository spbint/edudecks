-- Reduce the public RPC surface of SECURITY DEFINER functions.
--
-- Current Homeschool RPCs and RLS/storage helpers retain their existing grants.
-- Legacy Campus/reporting RPCs, trigger functions, and internal helper routines
-- remain available to their owner/service_role but are no longer directly
-- callable through PostgREST by anon or authenticated clients.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Keep the dormant portfolio-share implementation safe for future re-enablement:
-- the legacy one-argument overload must not bypass a configured password, and
-- neither overload is exposed to browser/API roles while the feature is unused.
create or replace function public.get_shared_portfolio(p_token text)
returns table (
  student_id uuid,
  include_goals boolean,
  include_reflection boolean,
  representative_only boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(p_token) < 20 then
    return;
  end if;

  return query
  select
    link.student_id,
    link.include_goals,
    link.include_reflection,
    link.representative_only
  from public.portfolio_share_links as link
  where link.share_token = p_token
    and (link.expires_at is null or link.expires_at > now())
    and link.password_hash is null;
end;
$$;

-- PostgreSQL cannot remove an existing parameter default with CREATE OR
-- REPLACE FUNCTION. Production has no dependent objects on this exact overload,
-- so replace it without CASCADE and reapply the reviewed grant below.
drop function if exists public.get_shared_portfolio(text, text);

create function public.get_shared_portfolio(
  p_token text,
  p_password text
)
returns table (
  student_id uuid,
  include_goals boolean,
  include_reflection boolean,
  representative_only boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(p_token) < 20 then
    return;
  end if;

  return query
  select
    link.student_id,
    link.include_goals,
    link.include_reflection,
    link.representative_only
  from public.portfolio_share_links as link
  where link.share_token = p_token
    and (link.expires_at is null or link.expires_at > now())
    and (
      link.password_hash is null
      or (
        p_password is not null
        and link.password_hash = extensions.crypt(p_password, link.password_hash)
      )
    );
end;
$$;

revoke all on function public.get_shared_portfolio(text) from public;
revoke all on function public.get_shared_portfolio(text) from anon, authenticated;
grant execute on function public.get_shared_portfolio(text) to service_role;

revoke all on function public.get_shared_portfolio(text, text) from public;
revoke all on function public.get_shared_portfolio(text, text) from anon, authenticated;
grant execute on function public.get_shared_portfolio(text, text) to service_role;

-- Legacy school, assessment, intervention, leadership, and attribute RPCs have no
-- executable MyLearna Homeschool caller. Keep service_role access unchanged while
-- removing direct browser/API execution. Missing historical functions are skipped
-- so this forward repair can replay across the known ledger divergence.
do $revoke_legacy_rpcs$
declare
  target_signature text;
  target_oid oid;
begin
  foreach target_signature in array array[
    'public.add_assessment_result(uuid,text,text,text,date,numeric,text,text,text,integer)',
    'public.assert_user_owns_student(uuid)',
    'public.capture_intervention_snapshot(uuid,text)',
    'public.create_class_intervention(uuid,text,integer)',
    'public.ensure_intervention_baseline(uuid)',
    'public.finalize_intervention_review(uuid,date,text,text,jsonb,uuid[])',
    'public.get_assessment_heatmap(text,uuid)',
    'public.get_class_hub(uuid)',
    'public.get_class_leadership_dashboard(uuid)',
    'public.get_class_overview_metrics(uuid)',
    'public.get_school_leadership_dashboard()',
    'public.get_teacher_task_inbox(uuid,integer)',
    'public.recompute_student_attributes(uuid,integer)',
    'public.rpc_assessment_distribution(text,uuid,uuid,integer,text,integer)',
    'public.rpc_support_signals(text,uuid,uuid,integer,text,integer,integer,boolean)',
    'public.rpc_upsert_assessment_results(jsonb)',
    'public.save_evidence_attribute_contributions(uuid,jsonb)',
    'public.upsert_evidence_attribute_contribution(uuid,text,public.evidence_strength,public.evidence_confidence)'
  ] loop
    target_oid := to_regprocedure(target_signature);
    if target_oid is null then
      raise notice 'Skipping absent legacy function %', target_signature;
      continue;
    end if;

    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      target_signature
    );
  end loop;
end;
$revoke_legacy_rpcs$;

-- These routines are invoked only by other trusted routines. Direct authenticated
-- execution either bypasses their caller's authorization checks or unnecessarily
-- exposes implementation details.
do $revoke_internal_helpers$
declare
  target_signature text;
  target_oid oid;
begin
  foreach target_signature in array array[
    'public.current_family_ids()',
    'public.generate_impacts_from_evidence(integer)',
    'public.mylearna_enforce_mutation_rate_limit(text,uuid,integer)',
    'public.mylearna_evidence_entry_owned_by_auth(text,text)',
    'public.mylearna_record_guardrail_event(text,uuid,text)',
    'public.mylearna_release_expired_evidence_storage_reservations(uuid,uuid)',
    'public.mylearna_release_expired_resource_file_upload_reservations(uuid)',
    'public.mylearna_resolve_evidence_academic_year_id(uuid,date)',
    'public.mylearna_runtime_control_enabled(text)',
    'public.recompute_student_attributes_system(uuid,integer)'
  ] loop
    target_oid := to_regprocedure(target_signature);
    if target_oid is null then
      raise notice 'Skipping absent internal function %', target_signature;
      continue;
    end if;

    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      target_signature
    );
  end loop;
end;
$revoke_internal_helpers$;

-- Trigger functions execute through their attached triggers. They do not need to
-- be independently callable as RPC endpoints.
do $revoke_trigger_functions$
declare
  target_signature text;
  target_oid oid;
begin
  foreach target_signature in array array[
    'public.clean_bootstrap_family_owner_membership()',
    'public.clean_set_updated_at()',
    'public.clean_validate_default_learner()',
    'public.community_sync_new_thread_activity()',
    'public.community_sync_reply_activity()',
    'public.mylearna_apply_resource_storage_delete()',
    'public.mylearna_apply_resource_storage_insert()',
    'public.mylearna_apply_storage_delete_to_free_quota()',
    'public.mylearna_apply_storage_insert_to_free_quota()',
    'public.mylearna_apply_storage_update_to_free_quota()',
    'public.mylearna_cleanup_deleted_family_resource()',
    'public.mylearna_cleanup_unreferenced_resource_file()',
    'public.mylearna_enforce_evidence_record_rate_limit()',
    'public.mylearna_enforce_learner_abuse_ceiling()',
    'public.mylearna_enforce_learner_creation_rate_limit()',
    'public.mylearna_enforce_new_family_activation_enabled()',
    'public.mylearna_sync_primary_evidence_learner_link()',
    'public.mylearna_validate_custom_learning_item()',
    'public.mylearna_validate_custom_learning_resource()',
    'public.mylearna_validate_evidence_learner_link()',
    'public.mylearna_validate_family_resource()',
    'public.mylearna_validate_learner_help_request()',
    'public.mylearna_validate_learning_queue_item()',
    'public.set_teacher_notes_user_id()',
    'public.tg_recompute_student_attributes()'
  ] loop
    target_oid := to_regprocedure(target_signature);
    if target_oid is null then
      raise notice 'Skipping absent trigger function %', target_signature;
      continue;
    end if;

    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      target_signature
    );
  end loop;
end;
$revoke_trigger_functions$;

commit;
