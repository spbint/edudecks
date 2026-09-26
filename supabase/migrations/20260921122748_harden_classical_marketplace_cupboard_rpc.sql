-- Keep the MyLearna catalogue save RPC on invoker privileges.
-- Family membership and RLS remain authoritative; anonymous callers stay denied.

alter function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  security invoker;

revoke all on function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  from public, anon;

grant execute on function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  to authenticated, service_role;
