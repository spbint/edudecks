-- MyLearna Maths Starting Point v1 — persistence activation.
--
-- DESIGN / REVIEW ACTIVATION ONLY.
-- DO NOT APPLY with the foundation migration.
--
-- Preconditions:
--   1. assessment_baseline_attempts and assessment_baseline_responses exist;
--   2. RLS/policies and validation triggers have been verified;
--   3. the atomic save RPC exists;
--   4. one authenticated isolation smoke-test plan is approved;
--   5. the application persistence release gate is still false during DB activation;
--   6. explicit approval has been given to enable server-only RPC execution.
--
-- This script enables only the server-side baseline save RPC. It does not expose the
-- customer route, enable Pathways navigation, create Portfolio/report evidence,
-- or mutate Pathways/assessment confidence.

do $$
begin
  if to_regclass('public.assessment_baseline_attempts') is null then
    raise exception 'assessment_baseline_attempts is not installed.';
  end if;

  if to_regclass('public.assessment_baseline_responses') is null then
    raise exception 'assessment_baseline_responses is not installed.';
  end if;

  if to_regprocedure(
    'public.mylearna_save_number_operations_baseline(uuid,uuid,uuid,text,jsonb,jsonb)'
  ) is null then
    raise exception 'Baseline save RPC is not installed.';
  end if;
end;
$$;

grant select on public.assessment_baseline_attempts to authenticated;
grant select on public.assessment_baseline_responses to authenticated;

revoke all on function public.mylearna_save_number_operations_baseline(
  uuid,
  uuid,
  uuid,
  text,
  jsonb,
  jsonb
) from authenticated;

grant execute on function public.mylearna_save_number_operations_baseline(
  uuid,
  uuid,
  uuid,
  text,
  jsonb,
  jsonb
) to service_role;

-- Emergency containment / rollback:
--
-- revoke all on function public.mylearna_save_number_operations_baseline(
--   uuid, uuid, uuid, text, jsonb, jsonb
-- ) from service_role;
-- revoke all on public.assessment_baseline_attempts from authenticated;
-- revoke all on public.assessment_baseline_responses from authenticated;
