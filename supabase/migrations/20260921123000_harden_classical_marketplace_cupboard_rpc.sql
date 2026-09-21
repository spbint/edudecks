-- The Marketplace -> Resource Cupboard save RPC does not require elevated
-- database privileges. Run it as the authenticated caller so normal grants,
-- RLS policies, and the existing family-resource validation trigger remain the
-- access boundary.

alter function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  security invoker;

revoke all on function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  from public, anon;
grant execute on function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  to authenticated;
