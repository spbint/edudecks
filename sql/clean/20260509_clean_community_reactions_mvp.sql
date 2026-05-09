-- Clean community lightweight reactions MVP.
-- Review before applying.
-- Do not execute automatically against production.
--
-- Safety notes:
-- - authenticated users only
-- - no anonymous reactions
-- - no destructive SQL
-- - no data deletion
-- - no service role usage
-- - no media, storage, or direct messages

create extension if not exists pgcrypto;

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  reaction_type text not null,
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint community_reactions_target_type_check
    check (target_type in ('thread', 'post')),
  constraint community_reactions_reaction_type_check
    check (reaction_type in ('like', 'helpful', 'thanks')),
  constraint community_reactions_unique_user_target_reaction
    unique (target_type, target_id, reaction_type, user_id)
);

create index if not exists community_reactions_target_type_target_id_idx
  on public.community_reactions (target_type, target_id);

create index if not exists community_reactions_user_created_at_idx
  on public.community_reactions (user_id, created_at desc);

alter table public.community_reactions enable row level security;

drop policy if exists "clean community reactions select open content" on public.community_reactions;
create policy "clean community reactions select open content"
on public.community_reactions
for select
to authenticated
using (
  (
    target_type = 'thread'
    and exists (
      select 1
      from public.community_threads thread
      where thread.id = community_reactions.target_id
        and thread.status = 'open'
    )
  )
  or (
    target_type = 'post'
    and exists (
      select 1
      from public.community_posts post
      join public.community_threads thread
        on thread.id = post.thread_id
      where post.id = community_reactions.target_id
        and post.status = 'open'
        and thread.status = 'open'
    )
  )
);

drop policy if exists "clean community reactions insert own for open content" on public.community_reactions;
create policy "clean community reactions insert own for open content"
on public.community_reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    (
      target_type = 'thread'
      and exists (
        select 1
        from public.community_threads thread
        where thread.id = community_reactions.target_id
          and thread.status = 'open'
      )
    )
    or (
      target_type = 'post'
      and exists (
        select 1
        from public.community_posts post
        join public.community_threads thread
          on thread.id = post.thread_id
        where post.id = community_reactions.target_id
          and post.status = 'open'
          and thread.status = 'open'
      )
    )
  )
);

drop policy if exists "clean community reactions delete own for open content" on public.community_reactions;
create policy "clean community reactions delete own for open content"
on public.community_reactions
for delete
to authenticated
using (
  user_id = auth.uid()
  and (
    (
      target_type = 'thread'
      and exists (
        select 1
        from public.community_threads thread
        where thread.id = community_reactions.target_id
          and thread.status = 'open'
      )
    )
    or (
      target_type = 'post'
      and exists (
        select 1
        from public.community_posts post
        join public.community_threads thread
          on thread.id = post.thread_id
        where post.id = community_reactions.target_id
          and post.status = 'open'
          and thread.status = 'open'
      )
    )
  )
);

-- Verification SQL to run manually after applying this migration.
-- These statements are intentionally commented out.
--
-- 1. Authenticated user can add a reaction to an open thread.
-- insert into public.community_reactions (
--   target_type,
--   target_id,
--   reaction_type,
--   user_id
-- ) values (
--   'thread',
--   '<thread-id>',
--   'like',
--   auth.uid()
-- )
-- returning *;
--
-- 2. The same user cannot add the same reaction twice.
-- insert into public.community_reactions (
--   target_type,
--   target_id,
--   reaction_type,
--   user_id
-- ) values (
--   'thread',
--   '<thread-id>',
--   'like',
--   auth.uid()
-- );
--
-- 3. Authenticated user can remove their own reaction.
-- delete from public.community_reactions
-- where target_type = 'thread'
--   and target_id = '<thread-id>'
--   and reaction_type = 'like'
--   and user_id = auth.uid();
--
-- 4. Authenticated user can react to an open reply.
-- insert into public.community_reactions (
--   target_type,
--   target_id,
--   reaction_type,
--   user_id
-- ) values (
--   'post',
--   '<post-id>',
--   'helpful',
--   auth.uid()
-- )
-- returning *;
--
-- 5. Ordinary users can only read reactions on open content.
-- select *
-- from public.community_reactions
-- order by created_at desc;
