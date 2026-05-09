-- Clean community MVP repair migration.
-- Safe repair for a partial community install where community_threads may
-- already exist and community_posts / community_reports may be missing.
--
-- Safety notes:
-- - no destructive SQL
-- - no data deletion
-- - no table drops
-- - no service role usage
-- - safe to apply after a partial community migration

create extension if not exists pgcrypto;

create table if not exists public.community_threads (
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

create table if not exists public.community_posts (
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

create table if not exists public.community_reports (
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

do $$
begin
  if to_regclass('public.community_threads') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.community_threads'::regclass
        and conname = 'community_threads_category_check'
    ) then
      execute $sql$
        alter table public.community_threads
        add constraint community_threads_category_check
        check (
          category in (
            'general',
            'resources',
            'curriculum',
            'reporting',
            'state-country',
            'mylearna-suggestions'
          )
        ) not valid
      $sql$;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.community_threads'::regclass
        and conname = 'community_threads_status_check'
    ) then
      execute $sql$
        alter table public.community_threads
        add constraint community_threads_status_check
        check (status in ('open', 'hidden', 'locked')) not valid
      $sql$;
    end if;
  end if;

  if to_regclass('public.community_posts') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.community_posts'::regclass
        and conname = 'community_posts_status_check'
    ) then
      execute $sql$
        alter table public.community_posts
        add constraint community_posts_status_check
        check (status in ('open', 'hidden')) not valid
      $sql$;
    end if;
  end if;

  if to_regclass('public.community_reports') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.community_reports'::regclass
        and conname = 'community_reports_status_check'
    ) then
      execute $sql$
        alter table public.community_reports
        add constraint community_reports_status_check
        check (status in ('open', 'reviewed', 'dismissed', 'actioned')) not valid
      $sql$;
    end if;
  end if;
end
$$;

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
    if to_regclass('public.community_threads') is not null then
      execute 'drop trigger if exists clean_community_threads_updated_at on public.community_threads';
      execute 'create trigger clean_community_threads_updated_at before update on public.community_threads for each row execute function public.clean_set_updated_at()';
    end if;

    if to_regclass('public.community_posts') is not null then
      execute 'drop trigger if exists clean_community_posts_updated_at on public.community_posts';
      execute 'create trigger clean_community_posts_updated_at before update on public.community_posts for each row execute function public.clean_set_updated_at()';
    end if;
  end if;
end
$$;

alter table public.community_threads enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_reports enable row level security;

drop policy if exists "clean community threads select open" on public.community_threads;
create policy "clean community threads select open"
on public.community_threads
for select
to authenticated
using (
  status = 'open'
);

drop policy if exists "clean community threads insert own" on public.community_threads;
create policy "clean community threads insert own"
on public.community_threads
for insert
to authenticated
with check (
  author_user_id = auth.uid()
  and status = 'open'
);

drop policy if exists "clean community threads update own open" on public.community_threads;
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

drop policy if exists "clean community threads delete own open" on public.community_threads;
create policy "clean community threads delete own open"
on public.community_threads
for delete
to authenticated
using (
  author_user_id = auth.uid()
  and status = 'open'
);

drop policy if exists "clean community posts select open in open thread" on public.community_posts;
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

drop policy if exists "clean community posts insert own into open thread" on public.community_posts;
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

drop policy if exists "clean community posts update own open" on public.community_posts;
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

drop policy if exists "clean community posts delete own open" on public.community_posts;
create policy "clean community posts delete own open"
on public.community_posts
for delete
to authenticated
using (
  author_user_id = auth.uid()
  and status = 'open'
);

drop policy if exists "clean community reports select own" on public.community_reports;
create policy "clean community reports select own"
on public.community_reports
for select
to authenticated
using (
  reporter_user_id = auth.uid()
);

drop policy if exists "clean community reports insert own" on public.community_reports;
create policy "clean community reports insert own"
on public.community_reports
for insert
to authenticated
with check (
  reporter_user_id = auth.uid()
  and status = 'open'
);

-- Verification SQL to run manually after applying this repair migration.
-- These statements are intentionally commented out.
--
-- 1. Check all three tables exist.
-- select schemaname, tablename
-- from pg_tables
-- where schemaname = 'public'
--   and tablename in ('community_threads', 'community_posts', 'community_reports')
-- order by tablename;
--
-- 2. Check RLS is enabled on all three tables.
-- select c.relname as table_name, c.relrowsecurity as rls_enabled
-- from pg_class c
-- join pg_namespace n
--   on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relname in ('community_threads', 'community_posts', 'community_reports')
-- order by c.relname;
--
-- 3. Authenticated user can create own thread.
-- insert into public.community_threads (
--   author_user_id,
--   category,
--   title,
--   body
-- ) values (
--   auth.uid(),
--   'general',
--   'Community repair test thread',
--   'Testing the repaired community migration.'
-- )
-- returning *;
--
-- 4. Authenticated user can create a reply.
-- insert into public.community_posts (
--   thread_id,
--   author_user_id,
--   body
-- ) values (
--   '<open-thread-id>',
--   auth.uid(),
--   'Testing replies after the repair migration.'
-- )
-- returning *;
--
-- 5. Authenticated user can report content.
-- insert into public.community_reports (
--   reporter_user_id,
--   target_type,
--   target_id,
--   reason
-- ) values (
--   auth.uid(),
--   'thread',
--   '<thread-id>',
--   'Testing the community report flow.'
-- )
-- returning *;
--
-- 6. Ordinary user cannot see hidden or locked community content.
-- select *
-- from public.community_threads
-- where status in ('hidden', 'locked');
--
-- select *
-- from public.community_posts
-- where status = 'hidden';
--
-- 7. Ordinary user cannot see all community reports.
-- select *
-- from public.community_reports
-- order by created_at desc;
