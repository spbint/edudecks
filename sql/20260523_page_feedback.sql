create table if not exists public.page_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid null,
  page_key text not null,
  page_title text null,
  current_url text null,
  feedback_text text not null,
  feedback_type text null default 'general',
  user_agent text null,
  status text not null default 'new',
  admin_notes text null,
  constraint page_feedback_page_key_not_blank
    check (char_length(btrim(page_key)) > 0),
  constraint page_feedback_feedback_text_length
    check (char_length(btrim(feedback_text)) between 1 and 1500)
);

create index if not exists page_feedback_created_at_idx
  on public.page_feedback (created_at desc);

create index if not exists page_feedback_page_key_idx
  on public.page_feedback (page_key);

create index if not exists page_feedback_status_idx
  on public.page_feedback (status);

alter table public.page_feedback enable row level security;

grant insert on public.page_feedback to authenticated;

drop policy if exists "Authenticated users can insert page feedback"
  on public.page_feedback;

create policy "Authenticated users can insert page feedback"
  on public.page_feedback
  for insert
  to authenticated
  with check (
    user_id is null
    or user_id = auth.uid()
  );
