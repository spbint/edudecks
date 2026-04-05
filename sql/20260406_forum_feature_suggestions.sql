alter table public.forum_threads
add column if not exists status text
check (status in ('under_review', 'planned', 'released'));

create table if not exists public.forum_thread_support (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (thread_id, user_id)
);

create index if not exists forum_thread_support_thread_idx
  on public.forum_thread_support (thread_id, created_at desc);

alter table public.forum_thread_support enable row level security;

drop policy if exists "forum thread support read" on public.forum_thread_support;
create policy "forum thread support read"
on public.forum_thread_support
for select
to authenticated
using (true);

drop policy if exists "forum thread support insert own" on public.forum_thread_support;
create policy "forum thread support insert own"
on public.forum_thread_support
for insert
to authenticated
with check (auth.uid() = user_id);

insert into public.forum_categories (slug, name, description)
values (
  'help-shape-edudecks',
  'Help Shape EduDecks',
  'Share ideas, suggest improvements, and help shape the future of EduDecks.'
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;
