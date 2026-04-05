create table if not exists public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  body text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  user_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_threads_category_updated_idx
  on public.forum_threads (category_id, is_pinned desc, updated_at desc);

create index if not exists forum_posts_thread_created_idx
  on public.forum_posts (thread_id, created_at asc);

alter table public.forum_categories enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;

drop policy if exists "forum categories read" on public.forum_categories;
create policy "forum categories read"
on public.forum_categories
for select
to authenticated
using (true);

drop policy if exists "forum threads read" on public.forum_threads;
create policy "forum threads read"
on public.forum_threads
for select
to authenticated
using (true);

drop policy if exists "forum threads insert own" on public.forum_threads;
create policy "forum threads insert own"
on public.forum_threads
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "forum posts read" on public.forum_posts;
create policy "forum posts read"
on public.forum_posts
for select
to authenticated
using (true);

drop policy if exists "forum posts insert own" on public.forum_posts;
create policy "forum posts insert own"
on public.forum_posts
for insert
to authenticated
with check (auth.uid() = user_id);

insert into public.forum_categories (slug, name, description)
values
  ('getting-started', 'Getting Started', 'Ask your first questions and get help finding your footing.'),
  ('planning-ideas', 'Planning Ideas', 'Share practical ways to shape weeks, rhythms, and learning blocks.'),
  ('learning-moments', 'Learning Moments', 'Talk about real learning moments and what they revealed.'),
  ('report-help', 'Report Help', 'Get gentle help turning records into reports you can trust.'),
  ('homeschool-encouragement', 'Homeschool Encouragement', 'Encourage one another through ordinary homeschool days.'),
  ('subject-chats', 'Subject Chats', 'Swap ideas for literacy, numeracy, science, arts, and more.'),
  ('christian-homeschooling', 'Christian Homeschooling', 'Discuss faith-shaped homeschool rhythms, resources, and questions.'),
  ('special-needs-support', 'Special Needs & Support', 'Share thoughtful support ideas for different learner needs.'),
  ('general-discussion', 'General Discussion', 'Everything else that fits the calm member conversation.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;
