-- Clean family-only MyLearna schema draft.
-- Draft only. Do not execute this file as-is against production.
-- No migrations are run by creating this file.
-- This schema intentionally avoids school, classroom, teacher, authority,
-- intervention, cohort, ranking, and legacy local-only learner concepts.

create extension if not exists pgcrypto;

create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null,
  display_name text not null,
  country_code text,
  jurisdiction_code text,
  curriculum_framework_id text,
  reporting_mode text not null default 'family-summary',
  week_start text not null default 'monday',
  privacy_default text not null default 'family',
  export_style text not null default 'calm',
  default_learner_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_members_role_check check (role in ('owner', 'parent', 'caregiver')),
  constraint family_members_family_user_unique unique (family_id, user_id)
);

create table if not exists public.learners (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  first_name text not null,
  preferred_name text,
  surname text,
  year_level text,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_profiles
  add constraint family_profiles_default_learner_fk
  foreign key (default_learner_id)
  references public.learners(id)
  on delete set null;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid null references public.learners(id) on delete set null,
  title text not null,
  description text,
  learning_area text,
  curriculum_node_ids jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_status_check check (status in ('draft', 'active', 'archived'))
);

create table if not exists public.program_segments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  learner_id uuid null references public.learners(id) on delete set null,
  title text not null,
  description text,
  segment_order integer not null default 0,
  starts_on date,
  ends_on date,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid null references public.learners(id) on delete set null,
  program_id uuid null references public.programs(id) on delete set null,
  program_segment_id uuid null references public.program_segments(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  planned_date date not null,
  session_type text,
  is_highlighted boolean not null default false,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  program_id uuid null references public.programs(id) on delete set null,
  calendar_item_id uuid null references public.calendar_items(id) on delete set null,
  observed_on date not null,
  title text,
  what_happened text not null,
  reflection text,
  learning_area text,
  curriculum_node_ids jsonb not null default '[]'::jsonb,
  include_in_portfolio boolean not null default true,
  include_in_report boolean not null default true,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_highlights (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  evidence_entry_id uuid null references public.evidence_entries(id) on delete cascade,
  calendar_item_id uuid null references public.calendar_items(id) on delete cascade,
  note text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reporting_periods (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  title text not null,
  status text not null default 'draft',
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_status_check check (status in ('draft', 'ready', 'archived'))
);

create table if not exists public.report_sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  section_key text not null,
  heading text not null,
  content text not null default '',
  sort_order integer not null default 0,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  export_format text not null default 'pdf',
  exported_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint report_exports_format_check check (export_format in ('pdf', 'html', 'docx'))
);

create index if not exists family_members_user_idx
  on public.family_members (user_id, family_id);

create index if not exists learners_family_idx
  on public.learners (family_id, created_at desc);

create index if not exists programs_family_learner_idx
  on public.programs (family_id, learner_id, updated_at desc);

create index if not exists calendar_items_family_learner_date_idx
  on public.calendar_items (family_id, learner_id, planned_date);

create index if not exists evidence_entries_family_learner_date_idx
  on public.evidence_entries (family_id, learner_id, observed_on desc);

create index if not exists reporting_periods_family_learner_idx
  on public.reporting_periods (family_id, learner_id, starts_on desc);

create or replace function public.current_family_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select fm.family_id
  from public.family_members fm
  where fm.user_id = auth.uid()
$$;

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = auth.uid()
  )
$$;

grant execute on function public.current_family_ids() to authenticated;
grant execute on function public.is_family_member(uuid) to authenticated;

alter table public.family_profiles enable row level security;
alter table public.family_members enable row level security;
alter table public.learners enable row level security;
alter table public.programs enable row level security;
alter table public.program_segments enable row level security;
alter table public.calendar_items enable row level security;
alter table public.evidence_entries enable row level security;
alter table public.portfolio_highlights enable row level security;
alter table public.reporting_periods enable row level security;
alter table public.reports enable row level security;
alter table public.report_sections enable row level security;
alter table public.report_exports enable row level security;

drop policy if exists "clean family profiles select own" on public.family_profiles;
create policy "clean family profiles select own"
on public.family_profiles
for select
to authenticated
using (public.is_family_member(id));

drop policy if exists "clean family profiles insert own" on public.family_profiles;
create policy "clean family profiles insert own"
on public.family_profiles
for insert
to authenticated
with check (created_by_user_id = auth.uid());

drop policy if exists "clean family profiles update own" on public.family_profiles;
create policy "clean family profiles update own"
on public.family_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = public.family_profiles.id
      and fm.user_id = auth.uid()
      and fm.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = public.family_profiles.id
      and fm.user_id = auth.uid()
      and fm.role = 'owner'
  )
);

drop policy if exists "clean family profiles delete own" on public.family_profiles;
create policy "clean family profiles delete own"
on public.family_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = public.family_profiles.id
      and fm.user_id = auth.uid()
      and fm.role = 'owner'
  )
);

drop policy if exists "clean family members select own family" on public.family_members;
create policy "clean family members select own family"
on public.family_members
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean family members insert own family" on public.family_members;
create policy "clean family members insert own family"
on public.family_members
for insert
to authenticated
with check (
  (
    exists (
      select 1
      from public.family_profiles fp
      where fp.id = family_id
        and fp.created_by_user_id = auth.uid()
    )
    and user_id = auth.uid()
    and role = 'owner'
  )
  or exists (
    select 1
    from public.family_members fm
    where fm.family_id = family_id
      and fm.user_id = auth.uid()
      and fm.role = 'owner'
  )
);

drop policy if exists "clean family members update own family" on public.family_members;
create policy "clean family members update own family"
on public.family_members
for update
to authenticated
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = public.family_members.family_id
      and fm.user_id = auth.uid()
      and fm.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = public.family_members.family_id
      and fm.user_id = auth.uid()
      and fm.role = 'owner'
  )
);

drop policy if exists "clean family members delete own family" on public.family_members;
create policy "clean family members delete own family"
on public.family_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = public.family_members.family_id
      and fm.user_id = auth.uid()
      and fm.role = 'owner'
  )
);

drop policy if exists "clean learners select own family" on public.learners;
create policy "clean learners select own family"
on public.learners
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean learners insert own family" on public.learners;
create policy "clean learners insert own family"
on public.learners
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean learners update own family" on public.learners;
create policy "clean learners update own family"
on public.learners
for update
to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean learners delete own family" on public.learners;
create policy "clean learners delete own family"
on public.learners
for delete
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean programs own family" on public.programs;
create policy "clean programs own family"
on public.programs
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean program segments own family" on public.program_segments;
create policy "clean program segments own family"
on public.program_segments
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean calendar items own family" on public.calendar_items;
create policy "clean calendar items own family"
on public.calendar_items
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean evidence entries own family" on public.evidence_entries;
create policy "clean evidence entries own family"
on public.evidence_entries
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean portfolio highlights own family" on public.portfolio_highlights;
create policy "clean portfolio highlights own family"
on public.portfolio_highlights
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean reporting periods own family" on public.reporting_periods;
create policy "clean reporting periods own family"
on public.reporting_periods
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean reports own family" on public.reports;
create policy "clean reports own family"
on public.reports
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean report sections own family" on public.report_sections;
create policy "clean report sections own family"
on public.report_sections
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean report exports own family" on public.report_exports;
create policy "clean report exports own family"
on public.report_exports
for all
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and exported_by_user_id = auth.uid()
);
