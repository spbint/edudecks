create extension if not exists pgcrypto;

create or replace function public.community_plain_excerpt(value text, max_length integer default 180)
returns text
language sql
immutable
as $$
  select case
    when value is null then ''
    when length(trim(regexp_replace(value, '\s+', ' ', 'g'))) <= max_length
      then trim(regexp_replace(value, '\s+', ' ', 'g'))
    else left(trim(regexp_replace(value, '\s+', ' ', 'g')), greatest(max_length - 3, 1)) || '...'
  end
$$;

create table if not exists public.community_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.community_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.community_categories(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  body text not null,
  excerpt text not null default '',
  is_pinned boolean not null default false,
  status text null check (status in ('under_review', 'planned', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  user_id uuid not null,
  body text not null,
  excerpt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_thread_activity (
  thread_id uuid primary key references public.community_threads(id) on delete cascade,
  category_id uuid not null references public.community_categories(id) on delete cascade,
  reply_count integer not null default 0,
  last_activity_at timestamptz not null default now(),
  latest_reply_excerpt text null,
  updated_at timestamptz not null default now()
);

create table if not exists public.community_thread_support (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (thread_id, user_id)
);

create index if not exists community_categories_display_order_idx
  on public.community_categories (display_order asc, created_at asc);

create index if not exists community_categories_slug_idx
  on public.community_categories (slug);

create index if not exists community_threads_category_updated_idx
  on public.community_threads (category_id, is_pinned desc, updated_at desc);

create index if not exists community_replies_thread_created_idx
  on public.community_replies (thread_id, created_at asc);

create index if not exists community_thread_activity_category_last_activity_idx
  on public.community_thread_activity (category_id, last_activity_at desc);

create index if not exists community_thread_support_thread_idx
  on public.community_thread_support (thread_id, created_at desc);

create or replace function public.community_prepare_thread_write()
returns trigger
language plpgsql
as $$
begin
  new.excerpt := public.community_plain_excerpt(new.body);
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.community_prepare_reply_write()
returns trigger
language plpgsql
as $$
begin
  new.excerpt := public.community_plain_excerpt(new.body);
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.community_refresh_thread_activity(target_thread_id uuid)
returns void
language plpgsql
as $$
declare
  target_thread record;
  latest_reply record;
  reply_total integer;
begin
  select id, category_id, created_at, updated_at
  into target_thread
  from public.community_threads
  where id = target_thread_id;

  if not found then
    delete from public.community_thread_activity
    where thread_id = target_thread_id;
    return;
  end if;

  select count(*)::integer
  into reply_total
  from public.community_replies
  where thread_id = target_thread_id;

  select excerpt, updated_at
  into latest_reply
  from public.community_replies
  where thread_id = target_thread_id
  order by updated_at desc, created_at desc
  limit 1;

  insert into public.community_thread_activity (
    thread_id,
    category_id,
    reply_count,
    last_activity_at,
    latest_reply_excerpt,
    updated_at
  )
  values (
    target_thread_id,
    target_thread.category_id,
    coalesce(reply_total, 0),
    coalesce(latest_reply.updated_at, target_thread.updated_at, target_thread.created_at, now()),
    latest_reply.excerpt,
    now()
  )
  on conflict (thread_id) do update
  set
    category_id = excluded.category_id,
    reply_count = excluded.reply_count,
    last_activity_at = excluded.last_activity_at,
    latest_reply_excerpt = excluded.latest_reply_excerpt,
    updated_at = now();

end;
$$;

create or replace function public.community_after_thread_write()
returns trigger
language plpgsql
as $$
begin
  perform public.community_refresh_thread_activity(new.id);
  return new;
end;
$$;

create or replace function public.community_after_reply_write()
returns trigger
language plpgsql
as $$
declare
  affected_thread_id uuid;
begin
  affected_thread_id := coalesce(new.thread_id, old.thread_id);
  update public.community_threads
  set updated_at = now()
  where id = affected_thread_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists community_threads_prepare_write on public.community_threads;
create trigger community_threads_prepare_write
before insert or update on public.community_threads
for each row execute function public.community_prepare_thread_write();

drop trigger if exists community_replies_prepare_write on public.community_replies;
create trigger community_replies_prepare_write
before insert or update on public.community_replies
for each row execute function public.community_prepare_reply_write();

drop trigger if exists community_threads_refresh_activity on public.community_threads;
create trigger community_threads_refresh_activity
after insert or update on public.community_threads
for each row execute function public.community_after_thread_write();

drop trigger if exists community_replies_refresh_activity on public.community_replies;
create trigger community_replies_refresh_activity
after insert or update or delete on public.community_replies
for each row execute function public.community_after_reply_write();

alter table public.community_categories enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_thread_activity enable row level security;
alter table public.community_thread_support enable row level security;

drop policy if exists "community categories read" on public.community_categories;
create policy "community categories read"
on public.community_categories
for select
to authenticated
using (true);

drop policy if exists "community threads read" on public.community_threads;
create policy "community threads read"
on public.community_threads
for select
to authenticated
using (true);

drop policy if exists "community threads insert own" on public.community_threads;
create policy "community threads insert own"
on public.community_threads
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "community replies read" on public.community_replies;
create policy "community replies read"
on public.community_replies
for select
to authenticated
using (true);

drop policy if exists "community replies insert own" on public.community_replies;
create policy "community replies insert own"
on public.community_replies
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "community thread activity read" on public.community_thread_activity;
create policy "community thread activity read"
on public.community_thread_activity
for select
to authenticated
using (true);

drop policy if exists "community thread support read" on public.community_thread_support;
create policy "community thread support read"
on public.community_thread_support
for select
to authenticated
using (true);

drop policy if exists "community thread support insert own" on public.community_thread_support;
create policy "community thread support insert own"
on public.community_thread_support
for insert
to authenticated
with check (auth.uid() = user_id);

insert into public.community_categories (slug, name, description, display_order)
values
  ('getting-started', 'Getting Started', 'Ask your first questions and get help finding your footing.', 0),
  ('planning-ideas', 'Planning Ideas', 'Share practical ways to shape weeks, rhythms, and learning blocks.', 1),
  ('learning-moments', 'Learning Moments', 'Talk about real learning moments and what they revealed.', 2),
  ('homeschool-resources', 'Homeschool Resources', 'Share and discover useful homeschool resources, tools, printables, and curriculum ideas.', 3),
  ('classical-education', 'Classical Education', 'Discuss classical education approaches, great books, memory work, and structured learning rhythms.', 4),
  ('report-help', 'Report Help', 'Get gentle help turning records into reports you can trust.', 5),
  ('homeschool-encouragement', 'Homeschool Encouragement', 'Encourage one another through ordinary homeschool days.', 6),
  ('subject-chats', 'Subject Chats', 'Swap ideas for literacy, numeracy, science, arts, and more.', 7),
  ('christian-homeschooling', 'Christian Homeschooling', 'Discuss faith-shaped homeschool rhythms, resources, and questions.', 8),
  ('special-needs-support', 'Special Needs & Support', 'Share thoughtful support ideas for different learner needs.', 9),
  ('general-discussion', 'General Discussion', 'Everything else that fits the calm member conversation.', 10),
  ('help-shape-edudecks', 'Help Shape MyLearna', 'Share ideas, suggest improvements, and help shape the future of MyLearna.', 11)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'forum_categories'
  ) then
    insert into public.community_categories (id, slug, name, description, display_order, created_at)
    select
      fc.id,
      fc.slug,
      case when fc.slug = 'help-shape-edudecks' then 'Help Shape MyLearna' else fc.name end,
      case
        when fc.slug = 'help-shape-edudecks'
          then 'Share ideas, suggest improvements, and help shape the future of MyLearna.'
        else fc.description
      end,
      coalesce(seed.display_order, 100),
      fc.created_at
    from public.forum_categories fc
    left join public.community_categories seed on seed.slug = fc.slug
    on conflict (id) do update
    set
      slug = excluded.slug,
      name = excluded.name,
      description = excluded.description,
      display_order = excluded.display_order;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'forum_threads'
  ) then
    insert into public.community_threads (
      id,
      category_id,
      user_id,
      title,
      body,
      excerpt,
      is_pinned,
      status,
      created_at,
      updated_at
    )
    select
      ft.id,
      ft.category_id,
      ft.user_id,
      ft.title,
      ft.body,
      public.community_plain_excerpt(ft.body),
      ft.is_pinned,
      ft.status,
      ft.created_at,
      ft.updated_at
    from public.forum_threads ft
    where exists (
      select 1 from public.community_categories cc where cc.id = ft.category_id
    )
    on conflict (id) do update
    set
      category_id = excluded.category_id,
      title = excluded.title,
      body = excluded.body,
      excerpt = excluded.excerpt,
      is_pinned = excluded.is_pinned,
      status = excluded.status,
      updated_at = excluded.updated_at;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'forum_posts'
  ) then
    insert into public.community_replies (
      id,
      thread_id,
      user_id,
      body,
      excerpt,
      created_at,
      updated_at
    )
    select
      fp.id,
      fp.thread_id,
      fp.user_id,
      fp.body,
      public.community_plain_excerpt(fp.body),
      fp.created_at,
      fp.updated_at
    from public.forum_posts fp
    where exists (
      select 1 from public.community_threads ct where ct.id = fp.thread_id
    )
    on conflict (id) do update
    set
      body = excluded.body,
      excerpt = excluded.excerpt,
      updated_at = excluded.updated_at;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'forum_thread_support'
  ) then
    insert into public.community_thread_support (id, thread_id, user_id, created_at)
    select
      fts.id,
      fts.thread_id,
      fts.user_id,
      fts.created_at
    from public.forum_thread_support fts
    where exists (
      select 1 from public.community_threads ct where ct.id = fts.thread_id
    )
    on conflict (thread_id, user_id) do nothing;
  end if;
end $$;

insert into public.community_thread_activity (
  thread_id,
  category_id,
  reply_count,
  last_activity_at,
  latest_reply_excerpt,
  updated_at
)
select
  ct.id,
  ct.category_id,
  coalesce(reply_counts.reply_count, 0),
  coalesce(reply_counts.last_reply_at, ct.updated_at, ct.created_at, now()),
  reply_counts.latest_reply_excerpt,
  now()
from public.community_threads ct
left join (
  select
    r.thread_id,
    count(*)::integer as reply_count,
    max(r.updated_at) as last_reply_at,
    (
      array_agg(r.excerpt order by r.updated_at desc, r.created_at desc)
    )[1] as latest_reply_excerpt
  from public.community_replies r
  group by r.thread_id
) reply_counts on reply_counts.thread_id = ct.id
on conflict (thread_id) do update
set
  category_id = excluded.category_id,
  reply_count = excluded.reply_count,
  last_activity_at = excluded.last_activity_at,
  latest_reply_excerpt = excluded.latest_reply_excerpt,
  updated_at = now();
