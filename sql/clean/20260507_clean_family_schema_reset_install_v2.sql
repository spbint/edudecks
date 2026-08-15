-- Clean family-only MyLearna reset/install schema v2.
-- This script is destructive only to the clean rebuild tables listed below.
-- Do not execute automatically against production.
-- No legacy student, authority, classroom, teacher, intervention, cohort,
-- ranking, planner, or local-only learner systems are referenced here.

create extension if not exists pgcrypto;

alter table if exists public.family_profiles
  drop constraint if exists family_profiles_default_learner_fk;

drop table if exists public.guidance_states;
drop table if exists public.report_exports;
drop table if exists public.report_sections;
drop table if exists public.reports;
drop table if exists public.reporting_periods;
drop table if exists public.portfolio_highlights;
drop table if exists public.evidence_entries;
drop table if exists public.calendar_items;
drop table if exists public.learner_template_overrides;
drop table if exists public.template_blocks;
drop table if exists public.generation_runs;
drop table if exists public.blackout_days;
drop table if exists public.learning_periods;
drop table if exists public.academic_years;
drop table if exists public.master_templates;
drop table if exists public.program_segments;
drop table if exists public.programs;
drop table if exists public.learner_jurisdiction_profiles;
drop table if exists public.learners;
drop table if exists public.family_members;
drop table if exists public.family_profiles;

