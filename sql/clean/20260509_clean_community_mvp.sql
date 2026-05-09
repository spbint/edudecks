-- Clean community MVP phase 1 foundation.
-- Schema and RLS only. Review before applying.
-- Do not execute automatically against production.

create extension if not exists pgcrypto;

create table public.community_threads (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id),
  category text not null,
  title text not null,
  body text not null,
  link_url text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_threads_category_check
    check (
      category in (
        'general',
        'resources',
        'curriculum',
        'reporting',
        'state-country',
        'mylearna-suggestions'
      )
    ),
  constraint community_threads_status_check
    check (status in ('open', 'hidden', 'locked'))
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  author_user_id uuid not null references auth.users(id),
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_status_check
    check (status in ('open', 'hidden'))
);

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id),
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint community_reports_status_check
    check (status in ('open', 'reviewed', 'dismissed', 'actioned'))
);

create index if not exists community_threads_category_created_at_idx
  on public.community_threads (category, created_at desc);

create index if not exists community_threads_status_created_at_idx
  on public.community_threads (status, created_at desc);

create index if not exists community_posts_thread_created_at_idx
  on public.community_posts (thread_id, created_at);

create index if not exists community_reports_status_created_at_idx
  on public.community_reports (status, created_at desc);

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'clean_set_updated_at'
  ) then
    execute 'drop trigger if exists clean_community_threads_updated_at on public.community_threads';
    execute 'create trigger clean_community_threads_updated_at before update on public.community_threads for each row execute function public.clean_set_updated_at()';

    execute 'drop trigger if exists clean_community_posts_updated_at on public.community_posts';
    execute 'create trigger clean_community_posts_updated_at before update on public.community_posts for each row execute function public.clean_set_updated_at()';
  end if;
end
$$;

alter table public.community_threads enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_reports enable row level security;

create policy "clean community threads select open"
on public.community_threads
for select
to authenticated
using (
  status = 'open'
);

create policy "clean community threads insert own"
on public.community_threads
for insert
to authenticated
with check (
  author_user_id = auth.uid()
  and status = 'open'
);

create policy "clean community threads update own open"
on public.community_threads
for update
to authenticated
using (
  author_user_id = auth.uid()
  and status = 'open'
)
with check (
  author_user_id = auth.uid()
  and status = 'open'
);

create policy "clean community threads delete own open"
on public.community_threads
for delete
to authenticated
using (
  author_user_id = auth.uid()
  and status = 'open'
);

create policy "clean community posts select open in open thread"
on public.community_posts
for select
to authenticated
using (
  status = 'open'
  and exists (
    select 1
    from public.community_threads thread
    where thread.id = community_posts.thread_id
      and thread.status = 'open'
  )
);

create policy "clean community posts insert own into open thread"
on public.community_posts
for insert
to authenticated
with check (
  author_user_id = auth.uid()
  and status = 'open'
  and exists (
    select 1
    from public.community_threads thread
    where thread.id = community_posts.thread_id
      and thread.status = 'open'
  )
);

create policy "clean community posts update own open"
on public.community_posts
for update
to authenticated
using (
  author_user_id = auth.uid()
  and status = 'open'
)
with check (
  author_user_id = auth.uid()
  and status = 'open'
  and exists (
    select 1
    from public.community_threads thread
    where thread.id = community_posts.thread_id
      and thread.status = 'open'
  )
);

create policy "clean community posts delete own open"
on public.community_posts
for delete
to authenticated
using (
  author_user_id = auth.uid()
  and status = 'open'
);

create policy "clean community reports select own"
on public.community_reports
for select
to authenticated
using (
  reporter_user_id = auth.uid()
);

create policy "clean community reports insert own"
on public.community_reports
for insert
to authenticated
with check (
  reporter_user_id = auth.uid()
  and status = 'open'
);

-- Verification SQL to run manually after applying this migration.
-- These statements are intentionally commented out.
--
-- 1. Logged-out user cannot read threads.
-- select * from public.community_threads;
--
-- 2. Authenticated user can create own thread.
-- insert into public.community_threads (
--   author_user_id,
--   category,
--   title,
--   body
-- ) values (
--   auth.uid(),
--   'general',
--   'First community thread',
--   'Hello from the community MVP.'
-- )
-- returning *;
--
-- 3. Authenticated user can read open threads.
-- select *
-- from public.community_threads
-- where status = 'open'
-- order by created_at desc;
--
-- 4. Authenticated user cannot update another user's thread.
-- update public.community_threads
-- set title = 'Should be denied'
-- where id = '<another-users-thread-id>';
--
-- 5. Authenticated user can reply to an open thread.
-- insert into public.community_posts (
--   thread_id,
--   author_user_id,
--   body
-- ) values (
--   '<open-thread-id>',
--   auth.uid(),
--   'Replying to this thread.'
-- )
-- returning *;
--
-- 6. Hidden post/thread is not visible to ordinary users.
-- select *
-- from public.community_threads
-- where status <> 'open';
--
-- select *
-- from public.community_posts
-- where status <> 'open';
--
-- 7. Report can be inserted.
-- insert into public.community_reports (
--   reporter_user_id,
--   target_type,
--   target_id,
--   reason
-- ) values (
--   auth.uid(),
--   'thread',
--   '<thread-id>',
--   'Spam'
-- )
-- returning *;
--
-- 8. Reports are not globally visible to ordinary users.
-- select *
-- from public.community_reports
-- order by created_at desc;
