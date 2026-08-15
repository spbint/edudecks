-- Apple Calendar subscription V1. MyLearna remains authoritative; this table
-- stores only feed-management metadata and a one-way hash of the bearer token.

create table public.calendar_feed_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  created_by_user_id uuid not null,
  token_hash text not null,
  token_prefix text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rotated_at timestamptz,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  constraint calendar_feed_subscriptions_token_hash_unique unique (token_hash),
  constraint calendar_feed_subscriptions_family_unique unique (family_id),
  constraint calendar_feed_subscriptions_status_check
    check (status in ('active', 'revoked'))
);

alter table public.calendar_feed_subscriptions enable row level security;

revoke all on table public.calendar_feed_subscriptions from anon;
revoke all on table public.calendar_feed_subscriptions from authenticated;
grant select (
  id,
  family_id,
  created_by_user_id,
  token_prefix,
  status,
  created_at,
  updated_at,
  rotated_at,
  revoked_at,
  last_accessed_at
) on public.calendar_feed_subscriptions to authenticated;
grant insert (
  family_id,
  created_by_user_id,
  token_hash,
  token_prefix,
  status,
  created_at,
  updated_at,
  rotated_at,
  revoked_at,
  last_accessed_at
) on public.calendar_feed_subscriptions to authenticated;
grant update (
  created_by_user_id,
  token_hash,
  token_prefix,
  status,
  updated_at,
  rotated_at,
  revoked_at,
  last_accessed_at
) on public.calendar_feed_subscriptions to authenticated;

create policy "calendar feed subscriptions select managers"
on public.calendar_feed_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.family_members membership
    where membership.family_id = calendar_feed_subscriptions.family_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('owner', 'parent')
  )
);

create policy "calendar feed subscriptions insert managers"
on public.calendar_feed_subscriptions
for insert
to authenticated
with check (
  created_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.family_members membership
    where membership.family_id = calendar_feed_subscriptions.family_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('owner', 'parent')
  )
);

create policy "calendar feed subscriptions update managers"
on public.calendar_feed_subscriptions
for update
to authenticated
using (
  exists (
    select 1
    from public.family_members membership
    where membership.family_id = calendar_feed_subscriptions.family_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('owner', 'parent')
  )
)
with check (
  exists (
    select 1
    from public.family_members membership
    where membership.family_id = calendar_feed_subscriptions.family_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('owner', 'parent')
  )
);
