-- Clean community in-app notifications MVP.
-- Review before applying.
-- Do not execute automatically against production.
--
-- Safety notes:
-- - authenticated users only
-- - no email or push delivery
-- - no realtime or websocket requirements
-- - no destructive SQL
-- - no data deletion
-- - no service role usage

create extension if not exists pgcrypto;

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null,
  target_type text not null,
  target_id uuid not null,
  actor_user_id uuid not null references auth.users(id),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint community_notifications_type_check
    check (type in ('thread_reply', 'reaction')),
  constraint community_notifications_target_type_check
    check (target_type in ('thread', 'post')),
  constraint community_notifications_not_self_check
    check (user_id <> actor_user_id),
  constraint community_notifications_unique_actor_target
    unique (user_id, type, target_type, target_id, actor_user_id)
);

create index if not exists community_notifications_user_read_created_at_idx
  on public.community_notifications (user_id, read_at, created_at desc);

create index if not exists community_notifications_target_type_target_id_idx
  on public.community_notifications (target_type, target_id);

alter table public.community_notifications enable row level security;

drop policy if exists "clean community notifications select own" on public.community_notifications;
create policy "clean community notifications select own"
on public.community_notifications
for select
to authenticated
using (
  user_id = auth.uid()
);

drop policy if exists "clean community notifications insert actor for valid target" on public.community_notifications;
create policy "clean community notifications insert actor for valid target"
on public.community_notifications
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and user_id <> auth.uid()
  and (
    (
      type = 'thread_reply'
      and target_type = 'thread'
      and exists (
        select 1
        from public.community_threads thread
        where thread.id = community_notifications.target_id
          and thread.status = 'open'
          and thread.author_user_id = community_notifications.user_id
      )
    )
    or (
      type = 'reaction'
      and target_type = 'thread'
      and exists (
        select 1
        from public.community_threads thread
        where thread.id = community_notifications.target_id
          and thread.status = 'open'
          and thread.author_user_id = community_notifications.user_id
      )
    )
    or (
      type = 'reaction'
      and target_type = 'post'
      and exists (
        select 1
        from public.community_posts post
        join public.community_threads thread
          on thread.id = post.thread_id
        where post.id = community_notifications.target_id
          and post.status = 'open'
          and thread.status = 'open'
          and post.author_user_id = community_notifications.user_id
      )
    )
  )
);

drop policy if exists "clean community notifications update own read state" on public.community_notifications;
create policy "clean community notifications update own read state"
on public.community_notifications
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- Verification SQL to run manually after applying this migration.
-- These statements are intentionally commented out.
--
-- 1. Authenticated user can read only their own notifications.
-- select *
-- from public.community_notifications
-- order by created_at desc;
--
-- 2. A reply to an open thread can create a notification for the thread owner.
-- insert into public.community_notifications (
--   user_id,
--   type,
--   target_type,
--   target_id,
--   actor_user_id
-- ) values (
--   '<thread-owner-user-id>',
--   'thread_reply',
--   'thread',
--   '<thread-id>',
--   auth.uid()
-- )
-- returning *;
--
-- 3. A reaction to an open reply can create a notification for the reply owner.
-- insert into public.community_notifications (
--   user_id,
--   type,
--   target_type,
--   target_id,
--   actor_user_id
-- ) values (
--   '<reply-owner-user-id>',
--   'reaction',
--   'post',
--   '<post-id>',
--   auth.uid()
-- )
-- returning *;
--
-- 4. A user can mark their own notifications as read.
-- update public.community_notifications
-- set read_at = now()
-- where user_id = auth.uid()
--   and read_at is null;
