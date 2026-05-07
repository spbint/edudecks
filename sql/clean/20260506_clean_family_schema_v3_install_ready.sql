-- Clean family-only MyLearna schema draft v3, install-ready.
-- Draft only. Do not execute automatically against production.
-- This file is intended for clean install review, not direct rollout.
-- No legacy student, authority, classroom, teacher, intervention, or local-only
-- learner systems are referenced here.
--
-- v3 fix:
-- The default_learner_id column must exist on public.family_profiles before
-- any foreign key constraint references it. This file creates family_profiles
-- first, creates learners after, then adds the default learner foreign key
-- only after learners exists. It also adds the column with IF NOT EXISTS
-- before the foreign key is created so partial installs do not fail.

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
  updated_at timestamptz not null default now(),
  constraint family_profiles_week_start_check
    check (week_start in ('monday', 'sunday')),
  constraint family_profiles_reporting_mode_check
    check (reporting_mode in ('family-summary', 'progress-review', 'compliance-support'))
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_members_role_check
    check (role in ('owner', 'parent', 'caregiver')),
  constraint family_members_family_user_unique
    unique (family_id, user_id)
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
  add column if not exists default_learner_id uuid null;

alter table public.family_profiles
  drop constraint if exists family_profiles_default_learner_fk;

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
  constraint programs_status_check
    check (status in ('draft', 'active', 'archived'))
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  updated_at timestamptz not null default now(),
  constraint reporting_periods_date_range_check
    check (ends_on >= starts_on)
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
  constraint reports_status_check
    check (status in ('draft', 'ready', 'archived'))
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
  constraint report_exports_format_check
    check (export_format in ('pdf', 'html', 'docx'))
);

create index if not exists family_profiles_created_by_idx
  on public.family_profiles (created_by_user_id, updated_at desc);

create index if not exists family_members_user_idx
  on public.family_members (user_id, family_id);

create index if not exists learners_family_idx
  on public.learners (family_id, created_at desc);

create index if not exists programs_family_learner_idx
  on public.programs (family_id, learner_id, updated_at desc);

create index if not exists program_segments_family_program_idx
  on public.program_segments (family_id, program_id, segment_order);

create index if not exists calendar_items_family_learner_date_idx
  on public.calendar_items (family_id, learner_id, planned_date);

create index if not exists evidence_entries_family_learner_date_idx
  on public.evidence_entries (family_id, learner_id, observed_on desc);

create index if not exists reporting_periods_family_learner_idx
  on public.reporting_periods (family_id, learner_id, starts_on desc);

create index if not exists reports_family_learner_idx
  on public.reports (family_id, learner_id, updated_at desc);

create index if not exists report_sections_report_idx
  on public.report_sections (report_id, sort_order);

create index if not exists report_exports_report_idx
  on public.report_exports (report_id, created_at desc);

create or replace function public.clean_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create or replace function public.is_family_owner(target_family_id uuid)
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
      and fm.role = 'owner'
  )
$$;

grant execute on function public.current_family_ids() to authenticated;
grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.is_family_owner(uuid) to authenticated;

create or replace function public.clean_bootstrap_family_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_members (
    family_id,
    user_id,
    role,
    created_by_user_id
  )
  values (
    new.id,
    new.created_by_user_id,
    'owner',
    new.created_by_user_id
  )
  on conflict (family_id, user_id) do nothing;

  return new;
end;
$$;

create or replace function public.clean_validate_default_learner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  learner_family_id uuid;
begin
  if new.default_learner_id is null then
    return new;
  end if;

  select l.family_id
  into learner_family_id
  from public.learners l
  where l.id = new.default_learner_id;

  if learner_family_id is null then
    raise exception 'Default learner does not exist.';
  end if;

  if learner_family_id <> new.id then
    raise exception 'Default learner must belong to the same family profile.';
  end if;

  return new;
end;
$$;

