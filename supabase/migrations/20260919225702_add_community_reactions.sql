-- Canonical MyLearna Community reactions. A reaction may target either a
-- thread or a post, so target_id deliberately remains a polymorphic UUID.
create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  reaction_type text not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint community_reactions_target_type_check check (target_type in ('thread', 'post')),
  constraint community_reactions_reaction_type_check check (reaction_type in ('like', 'helpful', 'thanks')),
  constraint community_reactions_target_user_reaction_key unique (target_type, target_id, reaction_type, user_id)
);

create index if not exists community_reactions_target_idx
  on public.community_reactions (target_type, target_id);
create index if not exists community_reactions_user_idx
  on public.community_reactions (user_id);

alter table public.community_reactions enable row level security;
revoke all on public.community_reactions from public, anon, authenticated;
grant select, insert, delete on public.community_reactions to authenticated;

drop policy if exists "clean community reactions select open targets" on public.community_reactions;
create policy "clean community reactions select open targets"
on public.community_reactions
for select
to authenticated
using (
  (target_type = 'thread' and exists (
    select 1
    from public.community_threads thread_row
    where thread_row.id = community_reactions.target_id
      and thread_row.status = 'open'
  ))
  or
  (target_type = 'post' and exists (
    select 1
    from public.community_posts post_row
    join public.community_threads thread_row on thread_row.id = post_row.thread_id
    where post_row.id = community_reactions.target_id
      and post_row.status = 'open'
      and thread_row.status = 'open'
  ))
);

drop policy if exists "clean community reactions insert own open target" on public.community_reactions;
create policy "clean community reactions insert own open target"
on public.community_reactions
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    (target_type = 'thread' and exists (
      select 1
      from public.community_threads thread_row
      where thread_row.id = community_reactions.target_id
        and thread_row.status = 'open'
    ))
    or
    (target_type = 'post' and exists (
      select 1
      from public.community_posts post_row
      join public.community_threads thread_row on thread_row.id = post_row.thread_id
      where post_row.id = community_reactions.target_id
        and post_row.status = 'open'
        and thread_row.status = 'open'
    ))
  )
);

drop policy if exists "clean community reactions delete own" on public.community_reactions;
create policy "clean community reactions delete own"
on public.community_reactions
for delete
to authenticated
using (user_id = (select auth.uid()));
