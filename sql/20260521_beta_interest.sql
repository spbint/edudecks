create extension if not exists pgcrypto;

create table if not exists public.beta_interest (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  country text null,
  state_or_region text null,
  number_of_children integer null,
  biggest_homeschool_challenge text null,
  currently_homeschooling boolean null,
  willing_to_test_free_beta boolean null,
  source text null,
  status text not null default 'new',
  notes text null
);

create index if not exists beta_interest_created_at_idx
  on public.beta_interest (created_at desc);

create index if not exists beta_interest_status_created_at_idx
  on public.beta_interest (status, created_at desc);

create index if not exists beta_interest_email_idx
  on public.beta_interest (lower(email));

alter table public.beta_interest enable row level security;

revoke all on table public.beta_interest from anon;
revoke all on table public.beta_interest from authenticated;
grant insert on table public.beta_interest to anon;
grant insert on table public.beta_interest to authenticated;

drop policy if exists "beta interest public insert" on public.beta_interest;
create policy "beta interest public insert"
on public.beta_interest
for insert
to anon, authenticated
with check (true);