drop trigger if exists clean_family_profiles_updated_at on public.family_profiles;
create trigger clean_family_profiles_updated_at
before update on public.family_profiles
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_family_members_updated_at on public.family_members;
create trigger clean_family_members_updated_at
before update on public.family_members
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_learners_updated_at on public.learners;
create trigger clean_learners_updated_at
before update on public.learners
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_programs_updated_at on public.programs;
create trigger clean_programs_updated_at
before update on public.programs
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_program_segments_updated_at on public.program_segments;
create trigger clean_program_segments_updated_at
before update on public.program_segments
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_calendar_items_updated_at on public.calendar_items;
create trigger clean_calendar_items_updated_at
before update on public.calendar_items
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_evidence_entries_updated_at on public.evidence_entries;
create trigger clean_evidence_entries_updated_at
before update on public.evidence_entries
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_portfolio_highlights_updated_at on public.portfolio_highlights;
create trigger clean_portfolio_highlights_updated_at
before update on public.portfolio_highlights
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_reporting_periods_updated_at on public.reporting_periods;
create trigger clean_reporting_periods_updated_at
before update on public.reporting_periods
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_reports_updated_at on public.reports;
create trigger clean_reports_updated_at
before update on public.reports
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_report_sections_updated_at on public.report_sections;
create trigger clean_report_sections_updated_at
before update on public.report_sections
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_family_profiles_bootstrap_owner on public.family_profiles;
create trigger clean_family_profiles_bootstrap_owner
after insert on public.family_profiles
for each row execute function public.clean_bootstrap_family_owner_membership();

drop trigger if exists clean_family_profiles_validate_default_learner on public.family_profiles;
create trigger clean_family_profiles_validate_default_learner
before insert or update on public.family_profiles
for each row execute function public.clean_validate_default_learner();

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
using (
  created_by_user_id = auth.uid()
  or public.is_family_member(id)
);

drop policy if exists "clean family profiles insert own" on public.family_profiles;
create policy "clean family profiles insert own"
on public.family_profiles
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
);

drop policy if exists "clean family profiles update own" on public.family_profiles;
create policy "clean family profiles update own"
on public.family_profiles
for update
to authenticated
using (
  created_by_user_id = auth.uid()
  or public.is_family_owner(id)
)
with check (
  created_by_user_id = auth.uid()
  or public.is_family_owner(id)
);

drop policy if exists "clean family profiles delete own" on public.family_profiles;
create policy "clean family profiles delete own"
on public.family_profiles
for delete
to authenticated
using (
  public.is_family_owner(id)
);

drop policy if exists "clean family members select own family" on public.family_members;
create policy "clean family members select own family"
on public.family_members
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean family members insert own family" on public.family_members;
create policy "clean family members insert own family"
on public.family_members
for insert
to authenticated
with check (
  public.is_family_owner(family_id)
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.family_profiles fp
      where fp.id = family_id
        and fp.created_by_user_id = auth.uid()
    )
  )
);

drop policy if exists "clean family members update own family" on public.family_members;
create policy "clean family members update own family"
on public.family_members
for update
to authenticated
using (
  public.is_family_owner(family_id)
)
with check (
  public.is_family_owner(family_id)
);

drop policy if exists "clean family members delete own family" on public.family_members;
create policy "clean family members delete own family"
on public.family_members
for delete
to authenticated
using (
  public.is_family_owner(family_id)
);

