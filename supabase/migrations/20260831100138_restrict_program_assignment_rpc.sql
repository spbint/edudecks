-- Priority 5A.2A: the production database has an explicit anon EXECUTE ACL
-- that is not removed by revoking PUBLIC alone. Keep this authenticated-family
-- mutation RPC inaccessible to anon while preserving service-role operations.

revoke all on function public.clean_assign_program_learners(uuid, uuid, uuid[]) from public;
revoke all on function public.clean_assign_program_learners(uuid, uuid, uuid[]) from anon;
grant execute on function public.clean_assign_program_learners(uuid, uuid, uuid[]) to authenticated;
grant execute on function public.clean_assign_program_learners(uuid, uuid, uuid[]) to service_role;
