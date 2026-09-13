-- Align the persisted Free fallback with the server entitlement resolver.
alter table public.family_resource_storage_usage
  alter column allowance_bytes set default 262144000;

-- Preserve existing files and reservations, including any family already over
-- the Free allowance, while bringing all other rows down to 250 MiB.
update public.family_resource_storage_usage
set allowance_bytes = greatest(262144000, used_bytes + reserved_bytes),
    updated_at = now();
