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
  name text not null default '',
  description text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.community_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.community_categories(id) on delete cascade,
  user_id uuid,
  title text not null default '',
  body text not null default '',
  excerpt text not null default '',
  is_pinned boolean not null default false,
  status text null check (status in ('under_review', 'planned', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  user_id uuid,
  body text not null default '',
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

alter table public.community_categories add column if not exists name text;
alter table public.community_categories add column if not exists description text;
alter table public.community_categories add column if not exists display_order integer;
alter table public.community_categories add column if not exists created_at timestamptz default now();

alter table public.community_threads add column if not exists user_id uuid;
alter table public.community_threads add column if not exists excerpt text default '';
alter table public.community_threads add column if not exists is_pinned boolean default false;
alter table public.community_threads add column if not exists status text;
alter table public.community_threads add column if not exists created_at timestamptz default now();
alter table public.community_threads add column if not exists updated_at timestamptz default now();

alter table public.community_replies add column if not exists user_id uuid;
alter table public.community_replies add column if not exists excerpt text default '';
alter table public.community_replies add column if not exists created_at timestamptz default now();
alter table public.community_replies add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_categories'
      and column_name = 'title'
  ) then
    execute $sql$
      update public.community_categories
      set name = coalesce(nullif(name, ''), nullif(title, ''), '')
      where coalesce(name, '') = ''
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_threads'
      and column_name = 'author_user_id'
  ) then
    execute $sql$
      update public.community_threads
      set user_id = coalesce(user_id, author_user_id)
      where user_id is null
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_replies'
      and column_name = 'author_user_id'
  ) then
    execute $sql$
      update public.community_replies
      set user_id = coalesce(user_id, author_user_id)
      where user_id is null
    $sql$;
  end if;
end $$;

update public.community_categories
set
  name = coalesce(nullif(name, ''), 'Community'),
  description = coalesce(nullif(description, ''), 'A calm, structured place for thoughtful homeschool conversation.'),
  display_order = coalesce(display_order, 0),
  created_at = coalesce(created_at, now());

update public.community_threads
set
  excerpt = coalesce(nullif(excerpt, ''), public.community_plain_excerpt(body)),
  is_pinned = coalesce(is_pinned, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now());

update public.community_replies
set
  excerpt = coalesce(nullif(excerpt, ''), public.community_plain_excerpt(body)),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now());

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
  perform public.community_refresh_thread_activity(affected_thread_id);
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

insert into public.community_categories (slug, name, description, display_order)
values
  ('getting-started', 'Getting Started', 'A gentle place to ask first questions and find a calm starting point.', 0),
  ('planning-ideas', 'Planning Ideas', 'Talk about planning rhythms, weekly structure, and practical homeschool flow.', 1),
  ('learning-moments', 'Learning Moments', 'Share real learning moments and what they revealed over time.', 2),
  ('homeschool-resources', 'Homeschool Resources', 'Share useful homeschool resources, tools, printables, and curriculum ideas.', 3),
  ('classical-education', 'Classical Education', 'Discuss classical education, great books, memory work, and structured learning rhythms.', 4),
  ('report-help', 'Report Help', 'Get practical help turning records and evidence into clearer reports.', 5),
  ('homeschool-encouragement', 'Homeschool Encouragement', 'A calm place to encourage one another through ordinary homeschool days.', 6),
  ('subject-chats', 'Subject Chats', 'Swap ideas for literacy, numeracy, science, arts, history, and more.', 7),
  ('christian-homeschooling', 'Christian Homeschooling', 'Discuss faith-shaped homeschool rhythms, resources, and questions.', 8),
  ('special-needs-support', 'Special Needs & Support', 'Share thoughtful support ideas for different learner needs and family situations.', 9),
  ('general-discussion', 'General Discussion', 'Everything else that fits a calm, practical homeschool conversation.', 10),
  ('help-shape-edudecks', 'Help Shape MyLearna', 'Share ideas, pain points, and practical suggestions that would make MyLearna more helpful.', 11)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order;

alter table public.community_categories enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_thread_activity enable row level security;
alter table public.community_thread_support enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'community_categories',
        'community_threads',
        'community_replies',
        'community_thread_activity',
        'community_thread_support'
      )
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      policy_record.policyname,
      policy_record.tablename
    );
  end loop;
end $$;

create policy "community categories select authenticated"
on public.community_categories
for select
to authenticated
using (true);

create policy "community threads select authenticated"
on public.community_threads
for select
to authenticated
using (true);

create policy "community threads insert authenticated"
on public.community_threads
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id is not null
  and auth.uid() = user_id
);

create policy "community replies select authenticated"
on public.community_replies
for select
to authenticated
using (true);

create policy "community replies insert authenticated"
on public.community_replies
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id is not null
  and auth.uid() = user_id
);

create policy "community thread activity select authenticated"
on public.community_thread_activity
for select
to authenticated
using (true);

create policy "community thread support select authenticated"
on public.community_thread_support
for select
to authenticated
using (true);

create policy "community thread support insert authenticated"
on public.community_thread_support
for insert
to authenticated
with check (
  auth.uid() is not null
  and auth.uid() = user_id
);

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
    (array_agg(r.excerpt order by r.updated_at desc, r.created_at desc))[1] as latest_reply_excerpt
  from public.community_replies r
  group by r.thread_id
) reply_counts on reply_counts.thread_id = ct.id
where exists (
  select 1
  from public.community_categories cc
  where cc.id = ct.category_id
)
on conflict (thread_id) do update
set
  category_id = excluded.category_id,
  reply_count = excluded.reply_count,
  last_activity_at = excluded.last_activity_at,
  latest_reply_excerpt = excluded.latest_reply_excerpt,
  updated_at = now();
