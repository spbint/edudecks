-- Trigger functions support the governed service-role write path only. Direct
-- authenticated writes have already been revoked, and authenticated users do
-- not need to invoke these internal validation functions.

revoke all on function public.mylearna_validate_capture_evidence_construct_link()
  from public, anon, authenticated;
grant execute on function public.mylearna_validate_capture_evidence_construct_link()
  to service_role;

revoke all on function public.mylearna_protect_capture_evidence_construct_identity()
  from public, anon, authenticated;
grant execute on function public.mylearna_protect_capture_evidence_construct_identity()
  to service_role;