create table public.family_profiles (
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

create table public.family_members (
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

create table public.learners (
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

create table public.programs (
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

create table public.program_segments (
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

create table if not exists public.marketplace_resources (
  id uuid primary key default gen_random_uuid(),
  source text default 'shopify',
  external_product_id text not null,
  external_variant_id text,
  handle text not null,
  title text not null,
  thumbnail_url text,
  marketplace_area text,
  primary_collection text,
  subcollection text,
  resource_format text,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.calendar_items (
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
  learning_area text,
  session_label text,
  source_type text not null default 'manual',
  source_template_block_id uuid null,
  source_program_segment_id uuid null references public.program_segments(id) on delete set null,
  generation_run_id uuid null,
  is_highlighted boolean not null default false,
  marketplace_resource_id uuid null,
  completed_at timestamptz,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_items_source_type_check
    check (source_type in ('manual', 'generated', 'template')),
  constraint calendar_items_marketplace_resource_id_fkey
    foreign key (marketplace_resource_id)
    references public.marketplace_resources(id)
    on delete set null
);

create table public.evidence_entries (
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

create table public.portfolio_highlights (
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

create table public.reporting_periods (
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

create table public.reports (
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

create table public.report_sections (
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

create table public.report_exports (
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

create table public.learner_jurisdiction_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  country_code text not null,
  jurisdiction_code text,
  curriculum_framework_id text,
  year_level text,
  required_learning_areas jsonb not null default '[]'::jsonb,
  reporting_mode text not null default 'progress-review',
  review_cycle text,
  portfolio_required boolean not null default false,
  attendance_hours_required boolean not null default false,
  assessment_required boolean not null default false,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_jurisdiction_profiles_reporting_mode_check
    check (reporting_mode in ('low-documentation', 'attendance-hours', 'learning-plan', 'portfolio-evidence', 'progress-review', 'annual-pack')),
  constraint learner_jurisdiction_profiles_family_learner_unique
    unique (family_id, learner_id)
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  title text not null,
  country_code text,
  jurisdiction_code text,
  starts_on date not null,
  ends_on date not null,
  week_start text not null default 'monday',
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_years_date_range_check
    check (ends_on >= starts_on),
  constraint academic_years_week_start_check
    check (week_start in ('monday', 'sunday'))
);

create table public.learning_periods (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  title text not null,
  period_type text not null default 'term',
  starts_on date not null,
  ends_on date not null,
  is_break boolean not null default false,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_periods_type_check
    check (period_type in ('term', 'semester', 'unit', 'break', 'custom')),
  constraint learning_periods_date_range_check
    check (ends_on >= starts_on)
);

create table public.blackout_days (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  academic_year_id uuid null references public.academic_years(id) on delete cascade,
  learning_period_id uuid null references public.learning_periods(id) on delete cascade,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  reason text,
  is_learning_blocked boolean not null default true,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blackout_days_date_range_check
    check (ends_on >= starts_on)
);

create table public.master_templates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid null references public.learners(id) on delete set null,
  title text not null,
  description text,
  scope_type text not null default 'family',
  is_active boolean not null default true,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_templates_scope_type_check
    check (scope_type in ('family', 'learner'))
);

create table public.template_blocks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  master_template_id uuid not null references public.master_templates(id) on delete cascade,
  learner_id uuid null references public.learners(id) on delete set null,
  weekday integer not null,
  title text not null,
  learning_area text,
  starts_at time,
  ends_at time,
  program_id uuid null references public.programs(id) on delete set null,
  program_segment_id uuid null references public.program_segments(id) on delete set null,
  notes text,
  session_label text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint template_blocks_weekday_check
    check (weekday between 1 and 7)
);

create table public.learner_template_overrides (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  master_template_id uuid not null references public.master_templates(id) on delete cascade,
  template_block_id uuid null references public.template_blocks(id) on delete cascade,
  weekday integer not null,
  title text,
  learning_area text,
  starts_at time,
  ends_at time,
  notes text,
  is_disabled boolean not null default false,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_template_overrides_weekday_check
    check (weekday between 1 and 7)
);

create table public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  academic_year_id uuid null references public.academic_years(id) on delete set null,
  learning_period_id uuid null references public.learning_periods(id) on delete set null,
  master_template_id uuid null references public.master_templates(id) on delete set null,
  week_starts_on date not null,
  week_ends_on date not null,
  merge_strategy text not null default 'fill-empty',
  status text not null default 'preview',
  preview_payload jsonb not null default '[]'::jsonb,
  created_items_count integer not null default 0,
  skipped_items_count integer not null default 0,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_runs_date_range_check
    check (week_ends_on >= week_starts_on),
  constraint generation_runs_merge_strategy_check
    check (merge_strategy in ('fill-empty', 'confirm-each', 'dry-run')),
  constraint generation_runs_status_check
    check (status in ('preview', 'recorded', 'applied', 'cancelled'))
);

create table public.guidance_states (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  current_step_key text,
  completed_steps jsonb not null default '[]'::jsonb,
  dismissed_steps jsonb not null default '[]'::jsonb,
  is_my_day_ready boolean not null default false,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guidance_states_family_unique
    unique (family_id)
);

alter table public.calendar_items
  add constraint calendar_items_source_template_block_fk
  foreign key (source_template_block_id)
  references public.template_blocks(id)
  on delete set null;

alter table public.calendar_items
  add constraint calendar_items_generation_run_fk
  foreign key (generation_run_id)
  references public.generation_runs(id)
  on delete set null;

create index family_profiles_created_by_idx
  on public.family_profiles (created_by_user_id, updated_at desc);

create index family_members_user_idx
  on public.family_members (user_id, family_id);

create index learners_family_idx
  on public.learners (family_id, created_at desc);

create index programs_family_learner_idx
  on public.programs (family_id, learner_id, updated_at desc);

create index program_segments_family_program_idx
  on public.program_segments (family_id, program_id, segment_order);

create index calendar_items_family_learner_date_idx
  on public.calendar_items (family_id, learner_id, planned_date);

create index calendar_items_generation_idx
  on public.calendar_items (family_id, planned_date, source_type, generation_run_id);

create index idx_calendar_items_marketplace_resource_id
  on public.calendar_items using btree (marketplace_resource_id);

create index evidence_entries_family_learner_date_idx
  on public.evidence_entries (family_id, learner_id, observed_on desc);

create index reporting_periods_family_learner_idx
  on public.reporting_periods (family_id, learner_id, starts_on desc);

create index reports_family_learner_idx
  on public.reports (family_id, learner_id, updated_at desc);

create index report_sections_report_idx
  on public.report_sections (report_id, sort_order);

create index report_exports_report_idx
  on public.report_exports (report_id, created_at desc);

create index learner_jurisdiction_profiles_family_learner_idx
  on public.learner_jurisdiction_profiles (family_id, learner_id);

create index academic_years_family_dates_idx
  on public.academic_years (family_id, starts_on, ends_on);

create index learning_periods_family_year_dates_idx
  on public.learning_periods (family_id, academic_year_id, starts_on, ends_on);

create index blackout_days_family_dates_idx
  on public.blackout_days (family_id, starts_on, ends_on);

create index master_templates_family_scope_idx
  on public.master_templates (family_id, learner_id, is_active);

create index template_blocks_template_weekday_idx
  on public.template_blocks (master_template_id, weekday, starts_at);

create index learner_template_overrides_family_learner_idx
  on public.learner_template_overrides (family_id, learner_id, master_template_id);

create index generation_runs_family_week_idx
  on public.generation_runs (family_id, week_starts_on, week_ends_on);

create index guidance_states_family_idx
  on public.guidance_states (family_id);

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

create trigger clean_family_profiles_updated_at
before update on public.family_profiles
for each row execute function public.clean_set_updated_at();

create trigger clean_family_members_updated_at
before update on public.family_members
for each row execute function public.clean_set_updated_at();

create trigger clean_learners_updated_at
before update on public.learners
for each row execute function public.clean_set_updated_at();

create trigger clean_programs_updated_at
before update on public.programs
for each row execute function public.clean_set_updated_at();

create trigger clean_program_segments_updated_at
before update on public.program_segments
for each row execute function public.clean_set_updated_at();

create trigger clean_calendar_items_updated_at
before update on public.calendar_items
for each row execute function public.clean_set_updated_at();

create trigger clean_evidence_entries_updated_at
before update on public.evidence_entries
for each row execute function public.clean_set_updated_at();

create trigger clean_portfolio_highlights_updated_at
before update on public.portfolio_highlights
for each row execute function public.clean_set_updated_at();

create trigger clean_reporting_periods_updated_at
before update on public.reporting_periods
for each row execute function public.clean_set_updated_at();

create trigger clean_reports_updated_at
before update on public.reports
for each row execute function public.clean_set_updated_at();

create trigger clean_report_sections_updated_at
before update on public.report_sections
for each row execute function public.clean_set_updated_at();

create trigger clean_learner_jurisdiction_profiles_updated_at
before update on public.learner_jurisdiction_profiles
for each row execute function public.clean_set_updated_at();

create trigger clean_academic_years_updated_at
before update on public.academic_years
for each row execute function public.clean_set_updated_at();

create trigger clean_learning_periods_updated_at
before update on public.learning_periods
for each row execute function public.clean_set_updated_at();

create trigger clean_blackout_days_updated_at
before update on public.blackout_days
for each row execute function public.clean_set_updated_at();

create trigger clean_master_templates_updated_at
before update on public.master_templates
for each row execute function public.clean_set_updated_at();

create trigger clean_template_blocks_updated_at
before update on public.template_blocks
for each row execute function public.clean_set_updated_at();

create trigger clean_learner_template_overrides_updated_at
before update on public.learner_template_overrides
for each row execute function public.clean_set_updated_at();

create trigger clean_generation_runs_updated_at
before update on public.generation_runs
for each row execute function public.clean_set_updated_at();

create trigger clean_guidance_states_updated_at
before update on public.guidance_states
for each row execute function public.clean_set_updated_at();

create trigger clean_family_profiles_bootstrap_owner
after insert on public.family_profiles
for each row execute function public.clean_bootstrap_family_owner_membership();

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
alter table public.learner_jurisdiction_profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.learning_periods enable row level security;
alter table public.blackout_days enable row level security;
alter table public.master_templates enable row level security;
alter table public.template_blocks enable row level security;
alter table public.learner_template_overrides enable row level security;
alter table public.generation_runs enable row level security;
alter table public.guidance_states enable row level security;

create policy "clean family profiles select own"
on public.family_profiles
for select
to authenticated
using (
  created_by_user_id = auth.uid()
  or public.is_family_member(id)
);

create policy "clean family profiles insert own"
on public.family_profiles
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
);

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

create policy "clean family profiles delete own"
on public.family_profiles
for delete
to authenticated
using (
  public.is_family_owner(id)
);

create policy "clean family members select own family"
on public.family_members
for select
to authenticated
using (
  public.is_family_member(family_id)
);

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

create policy "clean family members delete own family"
on public.family_members
for delete
to authenticated
using (
  public.is_family_owner(family_id)
);

create policy "clean learners select own family"
on public.learners
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean learners insert own family"
on public.learners
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean learners delete own family"
on public.learners
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean programs select own family"
on public.programs
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean programs insert own family"
on public.programs
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean programs delete own family"
on public.programs
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean program segments select own family"
on public.program_segments
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean program segments insert own family"
on public.program_segments
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean program segments delete own family"
on public.program_segments
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean calendar items select own family"
on public.calendar_items
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean calendar items insert own family"
on public.calendar_items
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean calendar items delete own family"
on public.calendar_items
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean evidence entries select own family"
on public.evidence_entries
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean evidence entries insert own family"
on public.evidence_entries
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean evidence entries delete own family"
on public.evidence_entries
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean portfolio highlights select own family"
on public.portfolio_highlights
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean portfolio highlights insert own family"
on public.portfolio_highlights
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean portfolio highlights delete own family"
on public.portfolio_highlights
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean reporting periods select own family"
on public.reporting_periods
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean reporting periods insert own family"
on public.reporting_periods
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean reporting periods delete own family"
on public.reporting_periods
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean reports select own family"
on public.reports
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean reports insert own family"
on public.reports
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean reports delete own family"
on public.reports
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean report sections select own family"
on public.report_sections
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean report sections insert own family"
on public.report_sections
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

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

create policy "clean report sections delete own family"
on public.report_sections
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean report exports select own family"
on public.report_exports
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean report exports insert own family"
on public.report_exports
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and exported_by_user_id = auth.uid()
);

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

create policy "clean report exports delete own family"
on public.report_exports
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean learner jurisdiction profiles select own family"
on public.learner_jurisdiction_profiles
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean learner jurisdiction profiles insert own family"
on public.learner_jurisdiction_profiles
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean learner jurisdiction profiles update own family"
on public.learner_jurisdiction_profiles
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean learner jurisdiction profiles delete own family"
on public.learner_jurisdiction_profiles
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean academic years select own family"
on public.academic_years
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean academic years insert own family"
on public.academic_years
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean academic years update own family"
on public.academic_years
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean academic years delete own family"
on public.academic_years
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean learning periods select own family"
on public.learning_periods
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean learning periods insert own family"
on public.learning_periods
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean learning periods update own family"
on public.learning_periods
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean learning periods delete own family"
on public.learning_periods
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean blackout days select own family"
on public.blackout_days
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean blackout days insert own family"
on public.blackout_days
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean blackout days update own family"
on public.blackout_days
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean blackout days delete own family"
on public.blackout_days
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean master templates select own family"
on public.master_templates
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean master templates insert own family"
on public.master_templates
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean master templates update own family"
on public.master_templates
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean master templates delete own family"
on public.master_templates
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean template blocks select own family"
on public.template_blocks
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean template blocks insert own family"
on public.template_blocks
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean template blocks update own family"
on public.template_blocks
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean template blocks delete own family"
on public.template_blocks
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean learner template overrides select own family"
on public.learner_template_overrides
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean learner template overrides insert own family"
on public.learner_template_overrides
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean learner template overrides update own family"
on public.learner_template_overrides
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean learner template overrides delete own family"
on public.learner_template_overrides
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean generation runs select own family"
on public.generation_runs
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean generation runs insert own family"
on public.generation_runs
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean generation runs update own family"
on public.generation_runs
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean generation runs delete own family"
on public.generation_runs
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean guidance states select own family"
on public.guidance_states
for select
to authenticated
using (
  public.is_family_member(family_id)
);

create policy "clean guidance states insert own family"
on public.guidance_states
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

create policy "clean guidance states update own family"
on public.guidance_states
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

create policy "clean guidance states delete own family"
on public.guidance_states
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
-- 5. Create a program and segment.
-- insert into public.programs (
--   family_id,
--   learner_id,
--   title,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   '<learner-id>',
--   'Nature Study',
--   auth.uid()
-- )
-- returning *;
--
-- insert into public.program_segments (
--   family_id,
--   program_id,
--   learner_id,
--   title,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   '<program-id>',
--   '<learner-id>',
--   'Autumn Observation',
--   auth.uid()
-- )
-- returning *;
--
-- 6. Create an academic year, learning period, template, and generation run.
-- insert into public.academic_years (
--   family_id,
--   title,
--   starts_on,
--   ends_on,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   '2026',
--   '2026-01-01',
--   '2026-12-31',
--   auth.uid()
-- )
-- returning *;
--
-- insert into public.learning_periods (
--   family_id,
--   academic_year_id,
--   title,
--   starts_on,
--   ends_on,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   '<academic-year-id>',
--   'Term 1',
--   '2026-01-27',
--   '2026-04-09',
--   auth.uid()
-- )
-- returning *;
--
-- insert into public.master_templates (
--   family_id,
--   title,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   'Default Week',
--   auth.uid()
-- )
-- returning *;
--
-- insert into public.generation_runs (
--   family_id,
--   academic_year_id,
--   learning_period_id,
--   master_template_id,
--   week_starts_on,
--   week_ends_on,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   '<academic-year-id>',
--   '<learning-period-id>',
--   '<master-template-id>',
--   '2026-02-02',
--   '2026-02-08',
--   auth.uid()
-- )
-- returning *;
--
-- 7. Create a calendar item and evidence entry.
-- insert into public.calendar_items (
--   family_id,
--   learner_id,
--   title,
--   planned_date,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   '<learner-id>',
--   'Morning Read-Aloud',
--   current_date,
--   auth.uid()
-- )
-- returning *;
--
-- insert into public.evidence_entries (
--   family_id,
--   learner_id,
--   observed_on,
--   what_happened,
--   created_by_user_id
-- ) values (
--   '<family-id>',
--   '<learner-id>',
--   current_date,
--   'Completed a reflective reading discussion.',
--   auth.uid()
-- )
-- returning *;
--
-- 8. Confirm another authenticated user cannot read the family or learner rows.
-- select *
-- from public.family_profiles
-- where id = '<family-id>';
--
-- select *
-- from public.learners
-- where family_id = '<family-id>';