drop policy if exists "clean learners select own family" on public.learners;
create policy "clean learners select own family"
on public.learners
for select
to authenticated
using (
  public.is_family_member(family_id)
);

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
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean learners delete own family" on public.learners;
create policy "clean learners delete own family"
on public.learners
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean programs select own family" on public.programs;
create policy "clean programs select own family"
on public.programs
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean programs insert own family" on public.programs;
create policy "clean programs insert own family"
on public.programs
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean programs update own family" on public.programs;
create policy "clean programs update own family"
on public.programs
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean programs delete own family" on public.programs;
create policy "clean programs delete own family"
on public.programs
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean program segments select own family" on public.program_segments;
create policy "clean program segments select own family"
on public.program_segments
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean program segments insert own family" on public.program_segments;
create policy "clean program segments insert own family"
on public.program_segments
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean program segments update own family" on public.program_segments;
create policy "clean program segments update own family"
on public.program_segments
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean program segments delete own family" on public.program_segments;
create policy "clean program segments delete own family"
on public.program_segments
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean calendar items select own family" on public.calendar_items;
create policy "clean calendar items select own family"
on public.calendar_items
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean calendar items insert own family" on public.calendar_items;
create policy "clean calendar items insert own family"
on public.calendar_items
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean calendar items update own family" on public.calendar_items;
create policy "clean calendar items update own family"
on public.calendar_items
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean calendar items delete own family" on public.calendar_items;
create policy "clean calendar items delete own family"
on public.calendar_items
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean evidence entries select own family" on public.evidence_entries;
create policy "clean evidence entries select own family"
on public.evidence_entries
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean evidence entries insert own family" on public.evidence_entries;
create policy "clean evidence entries insert own family"
on public.evidence_entries
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean evidence entries update own family" on public.evidence_entries;
create policy "clean evidence entries update own family"
on public.evidence_entries
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean evidence entries delete own family" on public.evidence_entries;
create policy "clean evidence entries delete own family"
on public.evidence_entries
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean portfolio highlights select own family" on public.portfolio_highlights;
create policy "clean portfolio highlights select own family"
on public.portfolio_highlights
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean portfolio highlights insert own family" on public.portfolio_highlights;
create policy "clean portfolio highlights insert own family"
on public.portfolio_highlights
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean portfolio highlights update own family" on public.portfolio_highlights;
create policy "clean portfolio highlights update own family"
on public.portfolio_highlights
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean portfolio highlights delete own family" on public.portfolio_highlights;
create policy "clean portfolio highlights delete own family"
on public.portfolio_highlights
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean reporting periods select own family" on public.reporting_periods;
create policy "clean reporting periods select own family"
on public.reporting_periods
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean reporting periods insert own family" on public.reporting_periods;
create policy "clean reporting periods insert own family"
on public.reporting_periods
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean reporting periods update own family" on public.reporting_periods;
create policy "clean reporting periods update own family"
on public.reporting_periods
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean reporting periods delete own family" on public.reporting_periods;
create policy "clean reporting periods delete own family"
on public.reporting_periods
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean reports select own family" on public.reports;
create policy "clean reports select own family"
on public.reports
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean reports insert own family" on public.reports;
create policy "clean reports insert own family"
on public.reports
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean reports update own family" on public.reports;
create policy "clean reports update own family"
on public.reports
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean reports delete own family" on public.reports;
create policy "clean reports delete own family"
on public.reports
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean report sections select own family" on public.report_sections;
create policy "clean report sections select own family"
on public.report_sections
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean report sections insert own family" on public.report_sections;
create policy "clean report sections insert own family"
on public.report_sections
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean report sections update own family" on public.report_sections;
create policy "clean report sections update own family"
on public.report_sections
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean report sections delete own family" on public.report_sections;
create policy "clean report sections delete own family"
on public.report_sections
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean report exports select own family" on public.report_exports;
create policy "clean report exports select own family"
on public.report_exports
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean report exports insert own family" on public.report_exports;
create policy "clean report exports insert own family"
on public.report_exports
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and exported_by_user_id = auth.uid()
);

drop policy if exists "clean report exports update own family" on public.report_exports;
create policy "clean report exports update own family"
on public.report_exports
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean report exports delete own family" on public.report_exports;
create policy "clean report exports delete own family"
on public.report_exports
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

-- Verification SQL to run manually after installation.
-- These statements are intentionally commented out.
--
-- 1. Create a family profile as the authenticated user.
-- insert into public.family_profiles (
--   created_by_user_id,
--   display_name,
--   country_code,
--   jurisdiction_code,
--   curriculum_framework_id
-- ) values (
--   auth.uid(),
--   'My Clean Family',
--   'AU',
--   'tas',
--   'au-v9'
-- )
-- returning *;
--
-- 2. Verify the owner family_members row was auto-created.
-- select *
-- from public.family_members
-- where user_id = auth.uid();
--
-- 3. Create a learner in the same family.
-- insert into public.learners (
--   family_id,
--   first_name,
--   preferred_name,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   'Madeleine',
--   'Madeleine',
--   auth.uid()
-- )
-- returning *;
--
-- 4. Set default learner on the family profile.
-- update public.family_profiles
-- set default_learner_id = '<learner-id>'
-- where id = '<family-id>';
--
-- 5. Confirm the learner is readable only through the family scope.
-- select *
-- from public.learners
-- where family_id = '<family-id>';
--
-- 6. Confirm there is no global learner read.
-- select count(*)
-- from public.learners;
--
-- 7. In a separate authenticated session for another user,
--    the following should return zero rows:
-- select *
-- from public.family_profiles
-- where id = '<family-id>';
--
-- select *
-- from public.learners
-- where family_id = '<family-id>';
